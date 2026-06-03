/**
 * Scraper Engine for E-commerce Platforms
 * Uses a headless browser to extract real product metadata from affiliate links.
 */
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// Extrai o nome do produto de uma URL da Shopee
function extractShopeeTitle(targetUrl) {
  try {
    const urlObj = new URL(targetUrl);
    // Pega o último segmento do path antes do parâmetro de query
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      // O nome do produto fica antes do i.SHOPID.ITEMID
      const segment = pathParts[pathParts.length - 1];
      const productSlug = segment.replace(/-i\.[\d]+\.[\d]+$/, '');
      if (productSlug && productSlug.length > 3) {
        return decodeURIComponent(productSlug).replace(/-/g, ' ');
      }
    }
  } catch (e) { /* silencioso */ }
  return '';
}

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
        '--disable-blink-features=AutomationControlled',
        '--window-size=1280,800'
      ],
      ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });
    
    // Cabeçalhos extras para evitar detecção de bot
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });

    // Navigate to the target page - wait for load to ensure basic resources are ready
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    } catch (e) {
      console.warn(`[Scraper Engine] Navegação parcial para ${url}:`, e.message);
    }
    
    const finalUrl = page.url();
    
    const detectPlatform = (targetUrl) => {
      const lowerUrl = targetUrl.toLowerCase();
      if (lowerUrl.includes('amazon.')) return 'Amazon';
      if (lowerUrl.includes('shopee.')) return 'Shopee';
      if (lowerUrl.includes('magalu.') || lowerUrl.includes('magazineluiza.')) return 'Magalu';
      if (lowerUrl.includes('hotmart.')) return 'Hotmart';
      if (lowerUrl.includes('kiwify.')) return 'Kiwify';
      return 'Outra';
    };

    const platform = detectPlatform(finalUrl) !== 'Outra' ? detectPlatform(finalUrl) : detectPlatform(url);

    // Dar um tempo de espera padrão para garantir a renderização de elementos dinâmicos (6s para a Shopee, 4s para outros)
    if (platform === 'Shopee') {
      await new Promise(r => setTimeout(r, 6000));
    } else {
      await new Promise(r => setTimeout(r, 4000));
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

      // Title extraction — Open Graph é prioritário pois a Shopee o define corretamente
      let title = '';

      // 1. Tentar Open Graph / Twitter Card primeiro (funciona bem na Shopee)
      title = getMeta(['og:title', 'twitter:title']);

      // 2. Seletores específicos por plataforma
      if (!title) {
        if (platform === 'Amazon') {
          const amzTitle = document.querySelector('#productTitle');
          if (amzTitle) title = amzTitle.textContent.trim();
        } else if (platform === 'Shopee') {
          // Shopee usa vários seletores conforme a versão do layout
          const shopeeSelectors = [
            '[data-testid="product-title"]',
            '.product-briefing .page-product__title',
            'h1._1wbfK',
            'div._1QFHt span',
            'h1'
          ];
          for (const sel of shopeeSelectors) {
            const el = document.querySelector(sel);
            if (el && el.textContent.trim().length > 3) {
              title = el.textContent.trim();
              break;
            }
          }
        } else if (platform === 'Magalu') {
          const magaluTitle = document.querySelector('h1.header-product__title, h1[class*="Title"], h1');
          if (magaluTitle) title = magaluTitle.textContent.trim();
        }
      }

      // 3. JSON-LD
      if (!title && ldJsonData.name) title = ldJsonData.name;

      // 4. Fallback de alta confiabilidade via document.title antes de H1 genérico
      if (!title && document.title) {
        title = document.title;
      }

      // 5. H1 genérico (se document.title não existir ou estiver vazio)
      if (!title) {
        const h1 = document.querySelector('h1');
        if (h1 && h1.textContent && h1.textContent.trim().length > 3) {
          title = h1.textContent.trim();
        }
      }

      if (title) {
        title = title.replace(/\s+/g, ' ');
        // Remover sufixos de plataforma comuns e marcas
        title = title
          .split(' | ')[0]
          .split(' - Shopee')[0]
          .split(' | Shopee')[0]
          .split(' - Amazon')[0]
          .split(' | Amazon')[0]
          .split(' - Magazine Luiza')[0]
          .split(' - Magalu')[0]
          .split(' | Magalu')[0]
          .split(' | Hotmart')[0]
          .split(' - Hotmart')[0]
          .split(' | Kiwify')[0]
          .split(' - Kiwify')[0]
          .trim();
      }

      // Thumbnail image extraction — Open Graph é a fonte mais confiável
      let imageUrl = '';

      // 1. Open Graph/Twitter (Shopee sempre define og:image)
      imageUrl = getMeta(['og:image', 'twitter:image', 'twitter:image:src']);

      // 2. Seletores específicos por plataforma
      if (!imageUrl) {
        if (platform === 'Amazon') {
          const amzImg = document.querySelector('#landingImage, #imgBlkFront');
          if (amzImg) {
            imageUrl = amzImg.getAttribute('src') || amzImg.getAttribute('data-old-hires') || amzImg.getAttribute('data-a-dynamic-image');
          }
          // Caso a Amazon utilize imagens dinâmicas (data-a-dynamic-image é um JSON contendo as URLs como chaves)
          if (imageUrl && imageUrl.startsWith('{')) {
            try {
              const parsedUrls = Object.keys(JSON.parse(imageUrl));
              if (parsedUrls.length > 0) imageUrl = parsedUrls[0];
            } catch (e) {}
          }
          // Busca inteligente por CDN da Amazon
          if (!imageUrl) {
            const amzImgs = Array.from(document.querySelectorAll('img'));
            const amzImgFound = amzImgs.find(img => {
              const src = img.src || '';
              const id = img.id || '';
              return (src.includes('images-amazon.com') || src.includes('media-amazon.com')) && 
                     (id === 'landingImage' || id === 'imgBlkFront' || img.className.includes('a-dynamic-image'));
            });
            if (amzImgFound) imageUrl = amzImgFound.src;
          }
        } else if (platform === 'Shopee') {
          // Busca inteligente por CDN da Shopee
          const shopeeImgs = Array.from(document.querySelectorAll('img'));
          const cdnImg = shopeeImgs.find(img => {
            const src = img.src || '';
            return (src.includes('img.sghcdn.net') || src.includes('cf.shopee.com.br')) && !src.includes('logo');
          });
          if (cdnImg) {
            imageUrl = cdnImg.src;
          } else {
            // Múltiplos seletores de imagem da Shopee
            const shopeeImgSelectors = [
              'div._3c5Ro img',
              'div.product-image img',
              'img[class*="product-image"]',
              'img[class*="ProductImage"]',
              'div[data-testid="gallery"] img',
              'div.view-model img',
              'img'
            ];
            for (const sel of shopeeImgSelectors) {
              const el = document.querySelector(sel);
              if (el && el.src && el.src.startsWith('http') && !el.src.includes('logo')) {
                imageUrl = el.src;
                break;
              }
            }
          }
        } else if (platform === 'Magalu') {
          const magaluImg = document.querySelector('img[class*="ProductImage"], img[class*="product-image"], picture img');
          if (magaluImg) imageUrl = magaluImg.getAttribute('src');
        }
      }

      // 3. JSON-LD
      if (!imageUrl && ldJsonData.image) {
        imageUrl = Array.isArray(ldJsonData.image) ? ldJsonData.image[0] : ldJsonData.image;
      }

      // 4. Imagem maior da página
      if (!imageUrl) {
        const imgs = Array.from(document.querySelectorAll('img'));
        const largeImg = imgs.find(img => {
          const src = (img.src || '').toLowerCase();
          const alt = (img.alt || '').toLowerCase();
          const isBadPattern = src.includes('arrow') || src.includes('left') || src.includes('chevron') || 
                               src.includes('back') || src.includes('logo') || src.includes('icon') || 
                               alt.includes('arrow') || alt.includes('left') || alt.includes('chevron') || 
                               alt.includes('back') || alt.includes('logo') || alt.includes('icon');
          return img.width > 200 && img.height > 200 && img.src && img.src.startsWith('http') && !isBadPattern;
        });
        if (largeImg) imageUrl = largeImg.src;
      }

      // Price extraction
      let originalPriceStr = '';
      let salePriceStr = '';

      // JSON-LD offers
      if (ldJsonData.offers) {
        const offers = ldJsonData.offers;
        if (Array.isArray(offers)) {
          const mainOffer = offers.find(o => o.price) || offers[0];
          if (mainOffer && mainOffer.price) salePriceStr = mainOffer.price.toString();
        } else if (offers.price) {
          salePriceStr = offers.price.toString();
        } else if (offers.lowPrice) {
          salePriceStr = offers.lowPrice.toString();
        }
      }

      if (platform === 'Amazon') {
        const amzOriginal = document.querySelector(
          '.basisPrice .a-offscreen, .a-text-price .a-offscreen, #priceblock_strikeprice, #priceblock_saleprice'
        );
        if (amzOriginal) originalPriceStr = amzOriginal.textContent;

        const amzSale = document.querySelector(
          '.a-price .a-offscreen, #priceblock_ourprice, #priceblock_dealprice, #price_inside_buybox, .apexPriceToPay .a-offscreen, .priceToPay .a-offscreen, .a-price-whole'
        );
        if (amzSale) {
          salePriceStr = amzSale.textContent;
          // Se capturamos apenas o inteiro (.a-price-whole), tentamos pegar a fração
          if (amzSale.classList.contains('a-price-whole')) {
            const fraction = document.querySelector('.a-price-fraction');
            if (fraction) {
              salePriceStr = salePriceStr.replace(/[^0-9]/g, '') + '.' + fraction.textContent.replace(/[^0-9]/g, '');
            }
          }
        } else {
          const whole = document.querySelector('.a-price-whole');
          const fraction = document.querySelector('.a-price-fraction');
          if (whole && fraction) {
            salePriceStr = whole.textContent.replace(/[^0-9]/g, '') + '.' + fraction.textContent.replace(/[^0-9]/g, '');
          }
        }
      } else if (platform === 'Shopee') {
        // Shopee: múltiplos seletores de preço pois as classes mudam
        const shopeeSelectors = [
          '._3n5NR',
          '._3a1N-',
          '.pqTWkA',
          '.G27NV',
          '[class*="price-current"]',
          '[class*="current-price"]',
          '[class*="Price"] span',
          '.line-through + span',
        ];
        for (const sel of shopeeSelectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent.match(/[0-9]/)) {
            salePriceStr = el.textContent;
            break;
          }
        }
        // Preço original da Shopee (tachado)
        const shopeeOrigSelectors = ['.line-through', '._1wBfKS', '.Y5bM7t', '[class*="origin-price"]'];
        for (const sel of shopeeOrigSelectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent.match(/[0-9]/)) {
            originalPriceStr = el.textContent;
            break;
          }
        }
      } else if (platform === 'Magalu') {
        const magaluPrice = document.querySelector('[class*="Price__Value"], [class*="price__value"], [data-testid="price-value"]');
        if (magaluPrice) salePriceStr = magaluPrice.textContent;
      }

      // Meta tags de preço como fallback
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

    let finalTitle = parsedData.title || '';
    const isBotOrGeneric = !finalTitle || 
      finalTitle.toLowerCase() === 'shopee' || 
      finalTitle.toLowerCase().includes('robot check') || 
      finalTitle.toLowerCase().includes('captcha') || 
      finalTitle.toLowerCase().includes('acesso negado') ||
      finalTitle.toLowerCase().includes('not found') ||
      finalTitle.toLowerCase().includes('não foi possível');

    if (platform === 'Shopee' && isBotOrGeneric) {
      const urlTitle = extractShopeeTitle(url) || extractShopeeTitle(finalUrl);
      if (urlTitle) {
        finalTitle = urlTitle;
      }
    }

    if (!finalTitle) {
      finalTitle = `Oferta imperdivel ${platform}`;
    }

    // Se o thumbnail vier vazio ou contiver padrões de ícones inválidos (ex: setas de navegação pequenas)
    let finalThumbnail = parsedData.thumbnail_url || '';
    const lowerThumb = finalThumbnail.toLowerCase();
    const isBadImage = !finalThumbnail ||
      lowerThumb.includes('arrow-') || 
      lowerThumb.includes('chevron-') || 
      lowerThumb.includes('icon-') ||
      (lowerThumb.includes('logo') && !lowerThumb.includes('product')) || // logo genérico
      lowerThumb.includes('/logo.') ||
      lowerThumb.includes('/icon.') ||
      lowerThumb.includes('arrow_left') ||
      lowerThumb.includes('arrow_right');

    if (isBadImage) {
      finalThumbnail = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';
    }

    return {
      success: true,
      title: finalTitle,
      original_url: url,
      platform,
      original_price: final_original,
      sale_price: final_sale,
      thumbnail_url: finalThumbnail,
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
