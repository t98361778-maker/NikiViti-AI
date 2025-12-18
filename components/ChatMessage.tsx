
import React, { useState } from 'react';
import { Message, Role } from '../types';

interface ChatMessageProps {
  message: Message;
  modelId?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, modelId }) => {
  const isUser = message.role === Role.USER;
  const [isSpeaking, setIsSpeaking] = useState(false);

  const getTheme = () => {
    if (isUser) return 'bg-white/[0.04] border-white/10 text-white shadow-lg ml-auto';
    switch (modelId) {
      case 'pro': return 'bg-teal-500/10 border-teal-500/20 text-teal-50 shadow-teal-500/5';
      case 'eco': return 'bg-cyan-500/10 border-cyan-500/20 text-cyan-50 shadow-cyan-500/5';
      default: return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-50 shadow-emerald-500/5';
    }
  };

  const getAccent = () => {
    if (isUser) return 'text-white/20';
    switch (modelId) {
      case 'pro': return 'text-teal-400/40';
      case 'eco': return 'text-cyan-400/40';
      default: return 'text-emerald-400/40';
    }
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(message.text);
    utterance.lang = 'ru-RU';
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'} animate-message`}>
      <div
        className={`relative max-w-[90%] md:max-w-[80%] px-6 py-5 rounded-[1.8rem] transition-all border ${getTheme()} ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'}`}
      >
        {message.inputImageUrl && (
          <div className="mb-5 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
             <img src={message.inputImageUrl} alt="Input" className="w-full h-auto max-h-96 object-contain opacity-95 bg-black/40" />
          </div>
        )}

        {message.imageUrl && (
          <div className="mb-5 rounded-2xl overflow-hidden shadow-2xl border border-white/5 group bg-black/40 p-1">
            <img src={message.imageUrl} alt="Generated Art" className="w-full h-auto rounded-xl transition-transform duration-1000 group-hover:scale-[1.02]" />
          </div>
        )}
        
        <div className="flex items-start gap-5">
          <div className="flex-1 text-[15px] leading-[1.65] font-medium tracking-tight whitespace-pre-wrap selection:bg-teal-500/30">
            {message.text}
          </div>
          
          {!isUser && message.text && (
            <button 
              onClick={toggleSpeech}
              className={`flex-shrink-0 p-2.5 rounded-full transition-all duration-300 ${
                isSpeaking ? 'bg-white text-black scale-110 shadow-lg' : 'bg-white/5 text-white/20 hover:bg-white/10 hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
          )}
        </div>

        <div className={`text-[8px] mt-4 font-black tracking-[0.25em] uppercase flex items-center gap-2 ${getAccent()}`}>
           <span>{isUser ? 'CLIENT' : 'NIKIVITI CORE'}</span>
           <span className="opacity-40">•</span>
           <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
};
