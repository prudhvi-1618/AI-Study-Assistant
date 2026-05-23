'use client';

import React from 'react';
import { Brain } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 select-none">
      {/* AI Avatar */}
      <div className="w-10 h-10 rounded-2xl bg-brand-light flex items-center justify-center shrink-0 border border-brand-light">
        <Brain className="w-5.5 h-5.5 text-brand" />
      </div>

      {/* Typing Bubble */}
      <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3.5 flex items-center gap-1.5 w-fit shadow-sm">
        <span className="w-2.5 h-2.5 bg-brand/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2.5 h-2.5 bg-brand/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2.5 h-2.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
