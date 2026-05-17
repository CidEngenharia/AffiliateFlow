/**
 * Typosquatting Engine
 * Calcula distância de Levenshtein e detecta clones de marcas famosas usando homóglifos
 */

const TARGET_BRANDS = [
  'paypal', 'google', 'netflix', 'microsoft', 'apple', 'amazon', 
  'facebook', 'whatsapp', 'instagram', 'binance', 'coinbase',
  'itau', 'nubank', 'bradesco', 'santander', 'mercadolivre'
];

// Cálculo de distância de Levenshtein (edições necessárias)
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substituição
          matrix[i][j - 1] + 1,     // inserção
          matrix[i - 1][j] + 1      // deleção
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Converte homóglifos conhecidos para caracteres normais antes de comparar
function normalizeHomoglyphs(str) {
  const homoglyphMap = {
    '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
    'l': 'i', 'rn': 'm', 'vv': 'w', 'cl': 'd'
  };
  
  let normalized = str.toLowerCase();
  for (const [fake, real] of Object.entries(homoglyphMap)) {
    normalized = normalized.split(fake).join(real);
  }
  return normalized;
}

function analyzeTyposquatting(domain) {
  const result = {
    is_typosquatting: false,
    matched_brand: null,
    risk_score: 0,
    details: []
  };

  // Pegar apenas o nome do domínio principal (removendo TLD e subdomínios)
  // Ex: "paypaI-security.com" -> "paypai-security"
  const parts = domain.split('.');
  const baseName = parts.length > 2 ? parts[parts.length - 2] : parts[0];
  
  const normalizedBase = normalizeHomoglyphs(baseName);

  for (const brand of TARGET_BRANDS) {
    if (baseName === brand) {
      // É a própria marca (precisa ver se o resto da URL é legítima ou é subdomínio falso)
      // Ex: google.com.secure-login.xyz
      continue;
    }

    const distance = levenshteinDistance(normalizedBase, brand);
    
    // Se a distância for 1 ou 2, é altamente provável que seja Typosquatting
    if (distance > 0 && distance <= 2 && brand.length > 4) {
      result.is_typosquatting = true;
      result.matched_brand = brand;
      result.risk_score += 80; // Altíssimo risco heurístico
      result.details.push(`Possível clone visual de '${brand}'. Distância de Levenshtein: ${distance}`);
      break;
    }

    // Se conter a marca no nome (ex: suporte-netflix)
    if (normalizedBase.includes(brand) && normalizedBase !== brand) {
      result.is_typosquatting = true;
      result.matched_brand = brand;
      result.risk_score += 40;
      result.details.push(`Domínio contém nome da marca protegida: '${brand}'`);
      break;
    }
  }

  return result;
}

module.exports = { analyzeTyposquatting };
