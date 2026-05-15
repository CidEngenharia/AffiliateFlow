-- NEXUS INSPECTOR: Core Intelligence Schema
-- Este script configura o banco de dados para o módulo de análise inteligente de links.

-- 1. Enum para Status de Ameaça
DO $$ BEGIN
    CREATE TYPE threat_status AS ENUM ('safe', 'suspicious', 'malicious', 'phishing', 'malware');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabela de Scans (Nexus Intelligent Inspector)
CREATE TABLE IF NOT EXISTS public.nexus_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    url TEXT NOT NULL,
    domain TEXT,
    risk_score INTEGER DEFAULT 0,
    status threat_status DEFAULT 'safe',
    
    -- Dados Técnicos (JSONB para flexibilidade)
    ssl_data JSONB DEFAULT '{}',
    whois_data JSONB DEFAULT '{}',
    reputation_data JSONB DEFAULT '{}',
    http_headers JSONB DEFAULT '{}',
    dns_records JSONB DEFAULT '{}',
    
    -- Análise de IA e Relatórios
    ai_analysis TEXT,
    threat_details TEXT[],
    screenshot_url TEXT,
    
    -- Metadados de Cache
    last_updated TIMESTAMPTZ DEFAULT now()
);

-- 3. Habilitar RLS (Segurança por Usuário)
ALTER TABLE public.nexus_scans ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Acesso
DROP POLICY IF EXISTS "Users can view their own scans" ON public.nexus_scans;
CREATE POLICY "Users can view their own scans" 
ON public.nexus_scans FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own scans" ON public.nexus_scans;
CREATE POLICY "Users can create their own scans" 
ON public.nexus_scans FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_nexus_scans_user_url ON public.nexus_scans(user_id, url);
CREATE INDEX IF NOT EXISTS idx_nexus_scans_status ON public.nexus_scans(status);

-- 6. Trigger para atualizar 'last_updated'
CREATE OR REPLACE FUNCTION update_nexus_scan_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS tr_update_nexus_scan_timestamp ON public.nexus_scans;
CREATE TRIGGER tr_update_nexus_scan_timestamp
    BEFORE UPDATE ON public.nexus_scans
    FOR EACH ROW
    EXECUTE FUNCTION update_nexus_scan_timestamp();
