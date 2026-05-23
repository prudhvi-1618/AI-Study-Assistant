'use client';

import React from 'react';
import { Brain, MessageSquare, Plus, Settings, MoreVertical } from 'lucide-react';
import Link from 'next/link';

interface ChatSidebarProps {
  onNewChat?: () => void;
  activeChatId?: string;
  onSelectChat?: (id: string) => void;
}

const chats = [
  {
    id: 'chat-1',
    title: 'Explain wave mechanics',
    time: '2m ago',
    active: true,
  },
  {
    id: 'chat-2',
    title: 'Generate MCQs from chemistry',
    time: '1h ago',
    active: false,
  },
  {
    id: 'chat-3',
    title: 'Summarize chapter 4',
    time: 'Yesterday',
    active: false,
  },
];

export function ChatSidebar({ onNewChat, activeChatId, onSelectChat }: ChatSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-ink text-white hidden lg:flex flex-col border-r border-white/10 z-40">
      {/* Top Section */}
      <div className="p-5 flex flex-col">
        {/* Logo Row */}
        <Link href="/dashboard" className="flex items-center gap-2 mt-2">
          <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-extrabold text-lg tracking-tight select-none">
            StudyAI
          </span>
        </Link>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="mt-6 w-full bg-brand hover:bg-brand-mid rounded-2xl px-4 py-3 flex items-center justify-center gap-2 font-semibold text-sm transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand focus:ring-opacity-40"
          type="button"
        >
          <Plus className="w-4 h-4 text-white" />
          <span className="sentence-case">New study chat</span>
        </button>
      </div>

      {/* Conversation History */}
      <div className="flex-1 overflow-y-auto px-3 select-none">
        <span className="text-xs uppercase tracking-wide text-gray-500 px-2 mt-8 mb-3 block font-semibold">
          Recent chats
        </span>

        <div className="space-y-1">
          {chats.map((chat) => {
            const isActive = activeChatId ? activeChatId === chat.id : chat.active;
            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat && onSelectChat(chat.id)}
                className={`group rounded-2xl px-3 py-3 cursor-pointer hover:bg-white/10 transition-colors flex items-center justify-between gap-3 ${
                  isActive ? 'bg-brand text-white hover:bg-brand/95' : 'text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold truncate block leading-tight sentence-case">
                      {chat.title}
                    </span>
                    <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-white/70' : 'text-gray-500'}`}>
                      {chat.time}
                    </span>
                  </div>
                </div>

                <button
                  className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  title="More actions"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom User Section */}
      <div className="mt-auto border-t border-white/10 p-4 flex items-center justify-between bg-ink/90">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar Circle */}
          <div className="w-9 h-9 rounded-full bg-brand-light text-brand-dark flex items-center justify-center font-extrabold text-xs shrink-0 select-none">
            RS
          </div>
          {/* User Info */}
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white truncate block">
              Riya Sharma
            </span>
            <span className="text-[10px] text-gray-400 truncate block">
              riya@student.edu
            </span>
          </div>
        </div>

        {/* Settings Button */}
        <Link
          href="/settings"
          className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-white/5"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </div>
    </aside>
  );
}
