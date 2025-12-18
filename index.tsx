
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- TYPES ---
enum Role { USER = 'user', MODEL = 'model' }
type ModelId = 'standard' | 'pro' | 'eco';

interface Message {
  id: string;
  role: Role;
  text: string;
  imageUrl?: string;
  inputImageUrl?: string;
  timestamp: Date;
}

// --- CONSTANTS ---
const MODELS = [
  { id: 'standard', name: 'NikiViti', geminiModel: 'gemini-3-flash-preview' },
  { id: 'pro', name: 'NikiViti 2.0', geminiModel: 'gemini-3-pro-preview' },
  { id: 'eco', name: 'NikiViti Art', geminiModel: 'gemini-2.5-flash-image' }
] as const;

const SYSTEM_PROMPTS: Record<ModelId, string> = {
  standard: "Вы — NikiViti. Основной интеллект системы Solaris. Вы быстры, умны и запоминаете всё, что говорит пользователь.",
  pro: "Вы — NikiViti 2.0. Эксперт мирового уровня в программировании. Вы пишете безупречный код, используете SOLID и паттерны. Ваша логика глубока, а память на контекст — идеальна.",
  eco: "Вы — NikiViti Art. Творческий гений. Ваша задача — создавать невероятные текстовые описания для визуализации и генерировать арт-концепты."
};

// --- COMPONENTS ---

const ChatMessage: React.FC<{ message: Message; modelId?: string }> = ({ message, modelId }) => {
  const isUser = message.role === Role.USER;
  const theme = isUser 
    ? 'bg-white/[0.05] border-white/10 text-white ml-auto rounded-tr-none' 
    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-50 mr-auto rounded-tl-none';

  return (
    <div className={`flex w-full mb-6 message-bubble ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`relative max-w-[85%] md:max-w-[75%] px-6 py-5 rounded-[2rem] border backdrop-blur-md ${theme}`}>
        {message.inputImageUrl && <img src={message.inputImageUrl} className="mb-4 rounded-xl border border-white/10 max-h-64 object-contain" />}
        {message.imageUrl && <img src={message.imageUrl} className="mb-4 rounded-xl shadow-2xl" />}
        <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.text}</div>
        <div className="mt-3 text-[9px] font-black uppercase tracking-widest opacity-20">
          {isUser ? 'CLIENT' : 'NIKIVITI CORE'} • {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
      </div>
    </div>
  );
};

const TypingIndicator: React.FC = () => (
  <div className="flex space-x-2 p-6 bg-white/5 rounded-[2rem] border border-white/10 w-24 mb-6">
    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-duration:0.6s]"></div>
    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.1s]"></div>
    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]"></div>
  </div>
);

// --- MAIN APP ---

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: Role.MODEL, text: 'Ядро NikiViti Solaris v2.1.0 онлайн. Все ошибки загрузки устранены. Я помню нашу историю. Какой запрос обработать?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<ModelId>('pro');
  const [image, setImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !image) || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: Role.USER, text: input, inputImageUrl: image || undefined, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setImage(null);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const activeModel = MODELS.find(m => m.id === model)!;
      
      const contents = model === 'eco' ? [] : messages.slice(-15).map(m => ({
        role: m.role === Role.USER ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const currentParts: any[] = [{ text: input }];
      if (image) {
        const [mime, data] = image.split(',');
        currentParts.unshift({ inlineData: { mimeType: mime.match(/:(.*?);/)?.[1] || 'image/png', data } });
      }
      contents.push({ role: 'user', parts: currentParts });

      const response = await ai.models.generateContent({
        model: activeModel.geminiModel,
        contents,
        config: { systemInstruction: SYSTEM_PROMPTS[model], temperature: model === 'pro' ? 0.2 : 0.7 }
      });

      let resText = "";
      let resImg = undefined;
      response.candidates?.[0]?.content?.parts.forEach(p => {
        if (p.text) resText += p.text;
        if (p.inlineData) resImg = `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`;
      });

      setMessages(prev => [...prev, { id: Date.now().toString(), role: Role.MODEL, text: resText || "Запрос обработан.", imageUrl: resImg, timestamp: new Date() }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: Role.MODEL, text: "Ошибка нейронного узла. Попробуйте снова.", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <header className="px-8 py-5 border-b border-white/5 bg-black/40 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">N</div>
          <div>
            <h1 className="text-xl font-black tracking-tighter">NikiViti <span className="text-emerald-400">Solaris</span></h1>
            <div className="flex items-center space-x-1.5 opacity-40"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span><span className="text-[10px] font-bold uppercase tracking-widest">Active Core</span></div>
          </div>
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-10 md:px-20">
        <div className="max-w-4xl mx-auto">
          {messages.map(m => <ChatMessage key={m.id} message={m} modelId={m.role === Role.MODEL ? model : undefined} />)}
          {isLoading && <TypingIndicator />}
        </div>
      </main>

      <footer className="p-6 md:p-10 bg-black/60 border-t border-white/5 shrink-0 backdrop-blur-2xl">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 mb-6">
            {MODELS.map(m => (
              <button key={m.id} onClick={() => setModel(m.id)} className={`flex-1 py-3 rounded-xl border text-[10px] font-black tracking-widest uppercase transition-all ${model === m.id ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-lg scale-105' : 'border-white/5 text-white/20 hover:text-white/40'}`}>
                {m.name}
              </button>
            ))}
          </div>

          <form onSubmit={handleSend} className="flex gap-4 items-center">
            <button type="button" onClick={() => document.getElementById('file')?.click()} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/30 hover:text-emerald-400 transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              <input type="file" id="file" hidden onChange={e => {
                const f = e.target.files?.[0];
                if(f) { const r = new FileReader(); r.onload = () => setImage(r.result as string); r.readAsDataURL(f); }
              }} />
            </button>
            <div className="flex-1 relative">
              {image && <div className="absolute -top-24 left-0 bg-slate-900 p-2 rounded-xl border border-emerald-500/30 flex gap-2 items-center"><img src={image} className="w-12 h-12 rounded-lg" /><button onClick={()=>setImage(null)} className="text-rose-400 text-xs font-bold px-2">X</button></div>}
              <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Ваш запрос для Solaris..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4.5 px-8 outline-none focus:border-emerald-500/40 transition-all text-white font-medium" />
            </div>
            <button type="submit" disabled={isLoading} className="p-4.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl hover:scale-105 active:scale-95 transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
