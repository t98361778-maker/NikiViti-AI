
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Role, ChatState, ModelId, ModelInfo } from './types';
import { sendMessageToGemini } from './services/geminiService';
import { ChatMessage } from './components/ChatMessage';
import { TypingIndicator } from './components/TypingIndicator';

const MODELS: ModelInfo[] = [
  {
    id: 'standard',
    name: 'NikiViti',
    description: 'Быстрое общение и поиск ответов',
    features: ['Моментальный отклик', 'Общая эрудиция'],
    geminiModel: 'gemini-3-flash-preview'
  },
  {
    id: 'pro',
    name: 'NikiViti 2.0',
    description: 'Эксперт в коде и аналитике',
    features: ['Deep Coding', 'Сложная логика'],
    geminiModel: 'gemini-3-pro-preview'
  },
  {
    id: 'eco',
    name: 'NikiViti Art',
    description: 'Визуальное воображение',
    features: ['Генерация дизайна', 'Art-промпты'],
    geminiModel: 'gemini-2.5-flash-image'
  }
];

const App: React.FC = () => {
  const [state, setState] = useState<ChatState>({
    messages: [
      {
        id: 'init',
        role: Role.MODEL,
        text: 'Система NikiViti Solaris Spectrum v2.0 активна. Все модули памяти включены. Я запоминаю каждое ваше слово для максимально точного контекста. Чем могу помочь?',
        timestamp: new Date(),
      },
    ],
    isLoading: false,
    error: null,
    selectedModel: 'pro', // Default to 2.0 for coding focus
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
      text: input || (selectedImage ? "[Визуальный запрос]" : ""),
      inputImageUrl: selectedImage || undefined,
      timestamp: new Date(),
    };

    const currentInput = input;
    const currentImg = selectedImage;
    const currentModel = state.selectedModel;
    const historySnapshot = [...state.messages];

    setInput('');
    setSelectedImage(null);
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      // Memory is handled by passing historySnapshot
      const result = await sendMessageToGemini(historySnapshot, currentInput, currentModel, currentImg || undefined);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: result.text,
        imageUrl: result.imageUrl,
        timestamp: new Date(),
      };

      setState(prev => ({ ...prev, messages: [...prev.messages, aiMessage], isLoading: false }));
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false, error: err instanceof Error ? err.message : 'Ошибка связи с ядром Solaris.' }));
    }
  }, [input, selectedImage, state.messages, state.isLoading, state.selectedModel]);

  const getModelColor = (id: ModelId) => {
    switch(id) {
      case 'pro': return 'from-teal-400 to-emerald-600';
      case 'eco': return 'from-cyan-400 to-blue-500';
      default: return 'from-emerald-500 to-green-600';
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* OS Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-black/40 z-10 shrink-0">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${getModelColor(state.selectedModel)} rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/10 transition-all duration-500`}>
            {state.selectedModel === 'pro' ? '2.0' : state.selectedModel === 'eco' ? 'A' : 'N'}
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter leading-tight flex items-center gap-2">
              NikiViti <span className="text-teal-400">Solaris</span>
            </h1>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse shadow-[0_0_5px_#14b8a6]"></span>
              <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">Spectrum Interface Core</span>
            </div>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-6">
           <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Processing Unit</span>
              <span className="text-[10px] font-bold text-teal-500/80">{MODELS.find(m => m.id === state.selectedModel)?.name}</span>
           </div>
        </div>
      </header>

      {/* Neural Link Area */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 md:px-16 md:py-10">
        <div className="max-w-4xl mx-auto space-y-4">
          {state.messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} modelId={msg.role === Role.MODEL ? state.selectedModel : undefined} />
          ))}
          {state.isLoading && <TypingIndicator isEco={state.selectedModel === 'eco'} />}
          {state.error && (
            <div className="flex justify-center p-6">
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-10 py-4 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl backdrop-blur-md">
                {state.error}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Neural Input Interface */}
      <footer className="bg-black/60 border-t border-white/5 p-4 md:p-8 shrink-0 relative backdrop-blur-xl">
        <div className="max-w-4xl mx-auto">
            {/* Model Toggle Switches */}
            <div className="flex items-center gap-3 mb-6">
                {MODELS.map((model) => (
                    <button
                        key={model.id}
                        onClick={() => setState(prev => ({ ...prev, selectedModel: model.id }))}
                        className={`flex-1 py-3 px-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative overflow-hidden group ${
                            state.selectedModel === model.id
                            ? 'bg-teal-500/10 border-teal-500/40 text-teal-300 shadow-teal-500/10 shadow-lg translate-y-[-2px]'
                            : 'bg-transparent border-white/5 text-white/20 hover:text-white/50 hover:bg-white/5'
                        }`}
                    >
                        <div className={`absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r ${getModelColor(model.id)} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                        {model.name}
                    </button>
                ))}
            </div>

            {/* Main Command Input */}
            <div className="relative">
                {selectedImage && (
                    <div className="absolute -top-32 left-0 bg-slate-900/95 backdrop-blur-3xl border border-teal-500/30 p-2.5 rounded-2xl flex items-center gap-4 shadow-2xl z-20 animate-message">
                        <img src={selectedImage} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-white/10" />
                        <button onClick={() => setSelectedImage(null)} className="p-3 text-rose-400 hover:text-rose-200 hover:bg-rose-500/10 rounded-full transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-4.5 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-teal-400 hover:bg-teal-500/10 hover:border-teal-500/30 transition-all duration-300 active:scale-90 shadow-sm"
                        title="Link Visual Asset"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={state.isLoading}
                        placeholder={state.selectedModel === 'eco' ? "Describe the vision..." : "Input command to Solaris..."}
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4.5 px-8 outline-none text-white focus:border-teal-500/50 focus:bg-white/10 transition-all duration-500 placeholder-white/5 font-medium shadow-inner"
                    />
                    <button
                        type="submit"
                        disabled={(!input.trim() && !selectedImage) || state.isLoading}
                        className={`p-4.5 rounded-2xl transition-all duration-500 flex items-center justify-center min-w-[64px] ${
                            (!input.trim() && !selectedImage) || state.isLoading
                            ? 'bg-white/5 text-white/10 cursor-not-allowed opacity-50'
                            : `bg-gradient-to-r ${getModelColor(state.selectedModel)} text-white shadow-[0_0_20px_rgba(20,184,166,0.2)] hover:scale-105 active:scale-95`
                        }`}
                    >
                        {state.isLoading ? (
                            <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        )}
                    </button>
                </form>
            </div>
            <div className="flex justify-between items-center mt-8 px-1">
                <p className="text-[9px] text-white/10 font-black uppercase tracking-[0.6em] select-none">
                    Solaris Node Interface • v2.0.4
                </p>
                <div className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-20"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 opacity-20"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 opacity-20"></div>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
