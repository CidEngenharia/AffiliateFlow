-- Migration: Fix missing columns
-- Adiciona coluna raw_details que o queue.js usa para salvar o resultado completo
ALTER TABLE threat_scans ADD COLUMN IF NOT EXISTS raw_details JSONB;

-- Adiciona coluna latency que o queue.js usa ao inserir redirect_chains
ALTER TABLE redirect_chains ADD COLUMN IF NOT EXISTS latency INTEGER DEFAULT 0;

-- Garante que as policies das tabelas filhas funcionam com service_role
-- (service_role bypassa RLS, mas garantimos para o caso de anon key ser usada acidentalmente)

-- Permite que service role faça todas as operações em asn_intel
CREATE POLICY IF NOT EXISTS "Service role tem acesso total a asn_intel"
ON asn_intel FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Service role tem acesso total a redirect_chains"
ON redirect_chains FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Service role tem acesso total a dom_flags"
ON dom_flags FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Service role tem acesso total a visual_hashes"
ON visual_hashes FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Service role tem acesso total a threat_relations"
ON threat_relations FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Service role tem acesso total a threat_scans"
ON threat_scans FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
