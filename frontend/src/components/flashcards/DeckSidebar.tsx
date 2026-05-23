'use client';

import React from 'react';
import Link from 'next/link';
import { Brain, Plus, ArrowLeft } from 'lucide-react';
import { DeckList } from './DeckList';
import { Deck } from '@/lib/flashcards/data';

interface DeckSidebarProps {
  decks: Deck[];
  activeDeckId: string;
  onSelectDeck: (id: string) => void;
  onGenerateDeck?: () => void;
}

export function DeckSidebar({
  decks,
  activeDeckId,
  onSelectDeck,
  onGenerateDeck,
}: DeckSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-ink text-white hidden lg:flex flex-col border-r border-white/10 z-40">
      {/* Logo Row */}
      <div className="flex items-center justify-between p-5 mt-2">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-extrabold text-lg ml-2.5 tracking-tight">
            StudyAI
          </span>
        </div>
        <Link
          href="/dashboard"
          className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-xl"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      {/* Action Buttons */}
      <div className="px-5 mt-4">
        <button
          onClick={onGenerateDeck}
          className="w-full bg-brand hover:bg-brand-mid active:scale-95 text-white rounded-2xl px-4 py-3 flex items-center justify-center gap-2 font-semibold text-sm transition-all"
          type="button"
        >
          <Plus className="w-4 h-4" />
          <span className="sentence-case">Generate flashcards</span>
        </button>
      </div>

      {/* Decks List */}
      <DeckList
        decks={decks}
        activeDeckId={activeDeckId}
        onSelectDeck={onSelectDeck}
      />

      {/* User Footer Profile */}
      <div className="mt-auto border-t border-white/10 p-4 flex items-center gap-2.5 mx-3 mb-4 pt-4">
        <div className="w-8 h-8 rounded-full bg-brand-light text-brand-dark flex items-center justify-center font-extrabold text-xs shrink-0 select-none">
          RS
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-white truncate block">
            Riya Sharma
          </span>
          <span className="text-[10px] text-gray-400 truncate block">
            riya@student.edu
          </span>
        </div>
      </div>
    </aside>
  );
}
