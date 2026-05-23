'use client';

import React from 'react';
import { X, Library, AlertCircle } from 'lucide-react';
import { Source } from '@/lib/stream';
import { SourceCard } from './SourceCard';
import { motion, AnimatePresence } from 'framer-motion';

interface SourcePanelProps {
  sources?: Source[];
  isOpen: boolean;
  onClose: () => void;
}

const fallbackSources: Source[] = [
  {
    title: 'Physics_Chapter3_Wave_Mechanics.pdf',
    page: 12,
    relevance: 96,
    excerpt: 'Wave interference occurs when two or more waves overlap in the same region of space. The resultant displacement is the algebraic sum of the individual wave displacements.',
  },
  {
    title: 'Chemistry_Notes_Organic_Compounds.docx',
    page: 4,
    relevance: 89,
    excerpt: 'Covalent carbon bonding generates structural configurations that define chemical stability and compound behavior in reactions.',
  },
];

export function SourcePanel({ sources = [], isOpen, onClose }: SourcePanelProps) {
  const activeSources = sources.length > 0 ? sources : fallbackSources;

  // Panel Inner Content
  const panelContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <Library className="w-4.5 h-4.5 text-brand" />
          <div>
            <h3 className="text-sm font-bold text-ink sentence-case">Sources</h3>
            <p className="text-[10px] text-gray-400 font-medium sentence-case">AI references used</p>
          </div>
        </div>
        
        {/* Close Button (only functional in drawer/sheet mode on non-desktop) */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-ink transition-colors cursor-pointer xl:hidden"
          type="button"
          title="Close sources panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface/50">
        {activeSources.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-400 sentence-case">No sources cited yet</p>
          </div>
        ) : (
          activeSources.map((src, i) => (
            <SourceCard key={`${src.title}-${i}`} source={src} />
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Layout (Static right-hand panel, sticky) */}
      <aside className="hidden xl:flex flex-col w-80 border-l border-gray-100 bg-white h-screen sticky top-0 shrink-0">
        {panelContent}
      </aside>

      {/* 2. Responsive Tablet/Mobile overlay (using AnimatePresence) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black z-40 xl:hidden"
            />
            {/* Slide-over Panel */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-white z-50 shadow-2xl xl:hidden border-l border-gray-100 flex flex-col h-screen"
            >
              {panelContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
