const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const scanner = require('./scanner');
const supabase = require('./supabase');

const redisOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
  connectTimeout: 2000,
  retryStrategy: (times) => {
    if (times > 3) {
      return null;
    }
    return Math.min(times * 100, 1000);
  }
};

const connection = new Redis(redisOptions);

let isRedisConnected = false;
let realQueue = null;
let realWorker = null;

async function performScanAnalysis({ url, userId, scanId }) {
  console.log(`[Scan Engine] Iniciando analise avancada para: ${url} (Scan ID: ${scanId})`);

  try {
    await supabase.from('threat_scans').update({ status: 'scanning' }).eq('id', scanId);

    const result = await scanner.analyze(url);

    if (result.details.dns && result.details.dns.ips.length > 0) {
      const asnData = result.details.asn || {};
      await supabase.from('asn_intel').insert([{
        scan_id: scanId,
        ip_address: result.details.dns.ips[0],
        asn_number: asnData.asn_number,
        asn_name: asnData.asn_name,
        country: asnData.country,
        is_tor_exit: asnData.is_tor_exit || false,
        is_datacenter: asnData.is_datacenter || false,
        reputation_score: asnData.reputation_score || 0
      }]);
    }

    if (result.details.sandbox && result.details.sandbox.redirect_chains) {
      const redirects = result.details.sandbox.redirect_chains.map((chain, index) => ({
        scan_id: scanId,
        hop_number: index + 1,
        url: chain.url,
        ip_address: chain.ip_address,
        status_code: chain.status_code,
        latency: chain.latency || 0
      }));
      if (redirects.length > 0) await supabase.from('redirect_chains').insert(redirects);
    }

    if (result.details.sandbox && result.details.sandbox.dom_flags) {
      const flags = result.details.sandbox.dom_flags.map(flag => ({
        scan_id: scanId,
        flag_type: flag.type,
        description: flag.description,
        severity: flag.severity
      }));
      if (flags.length > 0) await supabase.from('dom_flags').insert(flags);
    }

    if (result.details.visual) {
      await supabase.from('visual_hashes').insert([{
        scan_id: scanId,
        perceptual_hash: result.details.visual.perceptual_hash,
        similarity_score: result.details.visual.similarity_score,
        matched_brand: result.details.visual.matched_brand
      }]);
    }

    await supabase.from('threat_scans').update({
      status: 'completed',
      risk_score: result.riskScore,
      final_verdict: result.status,
      ai_insight: result.aiAnalysis,
      screenshot_url: result.screenshot,
      raw_details: result.details,
      updated_at: new Date().toISOString()
    }).eq('id', scanId);

    try {
      console.log(`[Scan Engine] Analisando correlacoes para o scan ${scanId}...`);
      const relations = [];

      if (result.details.dns && result.details.dns.ips && result.details.dns.ips.length > 0) {
        const ip = result.details.dns.ips[0];
        const { data: matchedIps } = await supabase
          .from('asn_intel')
          .select('scan_id')
          .eq('ip_address', ip)
          .neq('scan_id', scanId);

        if (matchedIps && matchedIps.length > 0) {
          matchedIps.forEach(item => {
            relations.push({
              source_scan_id: scanId,
              target_scan_id: item.scan_id,
              relation_type: 'same_ip'
            });
          });
        }
      }

      if (result.details.visual && result.details.visual.perceptual_hash) {
        const hash = result.details.visual.perceptual_hash;
        const { data: matchedVisuals } = await supabase
          .from('visual_hashes')
          .select('scan_id')
          .eq('perceptual_hash', hash)
          .neq('scan_id', scanId);

        if (matchedVisuals && matchedVisuals.length > 0) {
          matchedVisuals.forEach(item => {
            relations.push({
              source_scan_id: scanId,
              target_scan_id: item.scan_id,
              relation_type: 'same_visual_hash'
            });
          });
        }
      }

      if (result.details.asn && result.details.asn.asn_number) {
        const asnNum = result.details.asn.asn_number;
        const { data: matchedAsns } = await supabase
          .from('asn_intel')
          .select('scan_id')
          .eq('asn_number', asnNum)
          .neq('scan_id', scanId);

        if (matchedAsns && matchedAsns.length > 0) {
          matchedAsns.forEach(item => {
            relations.push({
              source_scan_id: scanId,
              target_scan_id: item.scan_id,
              relation_type: 'same_asn'
            });
          });
        }
      }

      if (relations.length > 0) {
        console.log(`[Scan Engine] Encontradas ${relations.length} correlacoes para o scan ${scanId}. Inserindo...`);
        
        const uniqueRelations = [];
        const seen = new Set();
        for (const rel of relations) {
          const key = `${rel.target_scan_id}-${rel.relation_type}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueRelations.push(rel);
          }
        }
        
        await supabase.from('threat_relations').insert(uniqueRelations);
      }
    } catch (relErr) {
      console.error(`[Scan Engine] Erro ao processar correlacoes da Fase 6: ${relErr.message}`);
    }

    console.log(`[Scan Engine] Analise concluida com sucesso. Risco: ${result.riskScore}`);
    return result;

  } catch (error) {
    console.error(`[Scan Engine] Erro critico ao analisar URL: ${error.message}`);
    await supabase.from('threat_scans').update({ 
      status: 'failed', 
      ai_insight: `Erro durante analise: ${error.message}`,
      updated_at: new Date().toISOString() 
    }).eq('id', scanId);
    throw error;
  }
}

connection.on('connect', () => {
  console.log(`[Queue] Redis conectado com sucesso. Inicializando filas BullMQ...`);
  isRedisConnected = true;
  
  if (!realQueue) {
    realQueue = new Queue('ThreatScans', { connection });
  }
  
  if (!realWorker) {
    realWorker = new Worker('ThreatScans', async job => {
      await performScanAnalysis(job.data);
    }, { connection });

    realWorker.on('completed', job => {
      console.log(`[Worker] Job ${job.id} concluido com sucesso via Redis/BullMQ.`);
    });

    realWorker.on('failed', (job, err) => {
      console.log(`[Worker] Job ${job.id} falhou via Redis/BullMQ: ${err.message}`);
    });
  }
});

connection.on('error', (err) => {
  if (isRedisConnected) {
    console.warn(`[Queue] Perda de conexao com o Redis: ${err.message}`);
    isRedisConnected = false;
  }
});

const threatScanQueue = {
  add: async (name, data) => {
    if (isRedisConnected && realQueue) {
      try {
        console.log(`[Queue] Adicionando scan a fila do BullMQ (Redis): ${data.url}`);
        return await realQueue.add(name, data);
      } catch (err) {
        console.warn(`[Queue] Erro ao enfileirar no BullMQ, mudando para fallback em memoria: ${err.message}`);
      }
    }
    
    console.log(`[Queue Fallback] Processando scan em memoria de forma assincrona para: ${data.url}`);
    
    setImmediate(async () => {
      try {
        await performScanAnalysis(data);
      } catch (err) {
        console.error(`[Queue Fallback] Erro ao rodar analise do scan ${data.scanId}:`, err);
      }
    });

    return { id: `mem-${Date.now()}` };
  }
};

module.exports = {
  threatScanQueue,
  scanWorker: realWorker || null
};

