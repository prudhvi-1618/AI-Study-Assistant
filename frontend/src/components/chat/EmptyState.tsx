'use client';

import React from 'react';
import { Brain } from 'lucide-react';
import { SuggestedPrompts } from './SuggestedPrompts';

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

export function EmptyState({ onSelectPrompt }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 select-none text-center">
      {/* AI Orb Logo */}
      <div className="w-20 h-20 rounded-3xl bg-brand-light flex items-center justify-center mx-auto mb-6 shadow-sm border border-brand-light animate-pulse">
        <Brain className="w-10 h-10 text-brand" />
      </div>

      {/* Heading */}
      <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-ink max-w-2xl mx-auto leading-tight sentence-case">
        Ask anything from your study materials
      </h1>

      {/* Subtext */}
      <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto mt-3 sentence-case px-4 leading-relaxed">
        Upload notes, PDFs, and lectures — then chat with them using AI.
      </p>

      {/* Suggested Prompts list */}
      <SuggestedPrompts onSelectPrompt={onSelectPrompt} />
    </div>
  );
}
