-- Migration: Add missing fields for links scraper and redirection rules
-- Date: 2026-05-17

ALTER TABLE public.links ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2);
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS sale_price NUMERIC(10,2);
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS platform TEXT;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS redirect_type TEXT DEFAULT '301';
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS device_rules JSONB;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS country_rules JSONB;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS language_rules JSONB;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS ab_test_rules JSONB;

-- Atualizar o cache de esquema do PostgREST imediatamente
NOTIFY pgrst, 'reload schema';
