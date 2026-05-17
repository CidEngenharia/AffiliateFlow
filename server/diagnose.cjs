const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('=== DIAGNÓSTICO DE CONEXÃO SUPABASE ===');
console.log('URL:', supabaseUrl);
console.log('Service Key (primeiros 50 chars):', serviceRoleKey ? serviceRoleKey.substring(0, 50) + '...' : 'NÃO ENCONTRADA');

// Decodificar o payload do JWT para ver o project ref da chave
if (serviceRoleKey) {
  try {
    const parts = serviceRoleKey.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log('Project ref na key:', payload.ref);
    console.log('Role na key:', payload.role);
    
    const urlProjectId = supabaseUrl ? supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] : null;
    console.log('Project ref na URL:', urlProjectId);
    
    if (payload.ref !== urlProjectId) {
      console.error('PROBLEMA: O project ref da chave (' + payload.ref + ') não bate com a URL (' + urlProjectId + ')');
      console.error('Você colou a service_role key de um projeto Supabase diferente!');
    } else {
      console.log('OK: A chave pertence ao projeto correto.');
    }
  } catch(e) {
    console.error('Não foi possível decodificar o JWT:', e.message);
  }
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Credenciais ausentes, abortando.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function test() {
  console.log('\n=== TESTE DE ACESSO AO BANCO ===');
  
  const { data, error } = await supabase
    .from('threat_scans')
    .select('id, target_url, status')
    .limit(3);

  if (error) {
    console.error('ERRO ao acessar threat_scans:', error.message);
    console.error('Código:', error.code);
  } else {
    console.log('SUCESSO! Tabela threat_scans acessível.');
    console.log('Total de registros:', data.length);
  }

  process.exit(0);
}

test();
