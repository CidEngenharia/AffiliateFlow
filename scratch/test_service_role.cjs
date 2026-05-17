const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', supabaseUrl);
console.log('Key prefix (primeiros 40 chars):', serviceRoleKey?.substring(0, 40));

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function test() {
  try {
    // Testa leitura da tabela threat_scans
    const { data, error } = await supabase
      .from('threat_scans')
      .select('id, target_url, status')
      .limit(5);

    if (error) {
      console.error('ERRO ao acessar threat_scans:', error.message);
      console.error('Código:', error.code);
    } else {
      console.log('SUCESSO! threat_scans acessível. Registros encontrados:', data.length);
      console.log('Dados:', data);
    }

    // Testa inserção de registro de teste
    const testId = `test-${Date.now()}`;
    const { data: insertData, error: insertError } = await supabase
      .from('threat_scans')
      .insert([{ target_url: 'https://test.com', status: 'pending', user_id: '00000000-0000-0000-0000-000000000000' }])
      .select('id')
      .single();

    if (insertError) {
      console.error('ERRO ao inserir em threat_scans:', insertError.message);
    } else {
      console.log('SUCESSO! Inserção funcionou. ID gerado:', insertData.id);
      // Limpar o registro de teste
      await supabase.from('threat_scans').delete().eq('id', insertData.id);
      console.log('Registro de teste removido.');
    }

  } catch (err) {
    console.error('Exceção:', err.message);
  }
  process.exit(0);
}

test();
