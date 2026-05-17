const whoiser = require('whoiser');
const axios = require('axios');
const { analyzeDNS } = require('./engines/dns');
const { analyzeASN } = require('./engines/asn');
const { analyzeTyposquatting } = require('./engines/typosquatting');
const { executeSandbox } = require('./engines/sandbox');
const { analyzeVisualHash } = require('./engines/visualai');

/**
 * Motor de Inteligência Link Inspector
 * Responsável por dissecar a URL em múltiplas camadas de segurança.
 */
const analyze = async (targetUrl) => {
  const url = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
  const domain = url.hostname;
  let totalRiskScore = 0;
  let aiInsights = [];

  // Camada 1: WHOIS & Idade do Domínio
  const whoisInfo = await getWhoisData(domain);
  if (whoisInfo.createdDate && whoisInfo.createdDate.includes('2026')) {
    totalRiskScore += 30; // Domínio muito recente
    aiInsights.push('Domínio recém-registrado (possível infraestrutura temporária).');
  }

  // Camada 2: Typosquatting (Brand Imitation)
  const typoResult = analyzeTyposquatting(domain);
  if (typoResult.is_typosquatting) {
    totalRiskScore += typoResult.risk_score;
    aiInsights.push(...typoResult.details);
  }

  // Camada 3: DNS Intelligence (MX, SPF, DMARC)
  const dnsIntel = await analyzeDNS(domain);
  let asnIntel = null;
  if (dnsIntel.ips.length > 0) {
    // Camada 4: ASN & IP Reputation (Datacenters, Tor)
    asnIntel = await analyzeASN(dnsIntel.ips[0]);
    if (asnIntel && asnIntel.reputation_score > 0) {
      totalRiskScore += asnIntel.reputation_score;
      aiInsights.push(`Hospedagem em servidor de alto risco (${asnIntel.is_tor_exit ? 'Rede Tor/Proxy' : 'Datacenter não confiável'}).`);
    }
  }

  // Camada 5: Reputação (Blacklists)
  const reputation = await checkReputation(domain);
  if (reputation.virusTotalHits > 0 || reputation.phishTank) {
    totalRiskScore += 50;
    aiInsights.push('Domínio listado em blacklists públicas (PhishTank/VirusTotal).');
  }

  // Camada 6: Sandbox & DOM Behavior (Puppeteer Headless)
  const sandboxResult = await executeSandbox(url.href);
  if (sandboxResult.risk_score_penalty > 0) {
    totalRiskScore += sandboxResult.risk_score_penalty;
    const severities = sandboxResult.dom_flags.map(f => f.description);
    aiInsights.push(...severities);
  }

  // Camada 7: Visual AI (Perceptual Hashing)
  const visualIntel = analyzeVisualHash(sandboxResult.screenshot, domain);
  if (visualIntel.risk_score_penalty > 0) {
    totalRiskScore += visualIntel.risk_score_penalty;
    aiInsights.push(visualIntel.details);
  }

  // Normalizando o Score
  const finalRiskScore = Math.min(totalRiskScore, 100);
  const status = finalRiskScore > 70 ? 'malicious' : finalRiskScore > 40 ? 'suspicious' : 'safe';

  if (aiInsights.length === 0) {
    aiInsights.push('Nenhuma anomalia crítica detectada. Padrões operacionais normais.');
  }

  return {
    url: url.href,
    domain,
    riskScore: finalRiskScore,
    status,
    details: {
      ssl: { valid: true, issuer: "GlobalSign", expiry: "2026-12-01" }, // Em prd extrairia do DNS/HTTPS via tls.connect
      whois: whoisInfo,
      reputation,
      dns: dnsIntel,
      typosquatting: typoResult,
      sandbox: sandboxResult,
      visual: visualIntel,
      asn: asnIntel
    },
    screenshot: sandboxResult.screenshot,
    aiAnalysis: aiInsights.join(' '),
    notificationsSent: await triggerAutomations(finalRiskScore, domain)
  };
};

async function triggerAutomations(score, domain) {
  if (score > 50 && process.env.N8N_WEBHOOK_URL) {
    try {
      await axios.post(process.env.N8N_WEBHOOK_URL, {
        event: 'threat_detected',
        score,
        domain,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

async function getWhoisData(domain) {
  try {
    const data = await whoiser(domain);
    // Extrair dados básicos de forma simplificada
    return {
      registrar: data[Object.keys(data)[0]]?.registrar || 'Desconhecido',
      createdDate: data[Object.keys(data)[0]]?.createdDate || 'N/A',
      country: data[Object.keys(data)[0]]?.registrantCountry || 'Privado'
    };
  } catch (e) {
    return { error: 'Whois Indisponível' };
  }
}

async function checkReputation(domain) {
  // Simulação de consulta a blacklists
  return {
    phishTank: false,
    googleSafeBrowsing: true,
    virusTotalHits: 0
  };
}

async function captureScreenshot(url) {
  // Placeholder para Screenshot
  // let browser;
  // try {
  //   browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  //   const page = await browser.newPage();
  //   await page.goto(url);
  //   const base64 = await page.screenshot({ encoding: 'base64' });
  //   return `data:image/png;base64,${base64}`;
  // } finally {
  //   if(browser) await browser.close();
  // }
  return "https://via.placeholder.com/800x600?text=Sandbox+Preview+Scan";
}

function calculateRiskScore({ domain, whoisInfo, reputation }) {
  let score = 10;
  // Domínios novos são mais arriscados
  if (whoisInfo.createdDate && whoisInfo.createdDate.includes('2024')) score += 40;
  if (reputation.virusTotalHits > 0) score += 50;
  return Math.min(score, 100);
}

module.exports = { analyze };
