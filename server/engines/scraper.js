/**
 * Scraper Engine for E-commerce Platforms
 * Uses a headless browser to extract real product metadata from affiliate links.
 */
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrapeProduct(url) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-blink-features=AutomationControlled'
      ],
      ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to the target page with a 20-second timeout
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
    
    const finalUrl = page.url();
    
    const detectPlatform = (targetUrl) => {
      const lowerUrl = targetUrl.toLowerCase();
      if (lowerUrl.includes('amazon.')) return 'Amazon';
      if (lowerUrl.includes('shopee.')) return 'Shopee';
      if (lowerUrl.includes('aliexpress.')) return 'AliExpress';
      if (lowerUrl.includes('mercadolivre.') || lowerUrl.includes('mercadolibre.')) return 'Mercado Livre';
      return 'Outra';
    };

    const platform = detectPlatform(finalUrl) !== 'Outra' ? detectPlatform(finalUrl) : detectPlatform(url);

    // Wait for JS rendering on complex SPAs
    if (platform === 'Mercado Livre' || platform === 'Shopee') {
      await new Promise(r => setTimeout(r, 3000));
    }

    // Extract page metadata in browser context
    const parsedData = await page.evaluate((platform) => {
      const getMeta = (namesOrProperties) => {
        for (const name of namesOrProperties) {
          const el = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
          if (el && el.getAttribute('content')) {
            return el.getAttribute('content').trim();
          }
        }
        return '';
      };

      // Attempt to parse JSON-LD
      let ldJsonData = {};
      try {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
          const parsed = JSON.parse(script.textContent);
          const findProduct = (obj) => {
            if (!obj) return null;
            if (obj['@type'] === 'Product') return obj;
            if (Array.isArray(obj)) {
              for (const item of obj) {
                const res = findProduct(item);
                if (res) return res;
              }
            }
            if (obj['@graph'] && Array.isArray(obj['@graph'])) {
              for (const item of obj['@graph']) {
                const res = findProduct(item);
                if (res) return res;
              }
            }
            return null;
          };
          
          const prodObj = findProduct(parsed);
          if (prodObj) {
            ldJsonData = prodObj;
            break;
          }
        }
      } catch (e) {
        // Silent error
      }

      // Title extraction
      let title = '';
      if (platform === 'Amazon') {
        const amzTitle = document.querySelector('#productTitle');
        if (amzTitle) title = amzTitle.textContent.trim();
      } else if (platform === 'Mercado Livre') {
        const mlTitle = document.querySelector('h1.ui-pdp-title, h1');
        if (mlTitle) title = mlTitle.textContent.trim();
      } else if (platform === 'Shopee') {
        const shopeeTitle = document.querySelector('div[data-testid="product-title"], span.WBneNf, h1');
        if (shopeeTitle) title = shopeeTitle.textContent.trim();
      }

      if (!title) {
        title = getMeta(['og:title', 'twitter:title']);
      }
      if (!title && ldJsonData.name) {
        title = ldJsonData.name;
      }
      if (!title) {
        const h1 = document.querySelector('h1');
        title = h1 ? h1.textContent.trim() : document.title;
      }

      if (title) {
        title = title.replace(/\s+/g, ' ');
        if (title.includes(' | MercadoLivre')) title = title.split(' | ')[0];
        if (title.includes(' | Shopee')) title = title.split(' | ')[0];
      }

      // Thumbnail image extraction
      let imageUrl = '';
      if (platform === 'Amazon') {
        const amzImg = document.querySelector('#landingImage, #imgBlkFront');
        if (amzImg) imageUrl = amzImg.getAttribute('src') || amzImg.getAttribute('data-old-hires');
      } else if (platform === 'Mercado Livre') {
        const mlImg = document.querySelector('.ui-pdp-gallery__figure__image, .ui-pdp-image, img.ui-pdp-image');
        if (mlImg) imageUrl = mlImg.getAttribute('src') || mlImg.getAttribute('data-zoom');
      } else if (platform === 'Shopee') {
        const shopeeImg = document.querySelector('div.flex-col img[style*="object-fit: contain"], img.view-model');
        if (shopeeImg) imageUrl = shopeeImg.getAttribute('src');
      }

      if (!imageUrl) {
        imageUrl = getMeta(['og:image', 'twitter:image', 'twitter:image:src']);
      }
      if (!imageUrl && ldJsonData.image) {
        imageUrl = Array.isArray(ldJsonData.image) ? ldJsonData.image[0] : ldJsonData.image;
      }
      if (!imageUrl) {
        const imgs = Array.from(document.querySelectorAll('img'));
        const largeImg = imgs.find(img => img.width > 200 && img.height > 200);
        if (largeImg) imageUrl = largeImg.src;
      }

      // Price extraction
      let originalPriceStr = '';
      let salePriceStr = '';

      if (ldJsonData.offers) {
        const offers = ldJsonData.offers;
        if (Array.isArray(offers)) {
          const mainOffer = offers.find(o => o.price) || offers[0];
          if (mainOffer && mainOffer.price) {
            salePriceStr = mainOffer.price.toString();
          }
        } else if (offers.price) {
          salePriceStr = offers.price.toString();
        } else if (offers.lowPrice) {
          salePriceStr = offers.lowPrice.toString();
        }
      }

      if (platform === 'Amazon') {
        const amzOriginal = document.querySelector('.basisPrice .a-offscreen, .a-text-price .a-offscreen');
        if (amzOriginal) originalPriceStr = amzOriginal.textContent;

        const amzSale = document.querySelector('.a-price .a-offscreen, #priceblock_ourprice, #priceblock_dealprice');
        if (amzSale) {
          salePriceStr = amzSale.textContent;
        } else {
          const whole = document.querySelector('.a-price-whole');
          const fraction = document.querySelector('.a-price-fraction');
          if (whole && fraction) {
            salePriceStr = whole.textContent.replace(/[^0-9]/g, '') + '.' + fraction.textContent.replace(/[^0-9]/g, '');
          }
        }
      } else if (platform === 'Mercado Livre') {
        const mlOriginal = document.querySelector('.ui-pdp-price__original-value .andes-money-amount__fraction');
        const mlOriginalDec = document.querySelector('.ui-pdp-price__original-value .andes-money-amount__cents');
        if (mlOriginal) {
          originalPriceStr = mlOriginal.textContent.replace(/\./g, '');
          if (mlOriginalDec) originalPriceStr += '.' + mlOriginalDec.textContent;
        }

        const mlSale = document.querySelector('.ui-pdp-price__second-line .andes-money-amount__fraction');
        const mlSaleDec = document.querySelector('.ui-pdp-price__second-line .andes-money-amount__cents');
        if (mlSale) {
          salePriceStr = mlSale.textContent.replace(/\./g, '');
          if (mlSaleDec) salePriceStr += '.' + mlSaleDec.textContent;
        }
      } else if (platform === 'Shopee') {
        const shopeeSale = document.querySelector('div.pqTWkA, div.G27NV, .flex.items-center .text-orange-500');
        if (shopeeSale) salePriceStr = shopeeSale.textContent;
        const shopeeOriginal = document.querySelector('div._1wBfKS, div.Y5bM7t, .line-through');
        if (shopeeOriginal) originalPriceStr = shopeeOriginal.textContent;
      }

      if (!salePriceStr) {
        salePriceStr = getMeta(['product:price:amount', 'og:price:amount', 'price']);
      }

      return {
        title,
        thumbnail_url: imageUrl,
        original_price_raw: originalPriceStr,
        sale_price_raw: salePriceStr,
        tags_raw: getMeta(['keywords', 'news_keywords'])
      };
    }, platform);

    // Clean and parse price values
    const parsePrice = (priceStr) => {
      if (!priceStr) return null;
      let cleaned = priceStr.toString()
        .replace(/R\$/g, '')
        .replace(/\u00a0/g, '')
        .trim();
      
      if (cleaned.includes(',') && cleaned.includes('.')) {
        cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
      } else if (cleaned.includes(',')) {
        cleaned = cleaned.replace(/,/g, '.');
      }
      
      const parsed = parseFloat(cleaned.replace(/[^0-9.]/g, ''));
      return isNaN(parsed) ? null : parsed;
    };

    const original_price = parsePrice(parsedData.original_price_raw);
    const sale_price = parsePrice(parsedData.sale_price_raw);

    let final_original = original_price;
    let final_sale = sale_price;

    if (final_original && final_sale && final_sale > final_original) {
      const temp = final_original;
      final_original = final_sale;
      final_sale = temp;
    }

    // Build unique tags
    let tagsList = [];
    if (platform) tagsList.push(platform.toLowerCase().replace(/\s+/g, ''));
    if (parsedData.tags_raw) {
      tagsList.push(...parsedData.tags_raw.split(',').map(t => t.trim().toLowerCase()));
    } else if (parsedData.title) {
      const keywords = parsedData.title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .split(' ')
        .filter(word => word.length > 4)
        .slice(0, 3);
      tagsList.push(...keywords);
    }
    const tags = Array.from(new Set(tagsList)).join(', ');

    return {
      success: true,
      title: parsedData.title || `Oferta imperdivel ${platform}`,
      original_url: url,
      platform,
      original_price: final_original,
      sale_price: final_sale,
      thumbnail_url: parsedData.thumbnail_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
      tags
    };

  } catch (err) {
    console.error(`[Scraper Engine] Erro ao raspar ${url}:`, err.message);
    throw err;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

module.exports = { scrapeProduct };
