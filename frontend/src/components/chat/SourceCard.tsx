'use client';

import React from 'react';
import { FileText, ArrowRight } from 'lucide-react';
import { Source } from '@/lib/stream';

interface SourceCardProps {
  source: Source;
}

export function SourceCard({ source }: SourceCardProps) {
  return (
    <div className="border border-gray-100 rounded-2xl p-4 hover:border-brand hover:shadow-sm transition-all cursor-pointer bg-white select-none group">
      {/* Top Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-brand shrink-0" />
          <span className="text-xs font-bold text-ink truncate sentence-case" title={source.title}>
            {source.title}
          </span>
        </div>
        
        {/* Relevance Badge */}
        <span className="bg-brand-light text-brand-dark rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0">
          {source.relevance}% match
        </span>
      </div>

      {/* Excerpt */}
      <p className="text-xs text-gray-600 leading-relaxed mt-3 break-words line-clamp-3">
        "{source.excerpt}"
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <span className="text-[10px] font-semibold text-gray-400 sentence-case">
          Page {source.page}
        </span>
        <span className="text-[10px] font-bold text-brand group-hover:text-brand-mid transition-colors flex items-center gap-0.5">
          <span>Open source</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </div>
  );
}
