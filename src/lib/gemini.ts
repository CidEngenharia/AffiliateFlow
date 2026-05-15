/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateLinkDescription(productName: string, platform: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gere uma descrição persuasiva de 1 a 2 frases para o produto "${productName}" da plataforma ${platform}. O foco deve ser em benefícios e gatilhos mentais para vendas.`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Aproveite esta oferta especial por tempo limitado!";
  }
}

export async function generateBundleSummary(productNames: string[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gere um resumo atrativo para uma coleção de produtos que contém: ${productNames.join(", ")}. Explique por que esses produtos são essenciais juntos. Máximo de 3 frases.`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Confira esta seleção exclusiva de produtos recomendados para você!";
  }
}

export async function parseBulkLinks(text: string): Promise<{name: string, url: string}[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Examine o seguinte texto e extraia uma lista de nomes de produtos e URLs de links de afiliados. 
      Retorne APENAS um JSON válido no formato [{name: string, url: string}].
      Texto: ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              url: { type: Type.STRING }
            },
            required: ["name", "url"]
          }
        }
      }
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Parse Error:", error);
    // Simple fallback if AI fails: split by lines and try to extract URLs
    return text.split("\n").filter(l => l.includes("http")).map(l => {
      const parts = l.split(" ");
      const url = parts.find(p => p.startsWith("http")) || "";
      const name = parts.filter(p => !p.startsWith("http")).join(" ") || "Produto sem nome";
      return { name, url };
    });
  }
}
