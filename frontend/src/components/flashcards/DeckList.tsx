'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import { Deck } from '@/lib/flashcards/data';

interface DeckListProps {
  decks: Deck[];
  activeDeckId: string;
  onSelectDeck: (id: string) => void;
}

export function DeckList({ decks, activeDeckId, onSelectDeck }: DeckListProps) {
  return (
    <div className="flex flex-col gap-1.5 overflow-y-auto px-2 lg:px-3 pb-6 flex-1">
      <h3 className="text-xs uppercase tracking-wide text-gray-500 mt-8 mb-3 px-3 font-bold select-none">
        Study decks
      </h3>

      <div className="flex flex-col gap-1.5">
        {decks.map((deck) => {
          const isActive = deck.id === activeDeckId;
          const percentage = deck.cards > 0 ? Math.round((deck.mastered / deck.cards) * 100) : 0;

          return (
            <div
              key={deck.id}
              onClick={() => onSelectDeck(deck.id)}
              className={`mx-3 rounded-2xl p-3 cursor-pointer transition-all ${
                isActive
                  ? 'bg-brand text-white shadow-lg shadow-brand/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Colored Icon Square */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : deck.color
                  }`}
                >
                  <Layers className="w-5 h-5" />
                </div>

                {/* Deck Info */}
                <div className="flex-1 min-w-0">
                  <h4
                    className={`text-sm font-bold truncate sentence-case ${
                      isActive ? 'text-white' : 'text-white/90'
                    }`}
                  >
                    {deck.title}
                  </h4>
                  <div className="flex justify-between items-center mt-1 text-[10px] font-semibold text-white/60">
                    <span className="sentence-case">{deck.cards} cards</span>
                    <span className="sentence-case">{percentage}% mastered</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isActive ? 'bg-white' : 'bg-brand'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
