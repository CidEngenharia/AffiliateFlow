const fs = require('fs');
const path = require('path');

const slimData = JSON.parse(fs.readFileSync('scratch/slim-2.json'));

const numericToAlpha2 = {};
const alpha2ToNameEn = {};

slimData.forEach(item => {
  const num = parseInt(item['country-code'], 10);
  const a2 = item['alpha-2'];
  const name = item['name'];
  
  if (!isNaN(num)) {
    numericToAlpha2[num] = a2;
  }
  alpha2ToNameEn[a2] = name;
});

// Portuguese translations for common countries
const countryNameMapPt = {
  'BR': 'Brasil',
  'US': 'Estados Unidos',
  'PT': 'Portugal',
  'ES': 'Espanha',
  'FR': 'França',
  'DE': 'Alemanha',
  'GB': 'Reino Unido',
  'IT': 'Itália',
  'AR': 'Argentina',
  'CL': 'Chile',
  'UY': 'Uruguai',
  'MX': 'México',
  'CA': 'Canadá',
  'CN': 'China',
  'JP': 'Japão',
  'IN': 'Índia',
  'RU': 'Rússia',
  'AU': 'Austrália',
  'NZ': 'Nova Zelândia',
  'ZA': 'África do Sul',
  'CO': 'Colômbia',
  'PE': 'Peru',
  'VE': 'Venezuela',
  'EC': 'Equador',
  'BO': 'Bolívia',
  'PY': 'Paraguai',
  'NL': 'Holanda',
  'BE': 'Bélgica',
  'CH': 'Suíça',
  'SE': 'Suécia',
  'NO': 'Noruega',
  'DK': 'Dinamarca',
  'FI': 'Finlândia',
  'IE': 'Irlanda',
  'IL': 'Israel',
  'TR': 'Turquia',
  'SG': 'Singapura',
  'KR': 'Coreia do Sul',
  'AO': 'Angola',
  'MZ': 'Moçambique'
};

const output = `// Codigo gerado automaticamente a partir do slim-2.json
// Contem mapeamentos de codigos ISO 3166-1

export const NUMERIC_TO_ALPHA2: Record<number, string> = ${JSON.stringify(numericToAlpha2, null, 2)};

export const ALPHA2_TO_NAME_EN: Record<string, string> = ${JSON.stringify(alpha2ToNameEn, null, 2)};

export const ALPHA2_TO_NAME_PT: Record<string, string> = ${JSON.stringify(countryNameMapPt, null, 2)};

export function getCountryNamePt(alpha2: string): string {
  const code = alpha2.toUpperCase();
  return ALPHA2_TO_NAME_PT[code] || ALPHA2_TO_NAME_EN[code] || alpha2;
}

export function getAlpha2FromNumeric(num: number): string | undefined {
  return NUMERIC_TO_ALPHA2[num];
}
`;

fs.mkdirSync('src/utils', { recursive: true });
fs.writeFileSync('src/utils/countryMapping.ts', output);
console.log('Mapping file generated successfully at src/utils/countryMapping.ts');
