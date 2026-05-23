'use client';

import React from 'react';
import { Search, Trash2, Library, MoreHorizontal, Menu } from 'lucide-react';

interface ChatHeaderProps {
  topic?: string;
  docCount?: number;
  onClearChat?: () => void;
  onToggleSources?: () => void;
  onToggleMobileMenu?: () => void;
}

export function ChatHeader({
  topic = 'Physics — Wave Mechanics',
  docCount = 4,
  onClearChat,
  onToggleSources,
  onToggleMobileMenu,
}: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-6 py-4 flex items-center justify-between">
      {/* Left side info */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={onToggleMobileMenu}
          className="w-10 h-10 rounded-xl border border-gray-200 flex lg:hidden items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer mr-1"
          type="button"
          title="Open menu"
        >
          <Menu className="w-4.5 h-4.5 text-gray-500" />
        </button>

        <div className="flex flex-col">
          <h2 className="text-lg md:text-xl font-extrabold text-ink leading-tight sentence-case">
            {topic}
          </h2>
          <span className="text-xs text-gray-500 mt-0.5 sentence-case select-none">
            Using {docCount} uploaded documents
          </span>
        </div>
      </div>

      {/* Right side action buttons */}
      <div className="flex items-center gap-2 select-none">
        {/* Search inside chat */}
        <button
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
          type="button"
          title="Search chat"
        >
          <Search className="w-4 h-4 text-gray-500" />
        </button>

        {/* Clear chat logs */}
        <button
          onClick={onClearChat}
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:text-red-500 hover:border-red-100 transition-colors cursor-pointer"
          type="button"
          title="Clear chat"
        >
          <Trash2 className="w-4 h-4 text-gray-500 hover:text-inherit" />
        </button>

        {/* Toggle sources drawer */}
        <button
          onClick={onToggleSources}
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:text-brand hover:border-brand-light transition-colors cursor-pointer"
          type="button"
          title="View sources"
        >
          <Library className="w-4 h-4 text-gray-500 hover:text-inherit" />
        </button>

        {/* More Options menu */}
        <button
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
          type="button"
          title="More actions"
        >
          <MoreHorizontal className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </header>
  );
}
