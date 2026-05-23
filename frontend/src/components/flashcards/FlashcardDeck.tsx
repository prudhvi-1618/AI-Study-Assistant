'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Eye } from 'lucide-react';

interface FlashcardDeckProps {
  children: React.ReactNode;
  onPrev: () => void;
  onNext: () => void;
  onFlip: () => void;
  isFlipped: boolean;
}

export function FlashcardDeck({ children, onPrev, onNext, onFlip, isFlipped }: FlashcardDeckProps) {
  return (
    <div className="relative flex-1 flex items-center justify-center gap-4">
      <button
        onClick={onPrev}
        className="w-12 h-12 rounded-2xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 text-gray-600 hover:text-ink active:scale-95 transition-all cursor-pointer"
        type="button"
        title="Previous card (Left Arrow)"
        aria-label="Previous card"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex-1">
        {children}
      </div>

      <button
        onClick={onNext}
        className="w-12 h-12 rounded-2xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 text-gray-600 hover:text-ink active:scale-95 transition-all cursor-pointer"
        type="button"
        title="Next card (Right Arrow)"
        aria-label="Next card"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
