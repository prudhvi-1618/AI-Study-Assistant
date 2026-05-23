'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Layers,
  Trophy,
  BookOpen,
  Calendar,
  BarChart2,
  Brain,
  Settings,
  Sparkles,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
};

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: FileText, label: 'Documents', href: '/documents' },
  { icon: MessageSquare, label: 'AI Chat', href: '/chat' },
  { icon: Layers, label: 'Flashcards', href: '/flashcards' },
  { icon: Trophy, label: 'Quiz Arena', href: '/quiz' },
  { icon: BookOpen, label: 'Summaries', href: '/summaries' },
  // { icon: Calendar, label: 'Planner', href: '/planner' },
  // { icon: BarChart2, label: 'Analytics', href: '/analytics' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const name = user?.name || 'User';
  const email = user?.email || '';
  const initials = getInitials(name);

  // Simple check for active item: fallback to dashboard if pathname matches /dashboard or is empty
  const isLinkActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 lg:w-60 bg-ink flex flex-col z-40 hidden md:flex transition-all duration-300">
      {/* Top Section */}
      <div className="flex items-center p-4 lg:p-5 mt-2">
        <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center shrink-0">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-extrabold text-lg ml-2 tracking-tight hidden lg:block">
          StudyAI
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="mt-8 flex flex-col gap-1 px-2 lg:px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isLinkActive(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              } ${
                // Center icon on tablet, normal padding on desktop
                'justify-center lg:justify-start px-2.5 lg:px-3'
              }`}
              title={item.label}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="truncate hidden lg:block sentence-case">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto flex flex-col">
        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-3 py-2.5 mx-2 lg:mx-3 mb-2 rounded-xl text-sm font-medium transition-colors text-gray-400 hover:text-red-400 hover:bg-red-500/10 justify-center lg:justify-start px-2.5 lg:px-3 cursor-pointer"
          title="Log out"
          type="button"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="truncate hidden lg:block sentence-case">Log out</span>
        </button>

        {/* User Row */}
        <div className="flex items-center justify-between p-3 mx-2 lg:mx-3 mb-4 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar Circle Lavender Initials */}
            <div className="w-8 h-8 rounded-full bg-brand-light text-brand-dark flex items-center justify-center font-extrabold text-xs shrink-0 select-none">
              {initials}
            </div>
            {/* User Info (Desktop only) */}
            <div className="flex flex-col min-w-0 hidden lg:block">
              <span className="text-xs font-bold text-white truncate block">
                {name}
              </span>
              <span className="text-[10px] text-gray-400 truncate block">
                {email}
              </span>
            </div>
          </div>
          {/* Settings Icon (Desktop only) */}
          <Link
            href="/settings"
            className="text-gray-400 hover:text-white transition-colors p-1 hidden lg:block"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
