
import React from 'react';

interface TypingIndicatorProps {
  isEco?: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isEco }) => {
  return (
    <div className="flex justify-start mb-10 animate-slideUp">
      <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-[2rem] rounded-tl-none flex flex-col items-start gap-2">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-duration:0.6s]"></div>
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.1s]"></div>
          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]"></div>
        </div>
        {isEco && (
          <span className="text-[10px] font-black text-pink-400 uppercase tracking-[0.3em] animate-pulse">
            Синтез визуального ряда...
          </span>
        )}
      </div>
    </div>
  );
};
