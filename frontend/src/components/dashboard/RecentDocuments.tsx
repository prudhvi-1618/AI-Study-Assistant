'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { FileText, Loader2 } from 'lucide-react';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const docs = [
  { name: 'Physics_Chapter3.pdf', type: 'pdf', status: 'ready', cards: 48, color: 'bg-brand-light text-brand-dark' },
  { name: 'Chemistry_Notes.docx', type: 'docx', status: 'processing', cards: 0, color: 'bg-mint-light text-mint-dark' },
  { name: 'Math_Formulas.pdf', type: 'pdf', status: 'ready', cards: 32, color: 'bg-cream-light text-cream-dark' },
  { name: 'History_Timeline.txt', type: 'txt', status: 'ready', cards: 18, color: 'bg-blush-light text-blush-dark' },
];

export function RecentDocuments() {
  return (
    <motion.section
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      className="mb-6 select-none"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-ink sentence-case">
          Recent documents
        </h2>
        <span className="text-xs font-semibold text-brand hover:text-brand-mid transition-colors cursor-pointer sentence-case">
          View all →
        </span>
      </div>

      {/* Document List */}
      <div className="flex flex-col gap-2">
        {docs.map((doc, idx) => {
          const isReady = doc.status === 'ready';

          return (
            <div
              key={doc.name + idx}
              className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-3 hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Left: Icon Box */}
              <div className={`${doc.color} w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}>
                <FileText className="w-5 h-5" />
              </div>

              {/* Middle: Details */}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold text-ink truncate sentence-case">
                  {doc.name}
                </span>
                
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isReady ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs text-gray-500 sentence-case">
                        Ready · {doc.cards} flashcards
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-xs text-amber-600 font-medium sentence-case">
                        Processing...
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              {isReady ? (
                <span className="text-xs font-bold text-brand hover:text-brand-mid transition-colors whitespace-nowrap cursor-pointer sentence-case">
                  Open →
                </span>
              ) : (
                <Loader2 className="w-4 h-4 text-amber-500 animate-spin shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
