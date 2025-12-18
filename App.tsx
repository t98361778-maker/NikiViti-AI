
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Role, ChatState, ModelId, ModelInfo } from './types';
import { sendMessageToGemini } from './services/geminiService';
import { ChatMessage } from './components/ChatMessage';
import { TypingIndicator } from './components/TypingIndicator';

const MODELS: ModelInfo[] = [
  {
    id: 'standard',
    name: 'NikiViti',
    description: 'Базовая логика и общение',
    features: ['Быстрые ответы', 'Общая эрудиция'],
    geminiModel: 'gemini-3-flash-preview'
  },
  {
    id: 'pro',
    name: 'NikiViti 2.0',
    description: 'Экспертный кодинг и разум',
    features: ['Сложное программирование', 'Глубокий анализ'],
    geminiModel: 'gemini-3-pro-preview'
  },
  {
    id: 'eco',
    name: 'NikiViti Art',
    description: 'Визуальный синтез и дизайн',
    features: ['Генерация артов', 'Креативное описание'],
    geminiModel: 'gemini-2.5-flash-image'
  }
];

const App: React.FC = () => {
  const [state, setState] = useState<ChatState>({
    messages: [
      {
        id: 'init',
        role: Role.MODEL,
        text: 'Система NikiViti Solaris Spectrum v2.0 в сети. Я запоминаю контекст нашей беседы. Какой протокол активировать?',
        timestamp: new Date(),
      },
    ],
    isLoading: false,
    error: null,
    selectedModel: 'pro', // Default to 2.0 for best coding experience
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
      text: input || (selectedImage ? "[Система: Входящее изображение]" : ""),
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
      setState(prev => ({ ...prev, isLoading: false, error: err instanceof Error ? err.message : 'Ошибка ядра Solaris.' }));
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
    <div className="flex flex-col h-screen w-full glass-shell overflow-hidden shadow-2xl">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-black/40 z-10 shrink-0">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${getModelColor(state.selectedModel)} rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-teal-500/20 shadow-lg`}>
            {state.selectedModel === 'standard' ? 'N' : state.selectedModel === 'pro' ? '2.0' : 'A'}
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter leading-tight flex items-center gap-2">
              NikiViti <span className="text-teal-400 font-extrabold">Solaris</span>
            </h1>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Active Intelligence Node</span>
            </div>
          </div>
        </div>
        <div className="hidden md:flex gap-4 items-center">
            <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Status: Optimal</div>
        </div>
      </header>

      {/* Extended Chat Area */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 md:px-12 md:py-10">
        <div className="max-w-4xl mx-auto space-y-2">
          {state.messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} modelId={msg.role === Role.MODEL ? state.selectedModel : undefined} />
          ))}
          {state.isLoading && <TypingIndicator isEco={state.selectedModel === 'eco'} />}
          {state.error && (
            <div className="flex justify-center p-6 animate-message">
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                {state.error}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Dynamic Controls & Input */}
      <footer className="bg-black/60 border-t border-white/5 p-4 md:p-8 shrink-0 relative">
        <div className="max-w-4xl mx-auto">
            {/* Model Selection Tabs */}
            <div className="flex items-center gap-2 mb-6">
                {MODELS.map((model) => (
                    <button
                        key={model.id}
                        onClick={() => setState(prev => ({ ...prev, selectedModel: model.id }))}
                        className={`flex-1 py-2.5 px-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                            state.selectedModel === model.id
                            ? 'bg-teal-500/10 border-teal-500/40 text-teal-300 shadow-teal-500/10 shadow-lg translate-y-[-2px]'
                            : 'bg-transparent border-white/5 text-white/20 hover:text-white/50'
                        }`}
                    >
                        {model.name}
                    </button>
                ))}
            </div>

            {/* Input Bar */}
            <div className="relative group">
                {selectedImage && (
                    <div className="absolute -top-28 left-0 bg-slate-900/95 backdrop-blur-3xl border border-teal-500/30 p-2.5 rounded-2xl flex items-center gap-4 animate-message shadow-2xl z-20">
                        <img src={selectedImage} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-white/10" />
                        <button onClick={() => setSelectedImage(null)} className="p-2 text-rose-400 hover:text-rose-200 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-teal-400 hover:bg-teal-500/10 hover:border-teal-500/20 transition-all duration-300 active:scale-90 shadow-sm"
                        title="Прикрепить изображение"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={state.isLoading}
                        placeholder={state.selectedModel === 'eco' ? "Опишите визуальный шедевр..." : "Ваш запрос для NikiViti..."}
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4.5 px-8 outline-none text-white focus:border-teal-500/40 focus:bg-white/10 transition-all duration-300 placeholder-white/5 font-medium"
                    />
                    <button
                        type="submit"
                        disabled={(!input.trim() && !selectedImage) || state.isLoading}
                        className={`p-4.5 rounded-2xl transition-all duration-500 flex items-center justify-center ${
                            (!input.trim() && !selectedImage) || state.isLoading
                            ? 'bg-white/5 text-white/10 cursor-not-allowed'
                            : `bg-gradient-to-r ${getModelColor(state.selectedModel)} text-white shadow-xl hover:scale-105 active:scale-95`
                        }`}
                    >
                        {state.isLoading ? (
                            <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14M12 5l7 7-7 7" /></svg>
                        )}
                    </button>
                </form>
            </div>
            <p className="text-center text-[9px] text-white/10 font-black uppercase tracking-[0.6em] mt-8 select-none">
                Unified NikiViti Neural Interface • Core v2.0
            </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
