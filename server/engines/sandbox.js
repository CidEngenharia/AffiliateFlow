/**
 * Sandbox Execution & DOM Analysis Engine
 * Usa headless browser para extrair comportamento da página e cadeias de redirecionamento.
 */
const puppeteer = require('puppeteer');

async function executeSandbox(url) {
  const result = {
    redirect_chains: [],
    dom_flags: [],
    screenshot: null,
    final_url: null,
    status_code: null,
    risk_score_penalty: 0
  };

  let browser;
  try {
    // Configurações para evitar detecção básica antibot e rodar seguro
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security'
      ]
    });

    const page = await browser.newPage();
    
    // Disfarce do User Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Interceptar redirects
    let startTime = Date.now();
    page.on('response', response => {
      const status = response.status();
      if ((status >= 300 && status <= 399) || status === 200) {
        // Ignorar assets para a cadeia principal
        if (response.request().resourceType() === 'document') {
          const latency = Date.now() - startTime;
          startTime = Date.now();
          result.redirect_chains.push({
            url: response.url(),
            status_code: status,
            ip_address: response.remoteAddress().ip || 'Unknown',
            latency
          });
        }
      }
    });

    // Timeout de 15s para evitar travamento em sites maliciosos
    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    
    result.status_code = response ? response.status() : null;
    result.final_url = page.url();

    // Captura de tela base64
    const base64Screenshot = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 60 });
    result.screenshot = `data:image/jpeg;base64,${base64Screenshot}`;

    // Análise de DOM heurística
    const domAnalysis = await page.evaluate(() => {
      const flags = [];
      
      // 1. Verificar iframes invisíveis (Cloaking/Clickjacking)
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(f => {
        if (f.style.opacity === '0' || f.style.display === 'none' || f.width === '0') {
          flags.push({ type: 'hidden_iframe', severity: 'high', description: 'Iframe invisível detectado na página.' });
        }
      });

      // 2. Verificar formulários pedindo senha (Phishing clássico)
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      if (passwordInputs.length > 0) {
        flags.push({ type: 'credential_harvesting', severity: 'critical', description: 'Formulário solicitando senha encontrado no DOM.' });
      }

      // 3. Verificar scripts ofuscados gigantes
      const scripts = document.querySelectorAll('script');
      scripts.forEach(s => {
        if (s.innerHTML.length > 5000 && (s.innerHTML.includes('eval(') || s.innerHTML.includes('atob(') || s.innerHTML.includes('unescape('))) {
          flags.push({ type: 'obfuscated_script', severity: 'high', description: 'Possível script ofuscado detectado usando eval/atob.' });
        }
      });

      // 4. Botões cobrindo a tela toda
      const buttons = document.querySelectorAll('button, a');
      buttons.forEach(b => {
        const rect = b.getBoundingClientRect();
        if (rect.width > window.innerWidth * 0.9 && rect.height > window.innerHeight * 0.9) {
          flags.push({ type: 'overlay_click_trap', severity: 'medium', description: 'Elemento clicável ocupando toda a tela (Click Trap).' });
        }
      });

      return flags;
    });

    result.dom_flags = domAnalysis;

    // Calcular penalidade de risco do DOM
    for (const flag of result.dom_flags) {
      if (flag.severity === 'critical') result.risk_score_penalty += 40;
      if (flag.severity === 'high') result.risk_score_penalty += 25;
      if (flag.severity === 'medium') result.risk_score_penalty += 10;
    }

    // Penalidade por redirects excessivos (Cloaking/Evasion)
    if (result.redirect_chains.length > 3) {
      result.risk_score_penalty += 20;
      result.dom_flags.push({ type: 'redirect_chain', severity: 'medium', description: `Cadeia longa de redirecionamento (${result.redirect_chains.length} saltos).` });
    }

  } catch (err) {
    console.error(`[Sandbox Engine] Erro ao executar ${url}:`, err.message);
    result.dom_flags.push({ type: 'sandbox_timeout_or_error', severity: 'low', description: `Erro no headless browser: ${err.message}` });
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }

  return result;
}

module.exports = { executeSandbox };
