'use client';

import React from 'react';
import { Library, ArrowDown, Mic } from 'lucide-react';

interface FloatingMobileActionsProps {
  onToggleSources: () => void;
  onScrollToBottom?: () => void;
  onStartVoiceChat?: () => void;
}

export function FloatingMobileActions({
  onToggleSources,
  onScrollToBottom,
  onStartVoiceChat,
}: FloatingMobileActionsProps) {
  return (
    <div className="fixed right-4 bottom-28 z-40 flex flex-col gap-2.5 xl:hidden select-none">
      {/* Start Voice Chat FAB */}
      <button
        onClick={onStartVoiceChat}
        className="w-11 h-11 rounded-2xl shadow-md bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:text-brand hover:border-brand-light transition-all active:scale-95 cursor-pointer"
        type="button"
        title="Start voice chat"
      >
        <Mic className="w-4.5 h-4.5" />
      </button>

      {/* Scroll to Bottom FAB */}
      {onScrollToBottom && (
        <button
          onClick={onScrollToBottom}
          className="w-11 h-11 rounded-2xl shadow-md bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:text-brand hover:border-brand-light transition-all active:scale-95 cursor-pointer"
          type="button"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4.5 h-4.5" />
        </button>
      )}

      {/* View Sources FAB */}
      <button
        onClick={onToggleSources}
        className="w-11 h-11 rounded-2xl shadow-md bg-brand text-white flex items-center justify-center hover:bg-brand-mid transition-all active:scale-95 cursor-pointer"
        type="button"
        title="View sources"
      >
        <Library className="w-4.5 h-4.5" />
      </button>
    </div>
  );
}
