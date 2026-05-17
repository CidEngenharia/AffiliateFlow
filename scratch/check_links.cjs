const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

async function check() {
  try {
    const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    if (!res.ok) {
      console.error('Erro na resposta do Supabase:', res.status, res.statusText);
      return;
    }
    
    const spec = await res.json();
    const linksPath = spec.paths['/links'];
    if (spec.definitions) {
      console.log('Tabelas no cache do PostgREST:', Object.keys(spec.definitions));
      if (spec.definitions.links) {
        console.log('Colunas da tabela links no cache do PostgREST:');
        console.log(Object.keys(spec.definitions.links.properties));
      }
    } else {
      console.log('Definicao nao encontrada no OpenAPI definitions');
    }
  } catch (err) {
    console.error('Erro ao consultar OpenAPI:', err.message);
  }
}

check();
