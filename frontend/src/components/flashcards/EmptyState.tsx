'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, UploadCloud } from 'lucide-react';

interface EmptyStateProps {
  onGenerateDemo?: () => void;
}

export function EmptyState({ onGenerateDemo }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center max-w-md mx-auto bg-white rounded-[32px] border border-gray-100 shadow-sm mt-8 select-none">
      <div className="w-16 h-16 rounded-[24px] bg-brand-light flex items-center justify-center mb-6">
        <UploadCloud className="w-8 h-8 text-brand" />
      </div>

      <h3 className="text-xl font-extrabold text-ink tracking-tight mb-2 sentence-case">
        No flashcards found
      </h3>
      
      <p className="text-sm text-gray-500 mb-8 leading-relaxed sentence-case font-medium">
        Generate custom AI flashcards in seconds by uploading your lecture notes, PDFs, or slides to the upload center.
      </p>

      <div className="flex flex-col gap-3 w-full">
        <Link
          href="/documents"
          className="w-full bg-brand hover:bg-brand-mid active:scale-95 text-white rounded-2xl px-5 py-3.5 flex items-center justify-center gap-2 font-bold text-sm transition-all"
        >
          <UploadCloud className="w-4 h-4" />
          <span className="sentence-case">Go to upload center</span>
        </Link>

        {onGenerateDemo && (
          <button
            onClick={onGenerateDemo}
            className="w-full bg-white hover:bg-gray-50 border border-gray-200 active:scale-95 text-gray-700 rounded-2xl px-5 py-3.5 flex items-center justify-center gap-2 font-bold text-sm transition-all"
            type="button"
          >
            <Sparkles className="w-4 h-4 text-brand" />
            <span className="sentence-case">Try physics demo cards</span>
          </button>
        )}
      </div>
    </div>
  );
}
