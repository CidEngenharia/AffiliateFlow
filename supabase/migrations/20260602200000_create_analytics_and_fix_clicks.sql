-- ============================================================
-- MIGRAÇÃO: Tabela analytics + função increment_clicks
-- Corrige o problema de cliques e analytics não sendo contabilizados
-- ============================================================

-- 1. Criar tabela analytics (registro de cada clique)
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    link_id UUID REFERENCES public.links(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE SET NULL,
    user_agent TEXT,
    referer TEXT DEFAULT 'direto',
    device_type TEXT DEFAULT 'desktop',
    country_code TEXT DEFAULT 'BR',
    is_conversion BOOLEAN DEFAULT FALSE,
    revenue_estimated DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Índices para performance nas queries de analytics
CREATE INDEX IF NOT EXISTS analytics_link_id_idx ON public.analytics(link_id);
CREATE INDEX IF NOT EXISTS analytics_user_id_idx ON public.analytics(user_id);
CREATE INDEX IF NOT EXISTS analytics_created_at_idx ON public.analytics(created_at);
CREATE INDEX IF NOT EXISTS analytics_device_type_idx ON public.analytics(device_type);
CREATE INDEX IF NOT EXISTS analytics_country_code_idx ON public.analytics(country_code);

-- 3. Habilitar RLS na tabela analytics
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- 4. Política: Qualquer pessoa pode INSERT (registro de cliques anônimos)
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics;
CREATE POLICY "Anyone can insert analytics"
    ON public.analytics
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 5. Política: Usuário autenticado vê apenas seus próprios dados
DROP POLICY IF EXISTS "Users can view their own analytics" ON public.analytics;
CREATE POLICY "Users can view their own analytics"
    ON public.analytics
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- 6. Função RPC: increment_clicks (atualiza o contador na tabela links)
CREATE OR REPLACE FUNCTION public.increment_clicks(link_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.links
    SET clicks_count = COALESCE(clicks_count, 0) + 1,
        updated_at = NOW()
    WHERE id = link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Garantir que a função RPC pode ser chamada sem autenticação
GRANT EXECUTE ON FUNCTION public.increment_clicks(UUID) TO anon, authenticated;

-- 8. Garantir que a tabela links tenha a coluna clicks_count
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS clicks_count INTEGER DEFAULT 0;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS conversions_count INTEGER DEFAULT 0;

-- 9. Policy adicional para SELECT público na tabela analytics
-- (necessário para que o analyticsService leia dados do próprio usuário)
DROP POLICY IF EXISTS "Authenticated users can read their analytics" ON public.analytics;
CREATE POLICY "Authenticated users can read their analytics"
    ON public.analytics
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.links l
            WHERE l.id = analytics.link_id
            AND l.user_id = auth.uid()
        )
    );
