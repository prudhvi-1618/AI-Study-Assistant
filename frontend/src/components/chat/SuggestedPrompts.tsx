'use client';

import React from 'react';
import { Sparkles, ArrowUpRight } from 'lucide-react';

interface SuggestedPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

const prompts = [
  'Summarize chapter 3 in simple terms',
  'Generate 10 MCQs from this document',
  'Explain this concept like I’m a beginner',
  'What are the important exam topics?',
];

export function SuggestedPrompts({ onSelectPrompt }: SuggestedPromptsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 max-w-2xl mx-auto w-full px-4 select-none">
      {prompts.map((prompt) => (
        <div
          key={prompt}
          onClick={() => onSelectPrompt(prompt)}
          className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-brand hover:bg-brand-light/20 transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-light flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-brand" />
            </div>
            <span className="text-sm font-semibold text-gray-800 leading-snug sentence-case text-left">
              {prompt}
            </span>
          </div>

          <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-brand group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
        </div>
      ))}
    </div>
  );
}
