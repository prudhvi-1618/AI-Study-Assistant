'use client';

import React from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { Upload, Trophy, MessageSquare } from 'lucide-react';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const hoverScale: Variants = {
  hover: { y: -4, transition: { duration: 0.2 } }
};

export function QuickActions() {
  const actions = [
    {
      title: 'Upload document',
      icon: Upload,
      bg: 'bg-brand-light text-brand-dark',
      iconBg: 'bg-white text-brand',
      hoverBorder: 'hover:bg-brand-light/80',
      href: '/documents',
    },
    {
      title: 'Start quiz',
      icon: Trophy,
      bg: 'bg-mint-light text-mint-dark',
      iconBg: 'bg-white text-mint-mid',
      hoverBorder: 'hover:bg-mint-light/80',
      href: '/quiz',
    },
    {
      title: 'AI chat',
      icon: MessageSquare,
      bg: 'bg-cream-light text-cream-dark',
      iconBg: 'bg-white text-cream-mid',
      hoverBorder: 'hover:bg-cream-light/80',
      href: '/chat',
    },
  ];

  return (
    <motion.section
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      className="mb-6 select-none"
    >
      <h2 className="text-lg font-bold text-ink mb-3 sentence-case">
        Quick actions
      </h2>

      <div className="grid grid-cols-3 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;

          return (
            <Link key={act.title} href={act.href} className="block">
              <motion.div
                variants={hoverScale}
                whileHover="hover"
                className={`${act.bg} ${act.hoverBorder} cursor-pointer rounded-2xl p-4 md:p-5 flex flex-col items-center justify-center text-center transition-colors duration-200 h-full`}
              >
                {/* Icon Circle */}
                <div className={`${act.iconBg} w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-sm shrink-0 mb-2.5`}>
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>

                {/* Title */}
                <span className="text-xs md:text-sm font-bold sentence-case">
                  {act.title}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.section>
  );
}
