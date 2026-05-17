const { scrapeProduct } = require('../server/engines/scraper');

async function test() {
  console.log('Iniciando teste de raspagem...');
  
  // Vamos testar com uma URL real de teste da Amazon
  const url = 'https://www.amazon.com.br/Kindle-11%C2%AA-gera%C3%A7%C3%A3o-Leve-resolu%C3%A7%C3%A3o/dp/B09TWDYSVP';
  
  try {
    const result = await scrapeProduct(url);
    console.log('Resultado do Scrape bem-sucedido:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Falha no Scrape de teste:', error.message);
  }
}

test();
