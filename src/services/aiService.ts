import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || ''
});

export const aiService = {
  async generateCaption(linkTitle: string, targetAudience: string = 'geral') {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (!apiKey || apiKey === 'SUA_CHAVE_GEMINI_AQUI') {
        throw new Error('Chave de API do Gemini não configurada');
      }

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
      console.warn('Erro ao gerar legenda com Gemini, utilizando gerador alternativo offline:', error);
      
      const cleanTitle = linkTitle.replace(/[^a-zA-Z0-9\s]/g, '').trim();
      const tagTitle = cleanTitle.replace(/\s+/g, '');
      const tagAudience = targetAudience.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '');

      return `
Opção 1 (Direta)
Quer elevar o nível dos seus resultados? Descubra o ${linkTitle}! Desenvolvido especialmente para o público ${targetAudience}, ele oferece alta praticidade, performance e resultados rápidos no seu dia a dia. Não perca tempo e garanta já o seu com desconto exclusivo de lançamento! 🚀

Opção 2 (Narrativa/Storytelling)
Eu passei muito tempo procurando a melhor forma de atingir meus objetivos até que encontrei o ${linkTitle}. A diferença foi imediata! A facilidade de uso e os benefícios focados em ${targetAudience} me pouparam horas de trabalho e esforço. Se você também quer essa transformação, aproveite a oferta no meu link oficial! 💡

Opção 3 (Curiosidade)
Você já se perguntou o que profissionais de ponta usam para se destacar? O segredo está em ferramentas como o ${linkTitle}. Criado sob medida para ${targetAudience}, ele resolve os principais gargalos e acelera sua evolução de forma surpreendente. Quer saber como funciona? Clique no botão e confira todos os detalhes! 🎯

Hashtags:
#${tagTitle || 'Produto'} #AfiliadoProfissional #Produtividade #${tagAudience || 'Geral'} #AfiliateFlow
      `.trim();
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
