'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export function ContinueCard() {
  return (
    <motion.section
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      className="bg-ink text-white rounded-3xl p-5 md:p-6 flex items-center justify-between gap-4 mb-6 select-none hover:-translate-y-1 transition-transform duration-200"
    >
      {/* Left side: Progress details */}
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider sentence-case">
          Continue where you left off
        </span>
        
        <h3 className="text-lg md:text-xl font-extrabold mt-1 truncate sentence-case">
          Physics — Wave Mechanics
        </h3>

        {/* Progress Bar */}
        <div className="w-full bg-white/10 rounded-full h-2 mt-3.5 max-w-xs md:max-w-md overflow-hidden">
          <div
            className="bg-brand h-full rounded-full transition-all duration-500"
            style={{ width: '65%' }}
          />
        </div>

        {/* Subtext */}
        <span className="text-xs text-gray-400 mt-2 font-medium sentence-case">
          65% complete · Est. 12 min left
        </span>
      </div>

      {/* Right side: Action Button */}
      <div className="shrink-0">
        <button
          className="bg-white text-ink rounded-xl px-4 py-2.5 md:px-5 md:py-3 text-xs md:text-sm font-bold whitespace-nowrap hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-40"
          type="button"
        >
          Resume →
        </button>
      </div>
    </motion.section>
  );
}
