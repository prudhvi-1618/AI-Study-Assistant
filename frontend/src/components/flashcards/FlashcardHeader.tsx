'use client';

import React from 'react';
import { Shuffle, Filter, Maximize, MoreVertical, Menu } from 'lucide-react';

interface FlashcardHeaderProps {
  deckTitle: string;
  cardsCount: number;
  isShuffled: boolean;
  onShuffle: () => void;
  onToggleFullscreen: () => void;
  onToggleMobileMenu: () => void;
}

export function FlashcardHeader({
  deckTitle,
  cardsCount,
  isShuffled,
  onShuffle,
  onToggleFullscreen,
  onToggleMobileMenu,
}: FlashcardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-6 py-4 flex items-center justify-between">
      {/* Left side: title and deck details */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 -ml-1 rounded-xl text-gray-500 hover:text-ink hover:bg-gray-100 transition-colors"
          type="button"
          aria-label="Open decks menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="text-lg font-extrabold text-ink tracking-tight sentence-case">
            {deckTitle}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 sentence-case font-medium">
            {cardsCount} AI-generated flashcards
          </p>
        </div>
      </div>

      {/* Right side: quick actions */}
      <div className="flex items-center gap-2">
        {/* Shuffle action */}
        <button
          onClick={onShuffle}
          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
            isShuffled
              ? 'bg-brand/10 border-brand/20 text-brand'
              : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-ink'
          }`}
          type="button"
          title={isShuffled ? 'Disable Shuffle' : 'Shuffle Cards'}
        >
          <Shuffle className="w-4.5 h-4.5" />
        </button>

        {/* Filter (just cosmetic for now, or hooks to topic tabs) */}
        <button
          className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 text-gray-600 hover:text-ink transition-colors"
          type="button"
          title="Filter cards"
        >
          <Filter className="w-4.5 h-4.5" />
        </button>

        {/* Fullscreen focus trigger */}
        <button
          onClick={onToggleFullscreen}
          className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 text-gray-600 hover:text-ink transition-colors"
          type="button"
          title="Fullscreen focus mode"
        >
          <Maximize className="w-4.5 h-4.5" />
        </button>

        {/* More options menu */}
        <button
          className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 text-gray-600 hover:text-ink transition-colors"
          type="button"
          title="More options"
        >
          <MoreVertical className="w-4.5 h-4.5" />
        </button>
      </div>
    </header>
  );
}
