-- Script de correção total e inicialização de tabelas do Affilehub (Versão Robusta)
-- Este script garante a criação das tabelas fundamentais e resolve o erro de 'relation profiles does not exist'

-- 1. Extensões Necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Limpeza Preventiva (Opcional, mas garante que não haja lixo de execuções parciais)
-- NOTA: Comentado para evitar perda de dados se o usuário já tiver registros. 
-- Descomente se quiser um "hard reset".
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Criar a tabela profiles (A BASE DE TUDO)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    plan_type TEXT DEFAULT 'free', -- 'free', 'pro', 'enterprise'
    subscription_status TEXT DEFAULT 'active', -- 'active', 'inactive', 'trialing', 'past_due'
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar a tabela links (Depende de auth.users)
CREATE TABLE IF NOT EXISTS public.links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    original_url TEXT NOT NULL,
    short_code TEXT UNIQUE NOT NULL,
    thumbnail_url TEXT,
    description TEXT,
    platform TEXT,
    original_price DECIMAL(10,2),
    sale_price DECIMAL(10,2),
    discount_percent INTEGER,
    is_featured BOOLEAN DEFAULT FALSE,
    rating INTEGER DEFAULT 5,
    redirect_type INTEGER DEFAULT 301,
    is_active BOOLEAN DEFAULT TRUE,
    clicks_count INTEGER DEFAULT 0,
    conversions_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Função para criar perfil automaticamente no Signup (Otimizada)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
BEGIN
    -- Gerar um username inicial baseado no email
    base_username := LOWER(SPLIT_PART(NEW.email, '@', 1));
    
    INSERT INTO public.profiles (id, email, full_name, username, plan_type, subscription_status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        base_username || '-' || floor(random() * 9000 + 1000)::text,
        'free',
        'active'
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Fallback silencioso para não quebrar o signup do auth.users
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Recriar Trigger de Signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Habilitar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

-- 8. Políticas de RLS para Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

-- 9. Políticas de RLS para Links
DROP POLICY IF EXISTS "Users can manage their links" ON public.links;
CREATE POLICY "Users can manage their links" ON public.links FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public links are viewable by everyone" ON public.links;
CREATE POLICY "Public links are viewable by everyone" ON public.links FOR SELECT USING (true);

-- 10. Sincronização de Perfis Existentes (Auto-reparo)
-- Executa um insert para cada usuário no auth.users que não tenha perfil
DO $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, username, plan_type, subscription_status)
    SELECT 
        u.id, 
        u.email, 
        COALESCE(u.raw_user_meta_data->>'full_name', u.email),
        LOWER(SPLIT_PART(u.email, '@', 1)) || '-' || floor(random() * 9000 + 1000)::text,
        'free',
        'active'
    FROM auth.users u
    WHERE u.id NOT IN (SELECT id FROM public.profiles)
    ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
    -- Se falhar aqui, o resto do script já rodou
    NULL;
END $$;

