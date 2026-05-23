'use client';

import React, { useEffect } from 'react';
import { Minimize2, Clock } from 'lucide-react';

interface FullscreenModeProps {
  children: React.ReactNode;
  deckTitle: string;
  timeSpentSeconds: number;
  onClose: () => void;
}

export function FullscreenMode({
  children,
  deckTitle,
  timeSpentSeconds,
  onClose,
}: FullscreenModeProps) {
  // Listen for escape key to close fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Format focus timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#0B0B0F] via-brand-dark to-[#0F0F13] text-white flex flex-col overflow-hidden">
      {/* Background glow filters for premium ambient aesthetics */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-brand/20 rounded-full filter blur-[100px] opacity-60 pointer-events-none select-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-mint/10 rounded-full filter blur-[100px] opacity-40 pointer-events-none select-none" />

      {/* Top Header Control Row */}
      <header className="w-full flex items-center justify-between px-6 py-4 md:px-8 bg-black/20 backdrop-blur-md border-b border-white/5 relative z-10 select-none">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-brand-light font-bold">
            Focus Study Mode
          </span>
          <h2 className="text-sm md:text-base font-extrabold text-white truncate max-w-[200px] md:max-w-xs sentence-case">
            {deckTitle}
          </h2>
        </div>

        {/* Center Live Focus Timer */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 font-mono text-sm md:text-base font-bold shadow-inner">
          <Clock className="w-4 h-4 text-brand-light animate-pulse" />
          <span>{formatTime(timeSpentSeconds)}</span>
        </div>

        {/* Close/Minimize Button */}
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/5 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer"
          type="button"
          title="Exit focus mode (Press Escape)"
        >
          <Minimize2 className="w-4 h-4" />
          <span className="hidden sm:inline sentence-case">Exit Focus (ESC)</span>
        </button>
      </header>

      {/* Center Focused Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative z-10 overflow-y-auto">
        <div className="w-full max-w-3xl flex flex-col items-center">
          {children}
        </div>
      </main>

      {/* Footer shortcut hints */}
      <footer className="w-full text-center py-4 bg-black/10 border-t border-white/5 text-[10px] md:text-xs text-white/40 font-semibold select-none z-10">
        <span className="sentence-case">
          Shortcuts: Space to flip • Arrow Keys to navigate • 1, 2, 3 to rate difficulty
        </span>
      </footer>
    </div>
  );
}
