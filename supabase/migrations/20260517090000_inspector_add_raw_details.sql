-- Migration: Inspector Advanced Upgrade (Phase 2 - Completa e Idempotente)
-- Description: Cria todas as tabelas do Link Inspector AI já com as colunas raw_details e latency inclusas, garantindo idempotência e segurança.

-- 1. Tabela Principal de Scans
CREATE TABLE IF NOT EXISTS public.threat_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    target_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    risk_score INTEGER,
    final_verdict TEXT,
    ai_insight TEXT,
    screenshot_url TEXT,
    raw_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Garantir que a coluna raw_details exista mesmo se a tabela já existia da Fase 1
ALTER TABLE public.threat_scans ADD COLUMN IF NOT EXISTS raw_details JSONB;

-- 2. Inteligência de ASN e IP
CREATE TABLE IF NOT EXISTS public.asn_intel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES public.threat_scans(id) ON DELETE CASCADE,
    ip_address TEXT,
    asn_number TEXT,
    asn_name TEXT,
    country TEXT,
    is_tor_exit BOOLEAN DEFAULT FALSE,
    is_datacenter BOOLEAN DEFAULT FALSE,
    reputation_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Cadeia de Redirecionamentos
CREATE TABLE IF NOT EXISTS public.redirect_chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES public.threat_scans(id) ON DELETE CASCADE,
    hop_number INTEGER,
    url TEXT,
    ip_address TEXT,
    status_code INTEGER,
    latency INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Garantir que a coluna latency exista mesmo se a tabela já existia da Fase 1
ALTER TABLE public.redirect_chains ADD COLUMN IF NOT EXISTS latency INTEGER;

-- 4. Análise de DOM e Heurística Javascript
CREATE TABLE IF NOT EXISTS public.dom_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES public.threat_scans(id) ON DELETE CASCADE,
    flag_type TEXT, 
    description TEXT,
    severity TEXT, 
    snippet TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Hashes Visuais para Detecção de Clones (Visual AI)
CREATE TABLE IF NOT EXISTS public.visual_hashes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES public.threat_scans(id) ON DELETE CASCADE,
    perceptual_hash TEXT,
    similarity_score NUMERIC,
    matched_brand TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Grafo de Relacionamentos (Threat Graph)
CREATE TABLE IF NOT EXISTS public.threat_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_scan_id UUID REFERENCES public.threat_scans(id) ON DELETE CASCADE,
    target_scan_id UUID REFERENCES public.threat_scans(id) ON DELETE CASCADE,
    relation_type TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS nas tabelas public
ALTER TABLE public.threat_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asn_intel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redirect_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dom_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_hashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_relations ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLÍTICAS DE SEGURANÇA (RLS) - IDEMPOTENTES
-- ==========================================

-- Políticas para public.threat_scans
DROP POLICY IF EXISTS "Usuários podem ver seus próprios scans" ON public.threat_scans;
CREATE POLICY "Usuários podem ver seus próprios scans" ON public.threat_scans FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar seus próprios scans" ON public.threat_scans;
CREATE POLICY "Usuários podem criar seus próprios scans" ON public.threat_scans FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios scans" ON public.threat_scans;
CREATE POLICY "Usuários podem atualizar seus próprios scans" ON public.threat_scans FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para public.asn_intel
DROP POLICY IF EXISTS "Usuários podem ver asn_intel" ON public.asn_intel;
CREATE POLICY "Usuários podem ver asn_intel" ON public.asn_intel FOR SELECT USING (EXISTS (SELECT 1 FROM public.threat_scans WHERE id = asn_intel.scan_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Sistema pode inserir asn_intel" ON public.asn_intel;
CREATE POLICY "Sistema pode inserir asn_intel" ON public.asn_intel FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.threat_scans WHERE id = asn_intel.scan_id AND user_id = auth.uid()));

-- Políticas para public.redirect_chains
DROP POLICY IF EXISTS "Usuários podem ver redirect_chains" ON public.redirect_chains;
CREATE POLICY "Usuários podem ver redirect_chains" ON public.redirect_chains FOR SELECT USING (EXISTS (SELECT 1 FROM public.threat_scans WHERE id = redirect_chains.scan_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Sistema pode inserir redirect_chains" ON public.redirect_chains;
CREATE POLICY "Sistema pode inserir redirect_chains" ON public.redirect_chains FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.threat_scans WHERE id = redirect_chains.scan_id AND user_id = auth.uid()));

-- Políticas para public.dom_flags
DROP POLICY IF EXISTS "Usuários podem ver dom_flags" ON public.dom_flags;
CREATE POLICY "Usuários podem ver dom_flags" ON public.dom_flags FOR SELECT USING (EXISTS (SELECT 1 FROM public.threat_scans WHERE id = dom_flags.scan_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Sistema pode inserir dom_flags" ON public.dom_flags;
CREATE POLICY "Sistema pode inserir dom_flags" ON public.dom_flags FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.threat_scans WHERE id = dom_flags.scan_id AND user_id = auth.uid()));

-- Políticas para public.visual_hashes
DROP POLICY IF EXISTS "Usuários podem ver visual_hashes" ON public.visual_hashes;
CREATE POLICY "Usuários podem ver visual_hashes" ON public.visual_hashes FOR SELECT USING (EXISTS (SELECT 1 FROM public.threat_scans WHERE id = visual_hashes.scan_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Sistema pode inserir visual_hashes" ON public.visual_hashes;
CREATE POLICY "Sistema pode inserir visual_hashes" ON public.visual_hashes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.threat_scans WHERE id = visual_hashes.scan_id AND user_id = auth.uid()));

-- Políticas para public.threat_relations
DROP POLICY IF EXISTS "Usuários podem ver threat_relations" ON public.threat_relations;
CREATE POLICY "Usuários podem ver threat_relations" ON public.threat_relations FOR SELECT USING (EXISTS (SELECT 1 FROM public.threat_scans WHERE id = threat_relations.source_scan_id AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.threat_scans WHERE id = threat_relations.target_scan_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Sistema pode inserir threat_relations" ON public.threat_relations;
CREATE POLICY "Sistema pode inserir threat_relations" ON public.threat_relations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.threat_scans WHERE id = threat_relations.source_scan_id AND user_id = auth.uid()));

-- ==========================================
-- ÍNDICES PARA PERFORMANCE - IDEMPOTENTES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_threat_scans_user_id ON public.threat_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_threat_scans_target_url ON public.threat_scans(target_url);
CREATE INDEX IF NOT EXISTS idx_asn_intel_scan_id ON public.asn_intel(scan_id);
CREATE INDEX IF NOT EXISTS idx_asn_intel_ip_address ON public.asn_intel(ip_address);
CREATE INDEX IF NOT EXISTS idx_redirect_chains_scan_id ON public.redirect_chains(scan_id);
CREATE INDEX IF NOT EXISTS idx_dom_flags_scan_id ON public.dom_flags(scan_id);
CREATE INDEX IF NOT EXISTS idx_visual_hashes_scan_id ON public.visual_hashes(scan_id);
CREATE INDEX IF NOT EXISTS idx_threat_relations_source ON public.threat_relations(source_scan_id);
CREATE INDEX IF NOT EXISTS idx_threat_relations_target ON public.threat_relations(target_scan_id);
