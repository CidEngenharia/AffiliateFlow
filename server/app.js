const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const scanner = require('./scanner');
const { scrapeProduct } = require('./engines/scraper');
require('dotenv').config();

// Registro de Plugins
const allowedOrigins = [
  /localhost/,
  /\.vercel\.app$/,
  /\.railway\.app$/,
  /affilehub/i
];

fastify.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // Permitir chamadas diretas (ex: curl, servidor)
    const isAllowed = allowedOrigins.some(pattern =>
      typeof pattern === 'string' ? origin === pattern : pattern.test(origin)
    );
    cb(null, isAllowed);
  },
  credentials: true
});

const { threatScanQueue } = require('./queue');
const supabase = require('./supabase');

// Endpoint Principal de Scan
fastify.post('/api/scan', async (request, reply) => {
  const { url, userId } = request.body;
  
  if (!url || !userId) {
    return reply.status(400).send({ error: 'URL and UserID are required' });
  }

  try {
    fastify.log.info(`Enfileirando análise de segurança para: ${url}`);
    
    // 1. Criar registro inicial no banco de dados
    const { data: scanData, error: scanError } = await supabase
      .from('threat_scans')
      .insert([{ target_url: url, user_id: userId, status: 'pending' }])
      .select('id')
      .single();

    if (scanError) {
      throw new Error(`Erro ao criar registro: ${scanError.message}`);
    }

    const scanId = scanData.id;

    // 2. Adicionar na fila do BullMQ
    await threatScanQueue.add('inspect-url', {
      url,
      userId,
      scanId
    });

    // 3. Retornar imediato com ID de acompanhamento
    return {
      success: true,
      message: 'Scan enfileirado com sucesso',
      data: {
        scanId,
        status: 'pending'
      }
    };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Falha ao iniciar o motor de análise' });
  }
});

// Endpoint de Consulta de Status
fastify.get('/api/scan/:id', async (request, reply) => {
  const { id } = request.params;
  
  const { data, error } = await supabase
    .from('threat_scans')
    .select('*, asn_intel(*), dom_flags(*), visual_hashes(*), redirect_chains(*)')
    .eq('id', id)
    .single();

  if (error) {
    return reply.status(404).send({ error: 'Scan não encontrado' });
  }

  // Buscar relações de ameaça correlacionadas (Fase 6)
  const { data: relations } = await supabase
    .from('threat_relations')
    .select('*, target:threat_scans!target_scan_id(target_url, final_verdict, risk_score), source:threat_scans!source_scan_id(target_url, final_verdict, risk_score)')
    .or(`source_scan_id.eq.${id},target_scan_id.eq.${id}`);

  data.relations = relations || [];

  return { success: true, data };
});

const puppeteer = require('puppeteer');

