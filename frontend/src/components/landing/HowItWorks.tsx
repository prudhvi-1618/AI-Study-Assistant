'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { animationVariants } from '@/hooks/useAnimations';

const steps = [
  {
    number: '1',
    title: 'Upload your study material',
    description: 'PDF, DOCX, notes, slides, or links',
  },
  {
    number: '2',
    title: 'Choose a study mode',
    description: 'Chat, flashcards, quiz, or planner',
  },
  {
    number: '3',
    title: 'Learn, practice & progress',
    description: 'Track your improvement with analytics',
  },
];

export const HowItWorks = () => {
  return (
    <motion.section
      id="how-it-works"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={animationVariants.container}
      className="py-20 px-5 md:px-8 bg-[#F7F7F5] dark:bg-gray-900"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section title */}
        <motion.h2
          variants={animationVariants.item}
          className="font-geist font-extrabold text-4xl text-center mb-16 text-[#0F0F0F] dark:text-white"
        >
          How it works
        </motion.h2>

        {/* Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Desktop connector line */}
          <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-brand/30 via-brand to-brand/30 dark:from-brand-light/30 dark:via-brand-light dark:to-brand-light/30" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={animationVariants.item}
              className="relative flex flex-col items-center"
            >
              {/* Step number pill */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 rounded-full bg-brand dark:bg-brand-light text-white dark:text-ink flex items-center justify-center font-geist font-extrabold text-xl mb-6 relative z-10"
              >
                {step.number}
              </motion.div>

              {/* Step content */}
              <div className="text-center">
                <h3 className="font-geist font-bold text-xl mb-2 text-[#0F0F0F] dark:text-white">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};
