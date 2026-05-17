/**
 * DNS Intelligence Engine
 * Analisa registros DNS em busca de configurações usadas em ataques de spoofing ou phishing
 */
const dns = require('dns').promises;

async function analyzeDNS(domain) {
  const result = {
    mx: false,
    spf: false,
    dmarc: false,
    spf_record: null,
    dmarc_record: null,
    ips: []
  };

  try {
    // 1. Resolução A/AAAA para obter IPs associados
    const recordsA = await dns.resolve4(domain).catch(() => []);
    result.ips = recordsA;

    // 2. Verificar MX (Mail Exchange) - vital para receber respostas de phishing
    const recordsMX = await dns.resolveMx(domain).catch(() => []);
    result.mx = recordsMX.length > 0;

    // 3. Verificar SPF (TXT) - spoofing
    const recordsTXT = await dns.resolveTxt(domain).catch(() => []);
    for (const txtArray of recordsTXT) {
      const txt = txtArray.join('');
      if (txt.includes('v=spf1')) {
        result.spf = true;
        result.spf_record = txt;
      }
    }

    // 4. Verificar DMARC
    const recordsDMARC = await dns.resolveTxt(`_dmarc.${domain}`).catch(() => []);
    for (const txtArray of recordsDMARC) {
      const txt = txtArray.join('');
      if (txt.includes('v=DMARC1')) {
        result.dmarc = true;
        result.dmarc_record = txt;
      }
    }
  } catch (err) {
    console.error(`[DNS Engine] Erro ao analisar ${domain}:`, err.message);
  }

  return result;
}

module.exports = { analyzeDNS };
