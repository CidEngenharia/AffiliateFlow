import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log para ajudar na depuração na Vercel (não expõe a chave inteira por segurança)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase: Variáveis de ambiente não encontradas. Verifique o painel da Vercel.');
} else {
  console.log('✅ Supabase: Configurações detectadas.');
}

// Inicialização segura
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
