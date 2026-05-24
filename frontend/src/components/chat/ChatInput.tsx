'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Paperclip, Mic, ArrowUp } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  loading: boolean;
  activeMode: 'Ask' | 'Summarize' | 'Quiz' | 'Flashcards';
  onChangeMode: (mode: 'Ask' | 'Summarize' | 'Quiz' | 'Flashcards') => void;
  disabledReason?: string;
}

const modes = ['Ask', 'Summarize', 'Quiz', 'Flashcards'] as const;

export function ChatInput({
  onSend,
  loading,
  activeMode,
  onChangeMode,
  disabledReason
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize height based on content
  const handleTextareaResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      // Restrict height mapping to max-h-40 (160px)
      const newHeight = Math.min(textarea.scrollHeight, 160);
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    handleTextareaResize();
  }, [value]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!value.trim() || loading || disabledReason) return;

    onSend(value);
    setValue('');
    
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-gray-100 px-4 md:px-6 py-4 w-full select-none z-20">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex flex-col gap-3">
        {/* Input container */}
        <div className="bg-white border border-gray-200 rounded-3xl px-4 py-3 flex items-end gap-3 shadow-sm focus-within:border-brand focus-within:ring-2 focus-within:ring-brand focus-within:ring-opacity-10 transition-all">
          {/* Left Actions - Attachments */}
          <button
            type="button"
            className="w-10 h-10 rounded-2xl flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-ink transition-colors cursor-pointer shrink-0"
            title="Upload attachment"
          >
            <Paperclip className="w-4.5 h-4.5" />
          </button>

          {/* Voice Input */}
          {/* <button
            type="button"
            className="w-10 h-10 rounded-2xl flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-ink transition-colors cursor-pointer shrink-0"
            title="Voice input"
          >
            <Mic className="w-4.5 h-4.5" />
          </button> */}

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your study materials..."
            className="flex-1 resize-none bg-transparent outline-none text-sm max-h-40 py-2.5 placeholder:text-gray-400 leading-relaxed text-ink select-text focus:outline-none"
            disabled={loading || Boolean(disabledReason)}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!value.trim() || loading || Boolean(disabledReason)}
            className="w-12 h-12 rounded-2xl bg-brand hover:bg-brand-mid text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:bg-brand cursor-pointer shrink-0 shadow-sm"
            title="Send query"
          >
            <ArrowUp className="w-5 h-5 text-white" />
          </button>
        </div>

        {disabledReason ? (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
            {disabledReason}
          </div>
        ) : null}

        {/* AI Mode Toggle Pills */}
        <div className="flex flex-wrap items-center gap-1.5 px-1 self-start select-none">
          {modes.map((mode) => {
            const isActive = activeMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onChangeMode(mode)}
                className={`px-4.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-brand text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <span className="sentence-case">{mode}</span>
              </button>
            );
          })}
        </div>
      </form>
    </div>
  );
}