// Endpoint de Exportacao de Relatorio Executivo em PDF
fastify.get('/api/reports/pdf/:id', async (request, reply) => {
  const { id } = request.params;

  try {
    // 1. Buscar os dados completos do scan no Supabase
    const { data: scan, error } = await supabase
      .from('threat_scans')
      .select('*, asn_intel(*), dom_flags(*), visual_hashes(*), redirect_chains(*)')
      .eq('id', id)
      .single();

    if (error || !scan) {
      return reply.status(404).send({ error: 'Scan nao encontrado' });
    }

    // 2. Buscar relacoes de ameaca correlacionadas (Fase 6)
    const { data: relations } = await supabase
      .from('threat_relations')
      .select('*, target:threat_scans!target_scan_id(target_url, final_verdict, risk_score), source:threat_scans!source_scan_id(target_url, final_verdict, risk_score)')
      .or(`source_scan_id.eq.${id},target_scan_id.eq.${id}`);

    const allRelations = relations || [];
    const asn = scan.asn_intel?.[0] || {};
    const visual = scan.visual_hashes?.[0] || {};
    const redirects = scan.redirect_chains || [];
    const domFlags = scan.dom_flags || [];

    // Calcular cores com base no risk_score
    const score = scan.risk_score || 0;
    let scoreColor = '#10b981'; // green
    let scoreText = 'SEGURO';
    if (score > 75) {
      scoreColor = '#ef4444'; // red
      scoreText = 'MALICIOSO';
    } else if (score > 45) {
      scoreColor = '#f59e0b'; // amber
      scoreText = 'SUSPEITO';
    } else if (score > 15) {
      scoreColor = '#d97706'; // orange / attention
      scoreText = 'ATENCAO';
    }

    // Gerar HTML dinamico estilizado sem depender de recursos externos
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatorio Executivo de Ameacas - Link Inspector AI</title>
  <style>
    body {
      font-family: 'Segoe UI', -apple-system, Roboto, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 0;
      line-height: 1.4;
      background-color: #ffffff;
      font-size: 13px;
    }
    .container {
      padding: 10px;
    }
    .header {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white;
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }
    .header p {
      margin: 6px 0 0 0;
      opacity: 0.9;
      font-size: 13px;
    }
    .scan-id {
      font-family: monospace;
      font-size: 11px;
      background-color: rgba(255, 255, 255, 0.15);
      padding: 3px 8px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 8px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
    }
    .card-title {
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
    }
    .score-block {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .score-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: ${scoreColor};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 800;
    }
    .score-details {
      display: flex;
      flex-direction: column;
    }
    .score-verdict {
      font-size: 16px;
      font-weight: 800;
      color: ${scoreColor};
    }
    .score-subtitle {
      font-size: 11px;
      color: #64748b;
    }
    .ai-box {
      background-color: #f5f3ff;
      border: 1px solid #ddd6fe;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .ai-box-title {
      font-weight: 800;
      color: #6d28d9;
      margin-bottom: 6px;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .ai-insight {
      font-style: italic;
      color: #4c1d95;
      font-size: 12.5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
    }
    table th, table td {
      padding: 8px 10px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11.5px;
    }
    table th {
      color: #475569;
      font-weight: 700;
      background-color: #f1f5f9;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
    }
    .monospace {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      word-break: break-all;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-critical { background-color: #fee2e2; color: #ef4444; }
    .badge-high { background-color: #ffedd5; color: #ea580c; }
    .badge-medium { background-color: #fef3c7; color: #d97706; }
    .badge-low { background-color: #e0f2fe; color: #0284c7; }
    .section-title {
      font-size: 14px;
      font-weight: 800;
      color: #1e293b;
      margin-top: 24px;
      margin-bottom: 10px;
      text-transform: uppercase;
      border-left: 4px solid #4f46e5;
      padding-left: 8px;
      letter-spacing: 0.5px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      font-size: 10px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Cabecalho -->
    <div class="header">
      <h1>Link Inspector AI</h1>
      <p>Relatorio Executivo de Ameacas e Analise Sandbox</p>
      <div class="scan-id">ID do Scan: ${scan.id}</div>
    </div>

    <!-- Grid Inicial: Score e Detalhes da URL -->
    <div class="grid-2">
      <div class="card">
        <div class="card-title">Resumo do Risco</div>
        <div class="score-block">
          <div class="score-circle">${score}</div>
          <div class="score-details">
            <span class="score-verdict">${scoreText}</span>
            <span class="score-subtitle">Pontuacao de Risco: ${score}/100</span>
            <span class="score-subtitle">Data: ${new Date(scan.created_at).toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-title">Dominio e Infraestrutura</div>
        <div style="font-size: 12px; line-height: 1.6;">
          <strong>URL Alvo:</strong> <span class="monospace">${scan.target_url}</span><br/>
          <strong>Endereco IP:</strong> <span class="monospace">${asn.ip_address || 'N/A'}</span><br/>
          <strong>Provedor ASN:</strong> ${asn.asn_name || 'N/A'} (${asn.asn_number || 'N/A'})<br/>
          <strong>Pais de Origem:</strong> ${asn.country || 'N/A'}<br/>
          <strong>Datacenter:</strong> ${asn.is_datacenter ? 'Sim' : 'Nao'} | <strong>Tor Exit Node:</strong> ${asn.is_tor_exit ? 'Sim' : 'Nao'}
        </div>
      </div>
    </div>

    <!-- AI Verdict Box -->
    <div class="ai-box">
      <div class="ai-box-title">🛡️ AI Insight & Veredicto Preditivo</div>
      <div class="ai-insight">"${scan.ai_insight || 'Nenhuma consideracao adicional gerada pela inteligencia artificial.'}"</div>
    </div>

    <!-- Grid 2: SSL e Whois -->
    <div class="grid-2">
      <div class="card">
        <div class="card-title">Auditoria de Criptografia SSL/TLS</div>
        <div style="font-size: 12px; line-height: 1.6;">
          <strong>SSL Valido:</strong> ${scan.raw_details?.ssl?.valid ? 'Sim (Seguro)' : 'Nao / Expirado'}<br/>
          <strong>Emissor do Certificado:</strong> ${scan.raw_details?.ssl?.issuer || 'Let\'s Encrypt'}<br/>
          <strong>Data de Expiracao:</strong> ${scan.raw_details?.ssl?.expiry || 'N/A'}
        </div>
      </div>

      <div class="card">
        <div class="card-title">Informacoes WHOIS & Idade do Dominio</div>
        <div style="font-size: 12px; line-height: 1.6;">
          <strong>Registradora:</strong> ${scan.raw_details?.whois?.registrar || 'N/A'}<br/>
          <strong>Data de Criacao:</strong> ${scan.raw_details?.whois?.createdDate || 'N/A'}<br/>
          <strong>Pais de Registro:</strong> ${scan.raw_details?.whois?.country || 'N/A'}
        </div>
      </div>
    </div>

    <!-- DOM Flag Analysis -->
    <div class="section-title">Analise de Elementos e Comportamento DOM</div>
    ${domFlags.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Severidade</th>
            <th>Tipo de Vulnerabilidade</th>
            <th>Descricao do Elemento Detectado</th>
          </tr>
        </thead>
        <tbody>
          ${domFlags.map(flag => `
            <tr>
              <td><span class="badge badge-${flag.severity || 'low'}">${flag.severity || 'low'}</span></td>
              <td><strong>${flag.flag_type}</strong></td>
              <td>${flag.description}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : `
      <div style="padding: 15px; text-align: center; color: #64748b; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px;">
        Nenhum elemento suspeito de phishing, clickjacking ou traps invisiveis foi encontrado no DOM desta pagina.
      </div>
    `}

    <!-- Redirection Hops Chain -->
    <div class="section-title">Cadeia de Redirecionamento (Cloaking & Evasion Audit)</div>
    ${redirects.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Salto</th>
            <th>URL Redirecionada</th>
            <th>Endereco IP</th>
            <th>Status HTTP</th>
            <th>Latencia</th>
          </tr>
        </thead>
        <tbody>
          ${redirects.sort((a,b) => a.hop_number - b.hop_number).map(red => `
            <tr>
              <td><strong>#${red.hop_number}</strong></td>
              <td class="monospace">${red.url}</td>
              <td class="monospace">${red.ip_address || 'N/A'}</td>
              <td><span class="badge badge-info">${red.status_code}</span></td>
              <td>${red.latency || 0} ms</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : `
      <div style="padding: 15px; text-align: center; color: #64748b; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px;">
        Esta URL respondeu diretamente sem realizar redirecionamentos intermediarios ou tecnicas de cloak evasion.
      </div>
    `}

    <!-- Visual Matches & Brand Clones -->
    <div class="section-title">Analise de Semelhanca de Marca (Visual AI)</div>
    <div class="card">
      <div style="font-size: 12px; line-height: 1.6;">
        <strong>Marca Identificada:</strong> ${visual.matched_brand || 'Nenhuma marca conhecida detectada (Site Generico)'}<br/>
        <strong>Grau de Similaridade Visual:</strong> ${visual.similarity_score ? (parseFloat(visual.similarity_score) * 100).toFixed(1) + '%' : 'N/A'}<br/>
        <strong>Assinatura Perceptiva (pHash):</strong> <span class="monospace">${visual.perceptual_hash || 'N/A'}</span>
      </div>
    </div>

    <!-- Threat Relations & Network Correlation -->
    <div class="section-title">Correlacao de Rede e Inteligencia de Ameacas (Threat Graph)</div>
    ${allRelations.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>URL Correlacionada</th>
            <th>Tipo de Vinculo</th>
            <th>Risco Relativo</th>
            <th>Status Historico</th>
          </tr>
        </thead>
        <tbody>
          ${allRelations.map(rel => {
            const isSource = rel.source_scan_id === scan.id;
            const related = isSource ? rel.target : rel.source;
            let typeText = 'Endereco IP em Comum';
            if (rel.relation_type === 'same_asn') typeText = 'Mesma Subrede ASN';
            if (rel.relation_type === 'visual_similarity') typeText = 'Clonagem de Design Visual';
            
            return `
              <tr>
                <td class="monospace">${related?.target_url || 'URL Oculta'}</td>
                <td><strong>${typeText}</strong></td>
                <td><span class="badge badge-danger">Risco: ${related?.risk_score || 0}/100</span></td>
                <td>${related?.final_verdict || 'safe'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    ` : `
      <div style="padding: 15px; text-align: center; color: #64748b; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px;">
        Ameaca isolada. Esta URL nao compartilha o mesmo IP de hospedagem, mesma subrede ASN ou design visual com outras ameacas mapeadas no sistema.
      </div>
    `}

    <!-- Rodape -->
    <div class="footer">
      Link Inspector AI • Relatorio gerado automaticamente em ${new Date().toLocaleString('pt-BR')}<br/>
      Tecnologia de Protecao Ativa e Identificacao de Fraudes • Affilehub
    </div>
  </div>
</body>
</html>
    `;

    // 3. Iniciar Puppeteer para imprimir como PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security'
      ]
    });

    try {
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '25px',
          right: '25px',
          bottom: '25px',
          left: '25px'
        }
      });

      // 4. Responder com o PDF para download direto
      reply
        .type('application/pdf')
        .header('Content-Disposition', `attachment; filename="Relatorio_Inspector_${id}.pdf"`)
        .send(pdfBuffer);
    } finally {
      await browser.close().catch(() => {});
    }

  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Erro interno ao tentar gerar o relatorio em PDF' });
  }
});

// Endpoint de Raspagem de Oferta por URL
fastify.post('/api/scrape', async (request, reply) => {
  const { url } = request.body;
  if (!url) {
    return reply.status(400).send({ error: 'URL do produto é obrigatória' });
  }

  try {
    fastify.log.info(`Iniciando raspagem de metadados para: ${url}`);
    const productInfo = await scrapeProduct(url);
    return productInfo;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: `Falha ao extrair dados do produto: ${err.message}` });
  }
});

// Health Check
fastify.get('/health', async () => {
  return { status: 'Link Inspector Queue Online', version: '2.0.0' };
});

// Start Server
const start = async () => {
  try {
    // Railway injeta a variável PORT dinamicamente. Localmente usa 3001.
    const port = parseInt(process.env.PORT) || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Servidor rodando na porta ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
