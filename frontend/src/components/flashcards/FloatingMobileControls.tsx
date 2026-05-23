'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Eye, Smile, Meh, Frown } from 'lucide-react';

interface FloatingMobileControlsProps {
  onPrev: () => void;
  onNext: () => void;
  onFlip: () => void;
  isFlipped: boolean;
  onRate: (difficulty: 'easy' | 'medium' | 'hard') => void;
  showDifficulty: boolean;
}

export function FloatingMobileControls({
  onPrev,
  onNext,
  onFlip,
  isFlipped,
  onRate,
  showDifficulty,
}: FloatingMobileControlsProps) {
  return (
    <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3 w-[calc(100%-2rem)] max-w-sm px-4">
      {/* Mobile Rating Bar (Floating above navigation capsule when flipped) */}
      {showDifficulty && (
        <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl border border-gray-100 shadow-lg p-2.5 flex items-center justify-around gap-2 animate-fadeInUp">
          {/* Easy Pill */}
          <button
            onClick={() => onRate('easy')}
            className="flex-1 bg-mint-light hover:bg-mint-light/80 active:scale-95 text-mint-dark rounded-xl py-2 px-1 flex items-center justify-center gap-1 font-bold text-xs transition-all cursor-pointer"
            type="button"
          >
            <Smile className="w-3.5 h-3.5" />
            <span className="sentence-case">Easy</span>
          </button>

          {/* Medium Pill */}
          <button
            onClick={() => onRate('medium')}
            className="flex-1 bg-cream-light hover:bg-cream-light/80 active:scale-95 text-cream-dark rounded-xl py-2 px-1 flex items-center justify-center gap-1 font-bold text-xs transition-all cursor-pointer"
            type="button"
          >
            <Meh className="w-3.5 h-3.5" />
            <span className="sentence-case">Medium</span>
          </button>

          {/* Hard Pill */}
          <button
            onClick={() => onRate('hard')}
            className="flex-1 bg-blush-light hover:bg-blush-light/80 active:scale-95 text-blush-dark rounded-xl py-2 px-1 flex items-center justify-center gap-1 font-bold text-xs transition-all cursor-pointer"
            type="button"
          >
            <Frown className="w-3.5 h-3.5" />
            <span className="sentence-case">Hard</span>
          </button>
        </div>
      )}

      {/* Floating Navigation Pill */}
      <div className="w-full bg-ink/95 backdrop-blur-md rounded-full shadow-2xl border border-white/10 px-3 py-2 flex items-center justify-between gap-2 text-white">
        {/* Previous */}
        <button
          onClick={onPrev}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all text-white/80 hover:text-white cursor-pointer"
          type="button"
          aria-label="Previous card"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Flip Card / Reveal */}
        <button
          onClick={onFlip}
          className="flex-1 py-2 px-4 rounded-full bg-brand hover:bg-brand-mid active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
          type="button"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="sentence-case">
            {isFlipped ? 'Show question' : 'Reveal answer'}
          </span>
        </button>

        {/* Next */}
        <button
          onClick={onNext}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all text-white/80 hover:text-white cursor-pointer"
          type="button"
          aria-label="Next card"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
