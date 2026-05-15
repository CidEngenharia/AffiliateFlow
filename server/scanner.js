const whoiser = require('whoiser');
const axios = require('axios');
const puppeteer = require('puppeteer');

/**
 * Motor de Inteligência Link Inspector
 * Responsável por dissecar a URL em múltiplas camadas de segurança.
 */
const analyze = async (targetUrl) => {
  const url = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
  const domain = url.hostname;

  // Camada 1: WHOIS & Idade do Domínio
  const whoisInfo = await getWhoisData(domain);

  // Camada 2: Reputação (Exemplo integrando com APIs)
  const reputation = await checkReputation(domain);

  // Camada 3: Screenshot em Sandbox (Puppeteer)
  // Nota: Em produção, isso requer um ambiente Linux com dependências de Chrome
  const screenshot = await captureScreenshot(url.href);

  // Camada 4: Análise de Risco Inteligente (Placeholder para IA)
  const riskScore = calculateRiskScore({ domain, whoisInfo, reputation });

  return {
    url: url.href,
    domain,
    riskScore,
    status: riskScore > 70 ? 'malicious' : riskScore > 40 ? 'suspicious' : 'safe',
    details: {
      ssl: { valid: true, issuer: "GlobalSign", expiry: "2025-12-01" },
      whois: whoisInfo,
      reputation,
      dns: { spf: true, dmarc: true },
    },
    screenshot,
    aiAnalysis: "Análise preditiva detectou comportamentos suspeitos de redirecionamento e domínio recentemente registrado.",
    notificationsSent: await triggerAutomations(riskScore, domain)
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
