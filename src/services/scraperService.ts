/**
 * scraperService.ts
 * Motor de raspagem de produtos 100% Frontend.
 * Utiliza a ScraperAPI para contornar as restricoes de CORS e proxies dos marketplaces,
 * e o DOMParser nativo do navegador para extrair os dados do HTML retornado.
 */

const SCRAPER_API_KEY = import.meta.env.VITE_SCRAPER_API_KEY;

export interface ScrapeResult {
  success: boolean;
  title: string;
  platform: string;
  original_price: number | null;
  sale_price: number | null;
  thumbnail_url: string;
  tags: string;
  original_url: string;
}

function detectPlatform(url: string): string {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('amazon.')) return 'Amazon';
  if (lowerUrl.includes('shopee.')) return 'Shopee';
  if (lowerUrl.includes('magalu.') || lowerUrl.includes('magazineluiza.') || lowerUrl.includes('magazinevoce.')) return 'Magalu';
  if (lowerUrl.includes('hotmart.')) return 'Hotmart';
  if (lowerUrl.includes('kiwify.')) return 'Kiwify';
  return 'Outra';
}

function getMeta(doc: Document, namesOrProperties: string[]): string {
  for (const name of namesOrProperties) {
    const el = doc.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
    if (el && el.getAttribute('content')) {
      return el.getAttribute('content')!.trim();
    }
  }
  return '';
}

function parsePrice(priceStr: string): number | null {
  if (!priceStr) return null;
  let cleaned = priceStr
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
}

function findProductInLdJson(doc: Document): Record<string, any> | null {
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script.textContent || '');
      const findProduct = (obj: any): any => {
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
      const product = findProduct(parsed);
      if (product) return product;
    } catch (e) {
      // Silencioso
    }
  }
  return null;
}

