const { scrapeProduct } = require('../server/engines/scraper');

async function test() {
  console.log('Iniciando teste de raspagem...');
  
  try {
    const urlML = 'https://www.mercadolivre.com.br/apple-iphone-15-128-gb-preto/p/MLB27670984';
    console.log('\n--- Testando Mercado Livre ---');
    const resultML = await scrapeProduct(urlML);
    console.log('Resultado ML:');
    console.log(JSON.stringify(resultML, null, 2));

    const urlShopee = 'https://shopee.com.br/product/409605481/25608670868';
    console.log('\n--- Testando Shopee ---');
    const resultShopee = await scrapeProduct(urlShopee);
    console.log('Resultado Shopee:');
    console.log(JSON.stringify(resultShopee, null, 2));
  } catch (error) {
    console.error('Falha no Scrape de teste:', error.message);
  }
}

test();
