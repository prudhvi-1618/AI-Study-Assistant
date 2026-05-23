'use client';

import React from 'react';
import { Smile, Meh, Frown } from 'lucide-react';

interface DifficultyButtonsProps {
  onRate: (difficulty: 'easy' | 'medium' | 'hard') => void;
  visible: boolean;
}

export function DifficultyButtons({ onRate, visible }: DifficultyButtonsProps) {
  if (!visible) return null;

  return (
    <div className="flex items-center justify-center gap-3 mt-5 flex-wrap select-none animate-fadeInUp">
      {/* Easy Button */}
      <button
        onClick={() => onRate('easy')}
        className="rounded-2xl px-6 py-3 font-bold text-sm bg-mint-light text-mint-dark hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-mint/5"
        type="button"
        title="Mark as Easy (Press 1)"
      >
        <Smile className="w-4.5 h-4.5" />
        <span className="sentence-case">Easy</span>
      </button>

      {/* Medium Button */}
      <button
        onClick={() => onRate('medium')}
        className="rounded-2xl px-6 py-3 font-bold text-sm bg-cream-light text-cream-dark hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-cream/5"
        type="button"
        title="Mark as Medium (Press 2)"
      >
        <Meh className="w-4.5 h-4.5" />
        <span className="sentence-case">Medium</span>
      </button>

      {/* Hard Button */}
      <button
        onClick={() => onRate('hard')}
        className="rounded-2xl px-6 py-3 font-bold text-sm bg-blush-light text-blush-dark hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-blush/5"
        type="button"
        title="Mark as Hard (Press 3)"
      >
        <Frown className="w-4.5 h-4.5" />
        <span className="sentence-case">Hard</span>
      </button>
    </div>
  );
}
