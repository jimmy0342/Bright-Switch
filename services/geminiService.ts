
import { GoogleGenAI } from "@google/genai";

export const askGeminiAssistant = async (prompt: string, history: { role: 'user' | 'assistant', content: string }[]) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    return "Error: AI Assistant is not configured. Please add a valid Gemini API Key to your environment.";
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `You are the "Electrical Advisor AI". 
  You are an expert in electrical components, circuit breakers, and power distribution systems.
  Your goal is to help customers find the right product, explain technical specifications (Amps, Volts, Breaking Capacity), 
  and provide safety advice. 
  Be professional, technical yet accessible, and always prioritize electrical safety.
  If asked about pricing, remind users that B2B accounts get exclusive wholesale rates.`;

  try {
    console.log("Initializing Gemini Client...");
    /* @ts-ignore */
    const ai = new GoogleGenAI({ apiKey });

    /* @ts-ignore */
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        ...history.map(h => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }]
        })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
      }
    });

    console.log("Gemini Response received");
    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return `[Debug Error] Details: ${error.message || JSON.stringify(error)}`;
  }
};

export const generateProductDescription = async (name: string, category: string, brand: string) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') return "";

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Write a professional, SEO-optimized product description for an electrical component.
  Product Name: ${name}
  Category: ${category}
  Brand: ${brand}
  
  The description should be technical, highlight reliability and safety, and be approximately 2-3 paragraphs. 
  Focus on industrial use cases and compliance with international standards. Do not use formatting like bold or bullet points, just plain text paragraphs.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini Description Error:", error);
    throw error;
  }
};
