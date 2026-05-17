-- Migration: Inspector Advanced Upgrade (Phase 1)
-- Description: Criação das tabelas para o motor de Threat Intelligence, Visual AI e DOM Analysis.

-- 1. Tabela Principal de Scans
CREATE TABLE IF NOT EXISTS threat_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    target_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, scanning, completed, failed
    risk_score INTEGER,
    final_verdict TEXT, -- safe, suspicious, malicious
    ai_insight TEXT,
    screenshot_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Inteligência de ASN e IP
CREATE TABLE IF NOT EXISTS asn_intel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES threat_scans(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS redirect_chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES threat_scans(id) ON DELETE CASCADE,
    hop_number INTEGER,
    url TEXT,
    ip_address TEXT,
    status_code INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Análise de DOM e Heurística Javascript
CREATE TABLE IF NOT EXISTS dom_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES threat_scans(id) ON DELETE CASCADE,
    flag_type TEXT, -- ex: 'obfuscated_script', 'hidden_iframe', 'crypto_miner', 'eval_usage'
    description TEXT,
    severity TEXT, -- low, medium, high, critical
    snippet TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Hashes Visuais para Detecção de Clones (Visual AI)
CREATE TABLE IF NOT EXISTS visual_hashes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES threat_scans(id) ON DELETE CASCADE,
    perceptual_hash TEXT,
    similarity_score NUMERIC,
    matched_brand TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Grafo de Relacionamentos (Threat Graph)
CREATE TABLE IF NOT EXISTS threat_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_scan_id UUID REFERENCES threat_scans(id) ON DELETE CASCADE,
    target_scan_id UUID REFERENCES threat_scans(id) ON DELETE CASCADE,
    relation_type TEXT, -- ex: 'same_ip', 'same_visual_hash', 'same_asn', 'same_registrar'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE threat_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE asn_intel ENABLE ROW LEVEL SECURITY;
ALTER TABLE redirect_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE dom_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_hashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_relations ENABLE ROW LEVEL SECURITY;

-- Políticas para threat_scans
CREATE POLICY "Usuários podem ver seus próprios scans" 
ON threat_scans FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios scans" 
ON threat_scans FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios scans" 
ON threat_scans FOR UPDATE 
USING (auth.uid() = user_id);

-- Políticas para tabelas filhas (Leitura permitida se o usuário for dono do scan_id)
-- ASN Intel
CREATE POLICY "Usuários podem ver asn_intel de seus scans" 
ON asn_intel FOR SELECT 
USING (EXISTS (SELECT 1 FROM threat_scans WHERE id = asn_intel.scan_id AND user_id = auth.uid()));

CREATE POLICY "Sistema pode inserir asn_intel" 
ON asn_intel FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM threat_scans WHERE id = asn_intel.scan_id AND user_id = auth.uid()));

-- Redirect Chains
CREATE POLICY "Usuários podem ver redirect_chains de seus scans" 
ON redirect_chains FOR SELECT 
USING (EXISTS (SELECT 1 FROM threat_scans WHERE id = redirect_chains.scan_id AND user_id = auth.uid()));

CREATE POLICY "Sistema pode inserir redirect_chains" 
ON redirect_chains FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM threat_scans WHERE id = redirect_chains.scan_id AND user_id = auth.uid()));

-- DOM Flags
CREATE POLICY "Usuários podem ver dom_flags de seus scans" 
ON dom_flags FOR SELECT 
USING (EXISTS (SELECT 1 FROM threat_scans WHERE id = dom_flags.scan_id AND user_id = auth.uid()));

CREATE POLICY "Sistema pode inserir dom_flags" 
ON dom_flags FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM threat_scans WHERE id = dom_flags.scan_id AND user_id = auth.uid()));

-- Visual Hashes
CREATE POLICY "Usuários podem ver visual_hashes de seus scans" 
ON visual_hashes FOR SELECT 
USING (EXISTS (SELECT 1 FROM threat_scans WHERE id = visual_hashes.scan_id AND user_id = auth.uid()));

CREATE POLICY "Sistema pode inserir visual_hashes" 
ON visual_hashes FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM threat_scans WHERE id = visual_hashes.scan_id AND user_id = auth.uid()));

-- Threat Relations
CREATE POLICY "Usuários podem ver threat_relations" 
ON threat_relations FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM threat_scans WHERE id = threat_relations.source_scan_id AND user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM threat_scans WHERE id = threat_relations.target_scan_id AND user_id = auth.uid())
);

CREATE POLICY "Sistema pode inserir threat_relations" 
ON threat_relations FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM threat_scans WHERE id = threat_relations.source_scan_id AND user_id = auth.uid())
);

-- ==========================================
-- INDEXES PARA PERFORMANCE
-- ==========================================
CREATE INDEX idx_threat_scans_user_id ON threat_scans(user_id);
CREATE INDEX idx_threat_scans_target_url ON threat_scans(target_url);
CREATE INDEX idx_asn_intel_scan_id ON asn_intel(scan_id);
CREATE INDEX idx_asn_intel_ip_address ON asn_intel(ip_address);
CREATE INDEX idx_redirect_chains_scan_id ON redirect_chains(scan_id);
CREATE INDEX idx_dom_flags_scan_id ON dom_flags(scan_id);
CREATE INDEX idx_visual_hashes_scan_id ON visual_hashes(scan_id);
CREATE INDEX idx_threat_relations_source ON threat_relations(source_scan_id);
CREATE INDEX idx_threat_relations_target ON threat_relations(target_scan_id);
