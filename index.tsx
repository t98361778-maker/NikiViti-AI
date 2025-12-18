
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- ТИПЫ ---
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

// --- КОНФИГУРАЦИЯ ---
const MODELS = [
  { id: 'standard', name: 'NikiViti', gemini: 'gemini-3-flash-preview' },
  { id: 'pro', name: 'NikiViti 2.0', gemini: 'gemini-3-pro-preview' },
  { id: 'eco', name: 'NikiViti Art', gemini: 'gemini-2.5-flash-image' }
] as const;

const SYSTEM_INSTRUCTIONS: Record<ModelId, string> = {
  standard: "Вы — NikiViti. Основной интеллект Solaris. Вы лаконичны, вежливы и помните контекст беседы.",
  pro: "Вы — NikiViti 2.0. Экспертный модуль программирования. Пишите идеальный код, используйте логику и рассуждения. Вы — Senior Developer.",
  eco: "Вы — NikiViti Art. Креативный мастер. Описывайте визуальные образы невероятно детально для последующей генерации."
};

// --- КОМПОНЕНТЫ ---

const ChatMessage: React.FC<{ msg: Message }> = ({ msg }) => {
  const isUser = msg.role === Role.USER;
  const theme = isUser 
    ? 'bg-white/[0.05] border-white/10 ml-auto rounded-tr-none shadow-lg' 
    : 'bg-emerald-500/10 border-emerald-500/20 mr-auto rounded-tl-none text-emerald-50 shadow-emerald-500/5';

  return (
    <div className={`flex w-full mb-8 message-anim ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] md:max-w-[75%] p-6 rounded-[2rem] border glass-panel ${theme}`}>
        {msg.inputImageUrl && <img src={msg.inputImageUrl} className="mb-4 rounded-xl max-h-80 object-contain w-full bg-black/20" />}
        {msg.imageUrl && <img src={msg.imageUrl} className="mb-4 rounded-xl shadow-2xl w-full" />}
        <div className="text-[15px] leading-relaxed whitespace-pre-wrap selection:bg-emerald-500/30">{msg.text}</div>
        <div className="mt-4 flex items-center gap-2 opacity-20 text-[9px] font-black tracking-widest uppercase">
          <span>{isUser ? 'CLIENT' : 'NIKIVITI CORE'}</span>
          <span>•</span>
          <span>{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
      </div>
    </div>
  );
};

const TypingIndicator: React.FC = () => (
  <div className="flex space-x-2 p-6 glass-panel rounded-[2rem] border border-emerald-500/10 w-24 mb-8">
    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-duration:0.6s]"></div>
    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.1s]"></div>
    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]"></div>
  </div>
);

// --- ПРИЛОЖЕНИЕ ---

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: Role.MODEL, text: 'Ядро NikiViti Solaris v2.3 активно. Канал связи стабилизирован. Какую задачу поставим перед системой?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>('pro');
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
      // КРИТИЧЕСКИ ВАЖНО: Берем ключ строго из process.env.API_KEY
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const currentConfig = MODELS.find(m => m.id === selectedModel)!;

      // Память на последние 12 сообщений
      const history = selectedModel === 'eco' ? [] : messages.slice(-12).map(m => ({
        role: m.role === Role.USER ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const currentParts: any[] = [{ text: input || "Requesting processing." }];
      if (image) {
        const [mime, data] = image.split(',');
        currentParts.unshift({ inlineData: { mimeType: mime.match(/:(.*?);/)?.[1] || 'image/png', data } });
      }
      history.push({ role: 'user', parts: currentParts });

      const response = await ai.models.generateContent({
        model: currentConfig.gemini,
        contents: history,
        config: { 
          systemInstruction: SYSTEM_INSTRUCTIONS[selectedModel],
          temperature: selectedModel === 'pro' ? 0.2 : 0.7,
          thinkingConfig: selectedModel === 'pro' ? { thinkingBudget: 4000 } : undefined
        }
      });

      let resText = "";
      let resImg = undefined;
      response.candidates?.[0]?.content?.parts.forEach(p => {
        if (p.text) resText += p.text;
        if (p.inlineData) resImg = `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`;
      });

      setMessages(prev => [...prev, { id: Date.now().toString(), role: Role.MODEL, text: resText || "Команда выполнена успешно.", imageUrl: resImg, timestamp: new Date() }]);
    } catch (err) {
      console.error("Neural Error:", err);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: Role.MODEL, text: "Внимание! Нейронный узел не ответил. Пожалуйста, убедитесь, что API ключ активен и повторите ввод.", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <header className="px-8 py-5 border-b border-white/5 bg-black/60 flex items-center justify-between shrink-0 z-10 backdrop-blur-md">
        <div className="flex items-center space-x-5">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/20">N</div>
          <div>
            <h1 className="text-xl font-black tracking-tighter">NikiViti <span className="text-emerald-400 font-extrabold">Solaris</span></h1>
            <div className="flex items-center space-x-2 opacity-50">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Quantum Node Connected</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Chat */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-10 md:px-24 bg-transparent">
        <div className="max-w-4xl mx-auto">
          {messages.map(m => <ChatMessage key={m.id} msg={m} />)}
          {isLoading && <TypingIndicator />}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 md:p-10 bg-black/80 border-t border-white/5 shrink-0 backdrop-blur-3xl z-10">
        <div className="max-w-4xl mx-auto">
          {/* Mode Selector */}
          <div className="flex gap-3 mb-8">
            {MODELS.map(m => (
              <button 
                key={m.id} 
                onClick={() => setSelectedModel(m.id)} 
                className={`flex-1 py-3 px-4 rounded-xl border text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${
                  selectedModel === m.id 
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)] scale-[1.03]' 
                  : 'border-white/5 text-white/20 hover:text-white/40 hover:bg-white/5'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSend} className="flex gap-4 items-center">
            <button 
              type="button" 
              onClick={() => document.getElementById('asset-file')?.click()} 
              className="p-5 rounded-2xl bg-white/5 border border-white/10 text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all active:scale-90"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
              <input type="file" id="asset-file" hidden onChange={e => {
                const file = e.target.files?.[0];
                if(file) {
                  const reader = new FileReader();
                  reader.onload = () => setImage(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
            </button>
            
            <div className="flex-1 relative">
              {image && (
                <div className="absolute -top-28 left-0 glass-panel p-2.5 rounded-2xl border border-emerald-500/30 flex gap-4 items-center animate-message shadow-2xl">
                  <img src={image} className="w-16 h-16 rounded-xl object-cover" />
                  <button onClick={() => setImage(null)} className="text-rose-400 hover:text-rose-300 p-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
              )}
              <input 
                type="text" 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                placeholder={selectedModel === 'eco' ? "Describe vision..." : "Enter command..."} 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all text-white font-medium shadow-inner" 
                disabled={isLoading}
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading || (!input.trim() && !image)} 
              className={`p-5 rounded-2xl transition-all flex items-center justify-center min-w-[68px] ${
                isLoading || (!input.trim() && !image)
                ? 'bg-white/5 text-white/10' 
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl hover:scale-105 active:scale-95 shadow-emerald-500/30'
              }`}
            >
              {isLoading ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
            </button>
          </form>
          
          <div className="mt-8 flex justify-between items-center opacity-10 text-[8px] font-black uppercase tracking-[0.5em] select-none">
            <span>Solaris 2.3 System Node</span>
            <div className="flex gap-2"><div className="w-1 h-1 bg-white rounded-full"></div><div className="w-1 h-1 bg-white rounded-full"></div></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Mount
const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<App />);
}
