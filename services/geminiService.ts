
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Role, ModelId } from "../types";

const SYSTEM_INSTRUCTIONS: Record<ModelId, string> = {
  standard: "Вы — NikiViti Standard. Интеллектуальный помощник с быстрым мышлением. Вы всегда вежливы, лаконичны и полезны. Вы запоминаете историю общения, чтобы давать более точные ответы.",
  pro: "Вы — NikiViti 2.0. Экспертная нейросеть с упором на программирование и научный анализ. Вы — мастер Full-stack разработки. При написании кода всегда следуйте лучшим практикам (Clean Code, DRY, SOLID). Ваши ответы глубоки, логичны и точны. Вы обладаете великолепной памятью на контекст беседы.",
  eco: "Вы — NikiViti Art. Креативный дизайнер и художник. Ваша цель — превращать слова в визуальные концепции. На каждый запрос создавайте детализированное, художественное описание для генерации изображения, используя богатый визуальный язык."
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

  const parts: any[] = [{ text: modelId === 'eco' ? `NikiViti Art conceptualization: ${newMessage}` : newMessage }];
  
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

  // Increased context memory for the AI (last 12 messages)
  const contents = modelId === 'eco' ? [] : history.slice(-12).map(msg => ({
    role: msg.role === Role.USER ? "user" : "model",
    parts: [{ text: msg.text }]
  }));

  contents.push({ role: "user", parts: (parts.length > 1 || imageInput) ? parts : [{ text: newMessage }] });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS[modelId],
        temperature: modelId === 'pro' ? 0.4 : 0.8, // Lower temperature for more precise coding/logic in 2.0
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

    if (!text && !imageUrl) throw new Error("Сигнал NikiViti потерян.");
    
    return { text, imageUrl };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Сбой Solaris Core. Повторите запрос через мгновение.");
  }
};
