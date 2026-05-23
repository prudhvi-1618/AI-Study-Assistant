'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { EmptyState } from '@/components/chat/EmptyState';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { SourcePanel } from '@/components/chat/SourcePanel';
import { FloatingMobileActions } from '@/components/chat/FloatingMobileActions';
import { useChatStream, Message } from '@/lib/stream';
import { X } from 'lucide-react';
import { div } from 'framer-motion/client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ChatPage() {
  const {
    messages,
    loading,
    activeMode,
    setActiveMode,
    sendMessage,
    clearChat,
  } = useChatStream();

  const [sourcesPanelOpen, setSourcesPanelOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Retrieve current active sources (associated with the most recent assistant message)
  const getActiveSources = () => {
    const aiMessages = messages.filter((m) => m.role === 'assistant' && m.sources);
    if (aiMessages.length > 0) {
      return aiMessages[aiMessages.length - 1].sources;
    }
    return undefined;
  };

  const handleSelectPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleScrollToBottom = () => {
    // Scroll list using standard HTML selector
    const listElement = document.querySelector('.flex-1.overflow-y-auto');
    if (listElement) {
      listElement.scrollTo({
        top: listElement.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const activeSources = getActiveSources();

  return (
    <ProtectedRoute>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="min-h-screen bg-surface flex"
      >
        {/* 1. Desktop Chat Sidebar (Hidden on mobile/tablet) */}
        <ChatSidebar activeChatId="chat-1" onNewChat={clearChat} />

        {/* 2. Responsive Mobile Sidebar slide-over drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black z-40 lg:hidden"
              />
              {/* Slide-over Menu Content */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 bottom-0 w-72 bg-ink z-50 shadow-2xl lg:hidden flex flex-col h-screen"
              >
                {/* Close Button overlay */}
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  type="button"
                  title="Close menu"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
                <ChatSidebar activeChatId="chat-1" onNewChat={clearChat} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 3. Main Conversation Area */}
        <div className='w-full' >
          <main className="flex-1 lg:ml-72 min-h-screen flex flex-col bg-surface relative">
            <ChatHeader
              onClearChat={clearChat}
              onToggleSources={() => setSourcesPanelOpen((prev) => !prev)}
              onToggleMobileMenu={() => setMobileMenuOpen(true)}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col justify-center">
                  {/* <EmptyState onSelectPrompt={handleSelectPrompt} /> */}
                </div>
              ) : (
                <MessageList
                  messages={messages}
                  loading={loading}
                  onRegenerate={() => {
                    // Regenerate the last message
                    const userMessages = messages.filter((m) => m.role === 'user');
                    if (userMessages.length > 0) {
                      const lastUserPrompt = userMessages[userMessages.length - 1].content;
                      // Pop the last assistant message and trigger send again
                      sendMessage(lastUserPrompt);
                    }
                  }}
                />
              )}

              <ChatInput
                onSend={sendMessage}
                loading={loading}
                activeMode={activeMode}
                onChangeMode={setActiveMode}
              />
            </div>
          </main>
        </div>  

        {/* 4. Document Citations Context Panel (Static right, or overlay slide-over) */}
        <SourcePanel
          sources={activeSources}
          isOpen={sourcesPanelOpen}
          onClose={() => setSourcesPanelOpen(false)}
        />

        {/* 5. Mobile Floating Action Buttons (For citations and scroll) */}
        <FloatingMobileActions
          onToggleSources={() => setSourcesPanelOpen((prev) => !prev)}
          onScrollToBottom={handleScrollToBottom}
        />
      </motion.div>
    </ProtectedRoute>
  );
}
