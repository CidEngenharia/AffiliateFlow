-- Corrigir trigger de perfil e adicionar campos de conversão
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_profile') THEN
    CREATE TRIGGER on_auth_user_created_profile
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user_profile();
  END IF;
END $$;

-- Atualizar usuários existentes que não têm username
UPDATE public.profiles 
SET username = LOWER(SPLIT_PART(email, '@', 1)) || '-' || floor(random() * 1000)::text
WHERE username IS NULL;

-- Adicionar campos para melhorar conversão (baseado no artigo da Kinsta)
ALTER TABLE links ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2);
ALTER TABLE links ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2);
ALTER TABLE links ADD COLUMN IF NOT EXISTS discount_percent INTEGER;
ALTER TABLE links ADD COLUMN IF NOT EXISTS redirect_type INTEGER DEFAULT 301; -- 301 ou 307
ALTER TABLE links ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE links ADD COLUMN IF NOT EXISTS category TEXT;
