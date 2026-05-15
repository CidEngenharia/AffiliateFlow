import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || ''
});

export const aiService = {
  async generateCaption(linkTitle: string, targetAudience: string = 'geral') {
    try {
      const prompt = `
        Aja como um especialista em copywriting e marketing de afiliados de alta performance.
        Crie 3 opções de legendas persuasivas e altamente magnéticas para promover o produto: "${linkTitle}".
        O público alvo é: ${targetAudience}.
        
        Regras:
        1. Use gatilhos mentais (escassez, urgência, autoridade).
        2. Inclua emojis de forma estratégica.
        3. Termine com uma Chamada para Ação (CTA) clara.
        4. Divida em: Opção 1 (Direta), Opção 2 (Narrativa/Storytelling), Opção 3 (Curiosidade).
        5. Forneça também 5 hashtags relevantes.
      `;

      const response = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
      });

      return response.text;
    } catch (error) {
      console.error('Erro ao gerar legenda com IA:', error);
      throw new Error('Falha ao gerar legenda. Verifique sua chave de API.');
    }
  },

  async refineSearchQuery(query: string) {
    try {
      const prompt = `
        Aja como um especialista em OSINT e buscas avançadas.
        Melhore a seguinte query de busca para obter resultados mais precisos e profissionais: "${query}".
        Forneça 3 versões:
        1. Refinada (melhorada com operadores básicos)
        2. OSINT (focada em encontrar dados sensíveis ou técnicos)
        3. Acadêmica/Profissional (focada em documentos e fontes confiáveis)
        
        Responda apenas com as queries, uma por linha.
      `;

      const response = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
      });

      return response.text.split('\n').filter(q => q.trim().length > 0);
    } catch (error) {
      console.error('Erro ao refinar query:', error);
      return [query];
    }
  },

  async summarizeSearchResults(query: string, results: any[]) {
    try {
      const prompt = `
        Analise os seguintes resultados de busca para a query: "${query}".
        Resultados: ${JSON.stringify(results)}
        
        Forneça um resumo executivo dos achados mais relevantes, identificando tendências, riscos ou oportunidades.
        Use bullet points e seja direto.
      `;

      const response = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
      });

      return response.text;
    } catch (error) {
      console.error('Erro ao sumarizar resultados:', error);
      return 'Não foi possível gerar um resumo no momento.';
    }
  }
};
