'use client';

import React, { useEffect, useRef } from 'react';
import { Message } from '@/lib/stream';
import { UserMessage } from './UserMessage';
import { AIMessage } from './AIMessage';
import { TypingIndicator } from './TypingIndicator';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  onRegenerate?: () => void;
  onSaveNote?: (text: string) => void;
  onCreateFlashcards?: (text: string) => void;
}

export function MessageList({
  messages,
  loading,
  onRegenerate,
  onSaveNote,
  onCreateFlashcards,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages list size or loading state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
      {messages.map((message, idx) => {
        const isUser = message.role === 'user';
        const isLastMessage = idx === messages.length - 1;

        if (isUser) {
          return <UserMessage key={message.id} message={message} />;
        }

        // If the AI message is currently empty and loading is true, show typing indicator instead of empty bubble
        if (message.content === '' && loading && isLastMessage) {
          return <TypingIndicator key={message.id} />;
        }

        return (
          <AIMessage
            key={message.id}
            message={message}
            isStreaming={loading && isLastMessage && message.content.length > 0}
            onRegenerate={isLastMessage ? onRegenerate : undefined}
            onSaveNote={onSaveNote}
            onCreateFlashcards={onCreateFlashcards}
          />
        );
      })}
      
      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}
