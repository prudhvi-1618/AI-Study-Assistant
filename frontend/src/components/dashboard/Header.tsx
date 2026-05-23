'use client';

import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
};

const getGreeting = () => {
  const hr = new Date().getHours();
  if (hr < 12) return 'Good morning';
  if (hr < 17) return 'Good afternoon';
  return 'Good evening';
};

const getFormattedDate = () => {
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
  return new Date().toLocaleDateString('en-US', options);
};

export function Header() {
  const { user } = useAuth();
  const name = user?.name || 'User';
  const initials = getInitials(name);
  const greeting = getGreeting();
  const formattedDate = getFormattedDate();

  return (
    <header className="flex items-center justify-between mb-6">
      {/* Left side: Greeting and Status */}
      <div className="flex flex-col">
        <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight leading-tight sentence-case">
          {greeting}, {name} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5 sentence-case">
          {formattedDate} · 3 docs ready for review
        </p>
      </div>

      {/* Right side: Actions & User Avatar */}
      <div className="flex items-center gap-2">
        {/* Search Action Button */}
        <button
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors text-ink focus:outline-none focus:ring-2 focus:ring-brand focus:ring-opacity-40"
          title="Search"
          type="button"
        >
          <Search className="w-4.5 h-4.5" />
        </button>

        {/* Notification Bell with Amber Dot */}
        <button
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 relative transition-colors text-ink focus:outline-none focus:ring-2 focus:ring-brand focus:ring-opacity-40"
          title="Notifications"
          type="button"
        >
          <Bell className="w-4.5 h-4.5" />
          {/* Amber notification dot */}
          <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1.5 right-1.5 border border-white" />
        </button>

        {/* User Avatar */}
        <div className="w-9 h-9 rounded-full bg-brand-light flex items-center justify-center text-sm font-bold text-brand-dark select-none ml-1">
          {initials}
        </div>
      </div>
    </header>
  );
}
