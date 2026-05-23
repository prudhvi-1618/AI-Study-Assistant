'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { animationVariants } from '@/hooks/useAnimations';

const stats = [
  {
    number: '48K+',
    label: 'flashcards created',
  },
  {
    number: '2M+',
    label: 'questions answered',
  },
  {
    number: '94%',
    label: 'pass rate',
  },
];

export const StatsStrip = () => {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={animationVariants.container}
      className="py-20 px-5 md:px-8 bg-white dark:bg-[#0F0F0F]"
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          variants={animationVariants.item}
          className="bg-[#0F0F0F] dark:bg-white text-white dark:text-[#0F0F0F] rounded-3xl p-8 md:p-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={animationVariants.item}
              >
                <h3 className="font-geist font-extrabold text-4xl md:text-5xl mb-2 text-white dark:text-[#0F0F0F]">
                  {stat.number}
                </h3>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};
