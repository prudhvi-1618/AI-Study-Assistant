'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from '@/components/common/Icons';
import { Button } from '@/components/common/Button';
import { animationVariants } from '@/hooks/useAnimations';

export const FinalCTA = () => {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={animationVariants.container}
      className="py-20 px-5 md:px-8 bg-gradient-to-br from-brand/10 to-mint/10 dark:from-brand/20 dark:to-mint/20 bg-white dark:bg-[#0F0F0F]"
    >
      <div className="max-w-3xl mx-auto text-center">
        {/* Heading */}
        <motion.h2
          variants={animationVariants.item}
          className="font-geist font-extrabold text-4xl md:text-5xl mb-6 text-[#0F0F0F] dark:text-white"
        >
          Ready to ace your exams?
        </motion.h2>

        {/* CTA Button */}
        <motion.div variants={animationVariants.item} className="mb-6">
          <Button
            variant="primary"
            size="lg"
            href="/register"
            className="flex items-center justify-center gap-2"
          >
            Create free account <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>

        {/* Subtext */}
        <motion.p
          variants={animationVariants.item}
          className="text-sm text-gray-500 dark:text-gray-400"
        >
          No credit card. Cancel anytime.
        </motion.p>
      </div>
    </motion.section>
  );
};
