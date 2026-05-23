'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Brain, Copy, Check, RotateCw, Bookmark, Layers, Sparkles } from 'lucide-react';
import { Message } from '@/lib/stream';

interface AIMessageProps {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onSaveNote?: (text: string) => void;
  onCreateFlashcards?: (text: string) => void;
}

export function AIMessage({
  message,
  isStreaming = false,
  onRegenerate,
  onSaveNote,
  onCreateFlashcards,
}: AIMessageProps) {
  const [copied, setCopied] = useState(false);
  const [savedNote, setSavedNote] = useState(false);
  const [createdCards, setCreatedCards] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleSaveNote = () => {
    if (onSaveNote) onSaveNote(message.content);
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 2000);
  };

  const handleCreateCards = () => {
    if (onCreateFlashcards) onCreateFlashcards(message.content);
    setCreatedCards(true);
    setTimeout(() => setCreatedCards(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex items-start gap-3 select-text"
    >
      {/* AI Avatar */}
      <div className="w-10 h-10 rounded-2xl bg-brand-light flex items-center justify-center shrink-0 shadow-sm border border-brand-light select-none">
        <Brain className="w-5.5 h-5.5 text-brand" />
      </div>

      {/* Message Bubble */}
      <div className="max-w-[90%] md:max-w-3xl bg-white border border-gray-100 rounded-[24px] rounded-tl-md px-5 py-4 shadow-sm flex flex-col">
        
        {/* Markdown content container */}
        <div className="text-[15px] leading-7 text-gray-800 markdown-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p({ children }) {
                return <p className="mb-3 last:mb-0">{children}</p>;
              },
              h1({ children }) {
                return <h1 className="text-xl font-bold text-ink mt-4 mb-2 first:mt-0 sentence-case">{children}</h1>;
              },
              h2({ children }) {
                return <h2 className="text-lg font-bold text-ink mt-3 mb-2 first:mt-0 sentence-case">{children}</h2>;
              },
              h3({ children }) {
                return <h3 className="text-base font-bold text-ink mt-3 mb-1 first:mt-0 sentence-case">{children}</h3>;
              },
              ul({ children }) {
                return <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>;
              },
              ol({ children }) {
                return <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>;
              },
              li({ children }) {
                return <li className="pl-0.5">{children}</li>;
              },
              blockquote({ children }) {
                return (
                  <blockquote className="border-l-4 border-brand-light bg-surface/50 pl-4 py-1 pr-2 rounded-r-xl my-3 text-gray-600 italic">
                    {children}
                  </blockquote>
                );
              },
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return match ? (
                  <pre className="bg-surface border border-gray-200/60 rounded-xl p-3 my-3 overflow-x-auto text-xs leading-5 font-mono text-ink">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code className="bg-gray-100 text-brand-dark px-1.5 py-0.5 rounded font-mono text-xs" {...props}>
                    {children}
                  </code>
                );
              },
              table({ children }) {
                return (
                  <div className="overflow-x-auto my-4 border border-gray-100 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-100">{children}</table>
                  </div>
                );
              },
              thead({ children }) {
                return <thead className="bg-surface">{children}</thead>;
              },
              th({ children }) {
                return <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{children}</th>;
              },
              tbody({ children }) {
                return <tbody className="divide-y divide-gray-100 bg-white">{children}</tbody>;
              },
              tr({ children }) {
                return <tr>{children}</tr>;
              },
              td({ children }) {
                return <td className="px-4 py-2 text-sm text-gray-700">{children}</td>;
              },
            }}
          >
            {message.content}
          </ReactMarkdown>

          {/* Pulsing cursor while streaming */}
          {isStreaming && (
            <span className="inline-block w-2 h-5 bg-brand animate-pulse ml-1 align-middle" />
          )}
        </div>

        {/* Bottom Actions Row (only render if streaming is finished or failed) */}
        {!isStreaming && message.content.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 border-t border-gray-50 pt-3 select-none">
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="h-8 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:text-ink hover:bg-gray-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              type="button"
              title="Copy answer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 font-bold sentence-case">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="sentence-case">Copy</span>
                </>
              )}
            </button>

            {/* Regenerate button */}
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="h-8 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:text-ink hover:bg-gray-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                type="button"
                title="Regenerate response"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="sentence-case">Regenerate</span>
              </button>
            )}

            {/* Save note button */}
            <button
              onClick={handleSaveNote}
              className="h-8 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:text-brand hover:border-brand-light hover:bg-brand-light/20 transition-colors flex items-center gap-1.5 cursor-pointer"
              type="button"
              title="Save to summaries"
            >
              <Bookmark className={`w-3.5 h-3.5 ${savedNote ? 'fill-brand text-brand' : ''}`} />
              <span className="sentence-case">{savedNote ? 'Saved!' : 'Save note'}</span>
            </button>

            {/* Create flashcards action */}
            <button
              onClick={handleCreateCards}
              className="h-8 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:text-brand hover:border-brand-light hover:bg-brand-light/20 transition-colors flex items-center gap-1.5 cursor-pointer"
              type="button"
              title="Generate study cards"
            >
              <Layers className={`w-3.5 h-3.5 ${createdCards ? 'text-brand' : ''}`} />
              <span className="sentence-case">{createdCards ? 'Created!' : 'Create flashcards'}</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
