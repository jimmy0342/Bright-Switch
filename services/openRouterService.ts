import { askLocalAssistant } from './localAgentService';

export const askOpenRouterAssistant = async (
    prompt: string,
    history: { role: 'user' | 'assistant', content: string }[],
    productContext: string = ""
) => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
        console.warn("OpenRouter API Key missing, switching to Local Agent.");
        return askLocalAssistant(prompt);
    }

    const systemInstruction = `You are the "Electrical Advisor AI" for BrightSwitch Global. 
  You are a warm, professional, and highly knowledgeable electrical engineering expert. 

  ### COMPANY IDENTITY & HISTORY
  - **Company**: BrightSwitch Global (Est. 2015).
  - **Location**: Based in Peshawar, Pakistan (Chowk Yadgar, Dakhanna Market).
  - **Mission**: Powering progress and ensuring safety across Pakistan with complete electrical solutions.

  ### PRODUCT KNOWLEDGE
  ${productContext}
  
  **CRITICAL RULE**: Only provide links to products that are listed in the AVAILABLE REAL PRODUCTS above.
  - For real products, use the format: [Product Name](/product/ID)
  - For general categories, use: [Category Name](/shop?category=CategoryName)

  ### CONVERSATIONAL STYLE
  - **Be Human-Like**: Use friendly, professional language and a warm tone.
  - **Multilingual Support**: If the user asks a question in **Romanized Urdu** (e.g., "Mera breaker trip kar gaya hai"), you MUST respond in **Romanized Urdu**. Otherwise, respond in **English**.
  - **Avoid Hallucinations**: If a product is not in the list provided above, admit you don't have its specific record but can offer general advice or direct them to our [Browse Catalog](/shop).
  - **Support**: Direct bulk inquiries to our hotline: 03009591658.

  Always prioritize electrical safety and international standards (IEC, CE). If a question is outside electrical expertise, politely steer back to BrightSwitch solutions.`;

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'BrightSwitch',
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-20b:free',
                messages: [
                    { role: 'system', content: systemInstruction },
                    ...history,
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1500
            })
        });

        if (!response.ok) {
            if (response.status === 429) {
                return "The AI is currently receiving too many requests. Please wait a few seconds and try again.";
            }
            return `The Electrical Advisor is currently unavailable. Please try again in a moment.`;
        }

        const data = await response.json();
        return data.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
    } catch (error: any) {
        console.error("OpenRouter Service Error:", error);
        return `I'm having trouble connecting. Please check your internet connection.`;
    }
};
