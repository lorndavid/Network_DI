import { GoogleGenAI } from "@google/genai";
import { Cabin } from "../types";

// Fix: Use process.env.API_KEY directly as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const askNetworkAssistant = async (question: string, contextData: Cabin[]) => {
  try {
    // Summarize context to save tokens and provide relevant info
    const summary = contextData.map(c => {
      // Create devices list from new devices array
      const devices = c.devices ? c.devices.map(d => `${d.name} (${d.type} ${d.ports}p)`) : [];

      const tablesList = Object.values(c.tables || {});

      return {
        id: c.number,
        side: c.type, 
        devices: devices,
        tables: tablesList.length,
        pcs_offline: tablesList.reduce((acc, t) => acc + Object.values(t.pcs || {}).filter(p => p.status === 'offline').length, 0),
        pcs_total: tablesList.reduce((acc, t) => acc + Object.keys(t.pcs || {}).length, 0)
      };
    });

    const prompt = `
      You are a Network Administrator Assistant for "Digital Industry".
      Context Data (Current Infrastructure): ${JSON.stringify(summary)}

      User Question: ${question}

      Instructions:
      1. Provide a concise answer.
      2. Analyze the context data to find insights (e.g., which cabin has most offline PCs).
      3. Be professional and helpful.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return "Sorry, I am unable to connect to the AI service at the moment. Please check your API Key configuration.";
  }
};