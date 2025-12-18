
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Role, ModelId } from "../types";

const SYSTEM_INSTRUCTIONS: Record<ModelId, string> = {
  standard: "Вы NikiViti Standard Solaris. Умная, разумная нейросеть с чувством стиля. Вы отлично пишете код и даете глубокие ответы.",
  pro: "Вы NikiViti Pro Solaris. Самый мощный интеллект в линейке. Выдаете идеальный код и мгновенные решения. Вы - мастер логики.",
  eco: "Вы NikiViti Art Solaris. Художник и дизайнер. Ваша задача - только генерировать визуальные шедевры. На любой запрос создавайте детальное описание арта."
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
      ? 'gemini-3-flash-preview' 
      : 'gemini-3-pro-preview';

  const parts: any[] = [{ text: modelId === 'eco' ? `NikiViti Art visualization: ${newMessage}` : newMessage }];
  
  if (imageInput) {
    const [mime, data] = imageInput.split(',');
    parts.unshift({
      inlineData: {
        mimeType: mime.split(':')[1].split(';')[0],
        data: data
      }
    });
  }

  const contents = modelId === 'eco' ? [] : history.slice(-8).map(msg => ({
    role: msg.role === Role.USER ? "user" : "model",
    parts: [{ text: msg.text }]
  }));

  contents.push({ role: "user", parts });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS[modelId],
        temperature: 0.8,
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

    if (!text && !imageUrl) throw new Error("Система NikiViti не смогла обработать сигнал.");
    
    return { text, imageUrl };
  } catch (error) {
    console.error(error);
    throw new Error("Ошибка Solaris Core. Попробуйте отправить запрос снова.");
  }
};