function extractTitle(doc: Document, platform: string): string {
  let title = '';

  // 1. Open Graph / Twitter (Shopee sempre define og:title)
  title = getMeta(doc, ['og:title', 'twitter:title']);

  // 2. Seletores especificos por plataforma
  if (!title) {
    if (platform === 'Amazon') {
      const el = doc.querySelector('#productTitle');
      if (el) title = el.textContent?.trim() || '';
    } else if (platform === 'Shopee') {
      const selectors = [
        '[data-testid="product-title"]',
        '.product-briefing .page-product__title',
        'h1._1wbfK',
        'div._1QFHt span',
        'h1',
      ];
      for (const sel of selectors) {
        const el = doc.querySelector(sel);
        if (el && (el.textContent?.trim().length || 0) > 3) {
          title = el.textContent!.trim();
          break;
        }
      }
    } else if (platform === 'Magalu') {
      const titleSelectors = [
        'h1.header-product__title',
        'h1[class*="Title"]',
        'h1[data-testid="product-title"]',
        'h1'
      ];
      for (const sel of titleSelectors) {
        const el = doc.querySelector(sel);
        if (el && el.textContent?.trim()) {
          title = el.textContent.trim();
          break;
        }
      }
    }
  }

  // 3. JSON-LD
  if (!title) {
    const product = findProductInLdJson(doc);
    if (product?.name) title = product.name;
  }

  // 4. Titulo da aba (document.title) como fallback seguro
  if (!title && doc.title) {
    title = doc.title;
  }

  // 5. H1 generico como ultimo recurso
  if (!title) {
    const h1 = doc.querySelector('h1');
    if (h1 && (h1.textContent?.trim().length || 0) > 3) {
      title = h1.textContent!.trim();
    }
  }

  // Limpar sufixos de plataformas
  if (title) {
    title = title
      .replace(/\s+/g, ' ')
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

  return title || `Oferta imperdivel ${platform}`;
}

function extractImage(doc: Document, platform: string): string {
  // 1. Open Graph / Twitter
  let imageUrl = getMeta(doc, ['og:image', 'twitter:image', 'twitter:image:src']);

  // 2. Seletores especificos por plataforma
  if (!imageUrl) {
    if (platform === 'Amazon') {
      const amzImg = doc.querySelector<HTMLImageElement>('#landingImage, #imgBlkFront');
      if (amzImg) {
        // Tenta data-a-dynamic-image primeiro (e um JSON com URLs como chaves)
        const dynamicImgJson = amzImg.getAttribute('data-a-dynamic-image');
        if (dynamicImgJson && dynamicImgJson.startsWith('{')) {
          try {
            const urls = Object.keys(JSON.parse(dynamicImgJson));
            if (urls.length > 0) imageUrl = urls[0];
          } catch (e) {}
        }
        if (!imageUrl) {
          imageUrl = amzImg.getAttribute('src') || amzImg.getAttribute('data-old-hires') || '';
        }
      }
      // CDN da Amazon como fallback
      if (!imageUrl) {
        const imgs = Array.from(doc.querySelectorAll<HTMLImageElement>('img'));
        const cdnImg = imgs.find(img => {
          const src = img.getAttribute('src') || '';
          return src.includes('images-amazon.com') || src.includes('media-amazon.com');
        });
        if (cdnImg) imageUrl = cdnImg.getAttribute('src') || '';
      }
    } else if (platform === 'Shopee') {
      // CDN da Shopee como prioridade
      const imgs = Array.from(doc.querySelectorAll<HTMLImageElement>('img'));
      const cdnImg = imgs.find(img => {
        const src = img.getAttribute('src') || '';
        return (src.includes('img.sghcdn.net') || src.includes('cf.shopee.com.br')) && !src.includes('logo');
      });
      if (cdnImg) {
        imageUrl = cdnImg.getAttribute('src') || '';
      } else {
        const shopeeSelectors = [
          'div._3c5Ro img',
          'div.product-image img',
          'img[class*="product-image"]',
          'img[class*="ProductImage"]',
          'div[data-testid="gallery"] img',
        ];
        for (const sel of shopeeSelectors) {
          const el = doc.querySelector<HTMLImageElement>(sel);
          if (el) {
            const src = el.getAttribute('src') || '';
            if (src.startsWith('http') && !src.includes('logo')) {
              imageUrl = src;
              break;
            }
          }
        }
      }
    } else if (platform === 'Magalu') {
      const el = doc.querySelector<HTMLImageElement>(
        'img[class*="ProductImage"], img[class*="product-image"], picture img, img[data-testid="image-selected"], [class*="image-selected"] img'
      );
      if (el) imageUrl = el.getAttribute('src') || '';
    }
  }

  // 3. JSON-LD como fallback de imagem
  if (!imageUrl) {
    const product = findProductInLdJson(doc);
    if (product?.image) {
      imageUrl = Array.isArray(product.image) ? product.image[0] : product.image;
    }
  }

  // Verificar se a imagem e valida (nao e um icone ou seta de navegacao)
  const lowerThumb = (imageUrl || '').toLowerCase();
  const isBadImage =
    !imageUrl ||
    lowerThumb.includes('arrow-') ||
    lowerThumb.includes('chevron-') ||
    lowerThumb.includes('icon-') ||
    (lowerThumb.includes('logo') && !lowerThumb.includes('product')) ||
    lowerThumb.includes('/logo.') ||
    lowerThumb.includes('/icon.') ||
    lowerThumb.includes('arrow_left') ||
    lowerThumb.includes('arrow_right');

  // Se a imagem não for válida, retornar string vazia (sem imagem genérica)
  return isBadImage ? '' : imageUrl;
}

function extractPrices(
  doc: Document,
  platform: string
): { original_price: number | null; sale_price: number | null } {
  let originalPriceStr = '';
  let salePriceStr = '';

  // JSON-LD offers como fonte mais confiavel
  const product = findProductInLdJson(doc);
  if (product?.offers) {
    const offers = product.offers;
    if (Array.isArray(offers)) {
      const mainOffer = offers.find((o: any) => o.price) || offers[0];
      if (mainOffer?.price) salePriceStr = mainOffer.price.toString();
    } else if (offers.price) {
      salePriceStr = offers.price.toString();
    } else if (offers.lowPrice) {
      salePriceStr = offers.lowPrice.toString();
    }
  }

  // Seletores especificos por plataforma como complemento
  if (!salePriceStr) {
    if (platform === 'Amazon') {
      const amzSale = doc.querySelector(
        '.a-price .a-offscreen, #priceblock_ourprice, #priceblock_dealprice, #price_inside_buybox, .apexPriceToPay .a-offscreen, .priceToPay .a-offscreen'
      );
      if (amzSale) {
        salePriceStr = amzSale.textContent || '';
      } else {
        const whole = doc.querySelector('.a-price-whole');
        const fraction = doc.querySelector('.a-price-fraction');
        if (whole && fraction) {
          salePriceStr =
            whole.textContent!.replace(/[^0-9]/g, '') +
            '.' +
            fraction.textContent!.replace(/[^0-9]/g, '');
        }
      }
      const amzOriginal = doc.querySelector(
        '.basisPrice .a-offscreen, .a-text-price .a-offscreen, #priceblock_strikeprice'
      );
      if (amzOriginal) originalPriceStr = amzOriginal.textContent || '';
    } else if (platform === 'Shopee') {
      const saleSelectors = [
        '._3n5NR',
        '._3a1N-',
        '.pqTWkA',
        '.G27NV',
        '[class*="price-current"]',
        '[class*="current-price"]',
      ];
      for (const sel of saleSelectors) {
        const el = doc.querySelector(sel);
        if (el && /[0-9]/.test(el.textContent || '')) {
          salePriceStr = el.textContent || '';
          break;
        }
      }
      const origSelectors = ['.line-through', '._1wBfKS', '.Y5bM7t', '[class*="origin-price"]'];
      for (const sel of origSelectors) {
        const el = doc.querySelector(sel);
        if (el && /[0-9]/.test(el.textContent || '')) {
          originalPriceStr = el.textContent || '';
          break;
        }
      }
    } else if (platform === 'Magalu') {
      const saleSelectors = [
        '[class*="Price__Value"]',
        '[class*="price__value"]',
        '[data-testid="price-value"]',
        '.u-price',
        'span[class*="price"]',
        'p[class*="price"]',
        '[class*="current-price"]'
      ];
      for (const sel of saleSelectors) {
        const el = doc.querySelector(sel);
        if (el && /[0-9]/.test(el.textContent || '')) {
          salePriceStr = el.textContent || '';
          break;
        }
      }
    }
  }

  // Meta tags de preco como ultimo fallback
  if (!salePriceStr) {
    salePriceStr = getMeta(doc, ['product:price:amount', 'og:price:amount', 'price']);
  }

  let original_price = parsePrice(originalPriceStr);
  let sale_price = parsePrice(salePriceStr);

  // Garantir que o preco de venda seja sempre o menor
  if (original_price && sale_price && sale_price > original_price) {
    const temp = original_price;
    original_price = sale_price;
    sale_price = temp;
  }

  return { original_price, sale_price };
}

function buildTags(doc: Document, platform: string, title: string): string {
  const tagsList: string[] = [];
  if (platform && platform !== 'Outra') tagsList.push(platform.toLowerCase());

  const keywords = getMeta(doc, ['keywords', 'news_keywords']);
  if (keywords) {
    tagsList.push(
      ...keywords
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 2)
        .slice(0, 4)
    );
  } else if (title) {
    const words = title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(' ')
      .filter((w) => w.length > 4)
      .slice(0, 3);
    tagsList.push(...words);
  }

  return Array.from(new Set(tagsList)).join(', ');
}

export async function scrapeProduct(url: string): Promise<ScrapeResult> {
  if (!SCRAPER_API_KEY) {
    throw new Error('Chave da ScraperAPI nao configurada. Verifique a variavel VITE_SCRAPER_API_KEY no arquivo .env');
  }

  const platform = detectPlatform(url);

  // Montar URL da ScraperAPI com renderizacao de JavaScript ativada
  const scraperUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&render=true&country_code=br`;

  const response = await fetch(scraperUrl);
  if (!response.ok) {
    throw new Error(`ScraperAPI retornou status ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();

  // Parsear o HTML usando o DOMParser nativo do navegador
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const title = extractTitle(doc, platform);
  const thumbnail_url = extractImage(doc, platform);
  const { original_price, sale_price } = extractPrices(doc, platform);
  const tags = buildTags(doc, platform, title);

  return {
    success: true,
    title,
    platform,
    original_price,
    sale_price,
    thumbnail_url,
    tags,
    original_url: url,
  };
}
