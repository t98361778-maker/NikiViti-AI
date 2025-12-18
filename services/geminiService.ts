
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Role, ModelId } from "../types";

const SYSTEM_INSTRUCTIONS: Record<ModelId, string> = {
  standard: "Вы — NikiViti. Основной нейронный узел Solaris Spectrum. Ваша цель — быстрое, вежливое и точное общение. Вы всегда помните контекст беседы и адаптируетесь под стиль пользователя. Вы лаконичны, но глубоки в своих знаниях.",
  pro: "Вы — NikiViti 2.0. Элитный модуль программирования и системного анализа. Вы — старший инженер с глубочайшим пониманием архитектуры ПО, алгоритмов и современного стека (React, TS, Python, Go, Rust). Ваш код всегда чист (Clean Code), документирован и готов к продакшну. Вы используете сложные рассуждения, чтобы решать нестандартные задачи. Вы обладаете идеальной памятью на контекст текущей сессии.",
  eco: "Вы — NikiViti Art. Творческий синтезатор Solaris. Ваша задача — переводить абстрактные идеи в детализированные визуальные описания (промпты). Вы используете поэтичный, художественный и технически точный язык для описания света, текстур и композиции. Вы вдохновляете пользователя на создание визуальных шедевров."
};

export const sendMessageToGemini = async (
  history: Message[],
  newMessage: string,
  modelId: ModelId,
  imageInput?: string
): Promise<{ text: string; imageUrl?: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const modelName = modelId === 'eco' 
    ? 'gemini-2.5-flash-image' 
    : modelId === 'pro' 
      ? 'gemini-3-pro-preview' 
      : 'gemini-3-flash-preview';

  const parts: any[] = [{ text: modelId === 'eco' ? `Art Concept: ${newMessage}` : newMessage }];
  
  if (imageInput) {
    const [mimeInfo, data] = imageInput.split(',');
    const mimeType = mimeInfo.match(/:(.*?);/)?.[1] || 'image/png';
    parts.unshift({
      inlineData: {
        mimeType: mimeType,
        data: data
      }
    });
  }

  // Optimized Context Window: Memory retention of the last 15 messages for better coherence.
  const contents = modelId === 'eco' ? [] : history.slice(-15).map(msg => ({
    role: msg.role === Role.USER ? "user" : "model",
    parts: [{ text: msg.text }]
  }));

  // Append current turn
  contents.push({ role: "user", parts: (parts.length > 1 || imageInput) ? parts : [{ text: newMessage }] });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS[modelId],
        temperature: modelId === 'pro' ? 0.2 : 0.8, // Low temperature for 2.0 ensures precision in code.
        thinkingConfig: modelId === 'pro' ? { thinkingBudget: 4000 } : undefined // Enable reasoning for 2.0
      }
    });

    let text = "";
    let imageUrl = undefined;

    const resParts = response.candidates?.[0]?.content?.parts || [];
    
    for (const part of resParts) {
      if (part.text) text += part.text;
      if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    if (!text && !imageUrl) throw new Error("Neural link failed. No data received.");
    
    return { text, imageUrl };
  } catch (error) {
    console.error("Solaris Link Error:", error);
    throw new Error("Критический сбой связи Solaris. Пожалуйста, перезапустите нейронный узел.");
  }
};
