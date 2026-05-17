const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

// O servidor deve SEMPRE usar a service_role key para:
// 1. Contornar as políticas de RLS (Row Level Security) em operações internas
// 2. Enxergar tabelas recém-criadas no cache de esquema do PostgREST
// NUNCA use a anon key no servidor — ela bloqueia inserções e atualizações via RLS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!supabaseKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  console.error(`[Supabase] ERRO CRÍTICO: Variáveis de ambiente ausentes: ${missing.join(', ')}`);
  console.error('[Supabase] Adicione SUPABASE_SERVICE_ROLE_KEY no arquivo server/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('[Supabase] Cliente inicializado com privilégios de serviço (service_role).');

module.exports = supabase;
