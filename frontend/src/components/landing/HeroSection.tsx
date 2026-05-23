'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from '@/components/common/Icons';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { animationVariants } from '@/hooks/useAnimations';

export const HeroSection = () => {
  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={animationVariants.container}
      className="relative min-h-screen flex items-center justify-center px-5 md:px-8 py-20 bg-white dark:bg-[#0F0F0F]"
    >
      <div className="max-w-5xl mx-auto w-full text-center">
        {/* Eyebrow badge */}
        <motion.div variants={animationVariants.item} className="mb-6">
          <Badge variant="brand" size="md">
            AI-powered exam prep
          </Badge>
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={animationVariants.item}
          className="font-geist font-extrabold text-6xl md:text-8xl tracking-tighter leading-tight text-[#0F0F0F] dark:text-white mb-6"
        >
          Study smarter,
          <br />
          not harder.
        </motion.h1>

        {/* Subtext */}
        <motion.p
          variants={animationVariants.item}
          className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-2xl mx-auto"
        >
          Upload your notes. Ask anything. Master every topic.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={animationVariants.item}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
        >
          <Button
            variant="primary"
            size="lg"
            href="/register"
            className="flex items-center justify-center gap-2"
          >
            Start for free <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="lg"
            href="#how-it-works"
          >
            See how it works
          </Button>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          variants={animationVariants.item}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {/* Avatar bubbles */}
          <div className="flex -space-x-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-brand-light dark:from-brand-light dark:to-brand border-2 border-white dark:border-[#0F0F0F] flex items-center justify-center text-xs font-bold text-white dark:text-[#0F0F0F]"
              >
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-ink dark:text-white">+12,000 students</span> trust StudyAI
          </p>
        </motion.div>
      </div>

      {/* Decorative gradient */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-gradient-to-br from-brand/5 to-mint/5 dark:from-brand/10 dark:to-mint/10" />
    </motion.section>
  );
};
