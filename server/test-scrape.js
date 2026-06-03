const { scrapeProduct } = require('./engines/scraper');

const testUrl = 'https://www.amazon.com.br/dp/B00GR1NGNS'; // URL do produto do print (Gelatina Soul Power)

console.log('Iniciando raspagem de teste para:', testUrl);
scrapeProduct(testUrl)
  .then(result => {
    console.log('SUCESSO! Resultado da raspagem:');
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(err => {
    console.error('ERRO na raspagem:');
    console.error(err);
  });
