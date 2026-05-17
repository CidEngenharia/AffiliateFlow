/**
 * ASN & IP Intelligence Engine
 * Mapeia o IP para um Autonomous System Number (ASN) e avalia o risco da hospedagem
 */
const axios = require('axios');

async function analyzeASN(ipAddress) {
  const result = {
    ip: ipAddress,
    asn_number: null,
    asn_name: null,
    country: null,
    is_datacenter: false,
    is_tor_exit: false,
    reputation_score: 0
  };

  if (!ipAddress) return result;

  try {
    // Usando IP-API para consultar informações de ASN (Free Tier limit: 45 req/min)
    const response = await axios.get(`http://ip-api.com/json/${ipAddress}?fields=status,country,isp,as,hosting,mobile,proxy`);
    const data = response.data;

    if (data.status === 'success') {
      result.country = data.country;
      
      // 'as' normalmente vem como "AS13335 Cloudflare, Inc."
      if (data.as) {
        const parts = data.as.split(' ');
        result.asn_number = parts[0];
        result.asn_name = parts.slice(1).join(' ');
      }

      result.is_datacenter = data.hosting === true;
      result.is_tor_exit = data.proxy === true;

      // Heurística de Reputação Básica
      // Datacenters ou proxies de países de alto risco frequentemente hosteiam phishing
      const highRiskASNs = ['AS14061', 'AS20473', 'AS4134']; // Exemplo fictício de ASNs de bulletproof hosting
      if (result.asn_number && highRiskASNs.includes(result.asn_number)) {
        result.reputation_score += 50;
      }
      if (result.is_tor_exit) {
        result.reputation_score += 80; // Acesso via Tor ou proxy anônimo
      }
    }
  } catch (err) {
    console.error(`[ASN Engine] Erro ao consultar ASN para ${ipAddress}:`, err.message);
  }

  return result;
}

module.exports = { analyzeASN };
