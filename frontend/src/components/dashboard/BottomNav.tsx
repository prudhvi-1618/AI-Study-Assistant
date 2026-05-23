'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, MessageSquare, Layers, Settings } from 'lucide-react';

const mobileNavItems = [
  { icon: LayoutDashboard, label: 'Home', href: '/dashboard' },
  { icon: FileText, label: 'Documents', href: '/documents' },
  { icon: MessageSquare, label: 'Chat', href: '/chat' },
  { icon: Layers, label: 'Cards', href: '/flashcards' },
  { icon: Settings, label: 'Profile', href: '/settings' },
];

export function BottomNav() {
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-16 px-2 z-40 md:hidden">
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        const active = isLinkActive(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center flex-1 py-1 relative justify-center h-full transition-colors ${
              active ? 'text-brand' : 'text-gray-400'
            }`}
          >
            {/* Dot above icon */}
            {active && (
              <span className="w-1 h-1 rounded-full bg-brand absolute top-1.5" />
            )}
            
            <Icon className={`w-5 h-5 ${active ? 'text-brand mt-2' : 'text-gray-400 mt-2'}`} />
            
            <span className="text-[10px] font-medium mt-0.5 sentence-case">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
