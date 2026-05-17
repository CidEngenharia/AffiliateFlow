-- Migration: Create Categories and Fix Links columns
-- Date: 2026-05-17
-- Autor: Antigravity AI Arquiteto

-- 1. Criar a tabela categories caso ela nao exista
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT,
    icon TEXT,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS para a tabela categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 3. Criar politica de seguranca para a tabela categories
CREATE POLICY "Users can manage their own categories" ON public.categories
    FOR ALL USING (auth.uid() = user_id);

-- 4. Adicionar colunas em falta na tabela links
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS qr_code_url TEXT;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS is_nofollow BOOLEAN DEFAULT FALSE;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN DEFAULT FALSE;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 5;

-- 5. Atualizar o cache de esquema do PostgREST imediatamente
NOTIFY pgrst, 'reload schema';
