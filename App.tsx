
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Role, ChatState, ModelId, ModelInfo } from './types';
import { sendMessageToGemini } from './services/geminiService';
import { ChatMessage } from './components/ChatMessage';
import { TypingIndicator } from './components/TypingIndicator';

const MODELS: ModelInfo[] = [
  {
    id: 'standard',
    name: 'NikiViti Standard',
    description: 'Интеллект',
    features: ['Глубокий анализ'],
    geminiModel: 'gemini-3-pro-preview'
  },
  {
    id: 'pro',
    name: 'NikiViti Pro',
    description: 'Турбо-Разум',
    features: ['Мгновенный ответ'],
    geminiModel: 'gemini-3-flash-preview'
  },
  {
    id: 'eco',
    name: 'NikiViti Art',
    description: 'Визуальный синтез',
    features: ['Генерация дизайна'],
    geminiModel: 'gemini-2.5-flash-image'
  }
];

const App: React.FC = () => {
  const [state, setState] = useState<ChatState>({
    messages: [
      {
        id: '1',
        role: Role.MODEL,
        text: 'Система NikiViti Solaris Spectrum активирована. Ожидаю входные данные для анализа и генерации. Баг GitHub исправлен.',
        timestamp: new Date(),
      },
    ],
    isLoading: false,
    error: null,
    selectedModel: 'standard',
  });

  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [state.messages, state.isLoading]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || state.isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: input || (selectedImage ? "[Анализ изображения]" : ""),
      inputImageUrl: selectedImage || undefined,
      timestamp: new Date(),
    };

    const currentInput = input;
    const currentImg = selectedImage;
    const currentModel = state.selectedModel;

    setInput('');
    setSelectedImage(null);
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const result = await sendMessageToGemini(state.messages, currentInput, currentModel, currentImg || undefined);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: result.text,
        imageUrl: result.imageUrl,
        timestamp: new Date(),
      };

      setState(prev => ({ ...prev, messages: [...prev.messages, aiMessage], isLoading: false }));
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false, error: err instanceof Error ? err.message : 'Ошибка связи со Spectrum.' }));
    }
  }, [input, selectedImage, state.messages, state.isLoading, state.selectedModel]);

  const getModelColor = (id: ModelId) => {
    switch(id) {
      case 'pro': return 'from-teal-400 to-emerald-600 shadow-teal-500/20';
      case 'eco': return 'from-cyan-400 to-blue-500 shadow-cyan-500/20';
      default: return 'from-emerald-500 to-green-600 shadow-emerald-500/20';
    }
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-7xl glass-chromatic md:rounded-[2.5rem] overflow-hidden shadow-2xl transition-all">
      {/* Solaris Header */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-white/5 relative z-10 bg-black/20">
        <div className="flex items-center space-x-5">
          <div className={`w-14 h-14 bg-gradient-to-br ${getModelColor(state.selectedModel)} rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg transition-all duration-700`}>
            {state.selectedModel === 'standard' ? 'S' : state.selectedModel === 'pro' ? 'P' : 'A'}
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter">NikiViti <span className="bg-gradient-to-r from-teal-300 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">Solaris</span></h1>
            <div className="flex items-center space-x-2 mt-0.5 opacity-30">
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">Quantum Node Connected</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse [animation-delay:0.2s]"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse [animation-delay:0.4s]"></div>
        </div>
      </header>

      {/* Maximized Chat History */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10">
        <div className="max-w-4xl mx-auto">
          {state.messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} modelId={msg.role === Role.MODEL ? state.selectedModel : undefined} />
          ))}
          {state.isLoading && <TypingIndicator isEco={state.selectedModel === 'eco'} />}
          {state.error && (
            <div className="flex justify-center p-8 animate-slideUp">
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-8 py-4 rounded-3xl text-xs font-black uppercase tracking-widest shadow-xl">
                {state.error}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Compact Model Controls */}
      <div className="px-8 py-3 border-t border-white/5 bg-black/40">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
            {MODELS.map((model) => (
                <button
                key={model.id}
                onClick={() => setState(prev => ({ ...prev, selectedModel: model.id }))}
                className={`flex-1 group flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-500 ${
                    state.selectedModel === model.id
                    ? `bg-white/5 border-teal-500/30 shadow-md scale-105`
                    : 'border-transparent opacity-30 hover:opacity-60'
                }`}
                >
                <div className={`w-1 h-1 rounded-full mb-1.5 bg-gradient-to-r ${getModelColor(model.id)}`}></div>
                <div className={`text-[8px] font-black uppercase tracking-widest ${state.selectedModel === model.id ? 'text-teal-300' : 'text-white/40'}`}>
                    {model.name}
                </div>
                </button>
            ))}
        </div>
      </div>

      {/* Futuristic Input */}
      <footer className="p-8 md:p-10 bg-black/60 border-t border-white/5">
        <div className="max-w-4xl mx-auto relative">
            {selectedImage && (
              <div className="absolute -top-28 left-0 bg-slate-900/95 backdrop-blur-3xl p-2 rounded-2xl border border-teal-500/30 flex items-center gap-3 animate-slideUp shadow-2xl z-20">
                <img src={selectedImage} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-white/5" />
                <button onClick={() => setSelectedImage(null)} className="p-2.5 bg-rose-500/10 text-rose-400 rounded-full hover:bg-rose-500 hover:text-white transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="relative flex items-center gap-4 group">
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/30 hover:bg-teal-500/20 hover:text-teal-400 hover:border-teal-500/30 transition-all active:scale-90"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                </button>
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={state.isLoading}
                        placeholder={state.selectedModel === 'eco' ? "Опишите арт..." : "Ваш запрос для NikiViti..."}
                        className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 px-7 focus:ring-1 focus:ring-teal-500/30 focus:bg-white/10 transition-all outline-none text-white font-medium placeholder-white/5"
                    />
                </div>
                <button
                    type="submit"
                    disabled={(!input.trim() && !selectedImage) || state.isLoading}
                    className={`p-4 rounded-2xl transition-all shadow-xl ${
                    (!input.trim() && !selectedImage) || state.isLoading
                        ? 'text-white/10 bg-white/5'
                        : `text-white bg-gradient-to-r ${getModelColor(state.selectedModel)} hover:scale-105 active:scale-95`
                    }`}
                >
                    {state.isLoading ? (
                        <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14M12 5l7 7-7 7" /></svg>
                    )}
                </button>
            </form>
            <p className="text-center text-[9px] text-white/10 font-black uppercase tracking-[0.4em] mt-8">
                Solaris v26.4 • Unified Node System
            </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
