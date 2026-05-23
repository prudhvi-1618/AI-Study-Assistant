'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Eye } from 'lucide-react';

interface StudyControlsProps {
  onPrev: () => void;
  onNext: () => void;
  onFlip: () => void;
  isFlipped: boolean;
  onShuffle: () => void;
  isShuffled: boolean;
}

export function StudyControls({
  onPrev,
  onNext,
  onFlip,
  isFlipped,
  onShuffle,
  isShuffled,
}: StudyControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3 mt-6 flex-wrap select-none">
      

      {/* Navigation and Flip Capsule */}
      {/* <div className="flex items-center gap-2">
        {/* Previous Card 
        <button
          onClick={onPrev}
          className="w-12 h-12 rounded-2xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 text-gray-600 hover:text-ink active:scale-95 transition-all cursor-pointer"
          type="button"
          title="Previous card (Left Arrow)"
          aria-label="Previous card"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Reveal Answer / Flip Card 
        <button
          onClick={onFlip}
          className="px-6 py-3 rounded-2xl bg-ink text-white hover:bg-ink/90 font-bold text-sm flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer min-w-[150px] justify-center"
          type="button"
          title="Flip card (Spacebar)"
        >
          <Eye className="w-4 h-4" />
          <span className="sentence-case">
            {isFlipped ? 'Show question' : 'Reveal answer'}
          </span>
        </button>

        {/* Next Card 
        <button
          onClick={onNext}
          className="w-12 h-12 rounded-2xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 text-gray-600 hover:text-ink active:scale-95 transition-all cursor-pointer"
          type="button"
          title="Next card (Right Arrow)"
          aria-label="Next card"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div> */}
    </div>
  );
}
