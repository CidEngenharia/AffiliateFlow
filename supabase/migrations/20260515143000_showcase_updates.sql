-- Adicionar campo de plataforma aos links
ALTER TABLE links ADD COLUMN IF NOT EXISTS platform TEXT;

-- Adicionar campo de username aos perfis para a Vitrine
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Criar uma função para gerar username padrão se não existir
CREATE OR REPLACE FUNCTION handle_new_user_profile() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name',
    LOWER(SPLIT_PART(NEW.email, '@', 1)) || '-' || floor(random() * 1000)::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
