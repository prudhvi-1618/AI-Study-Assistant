'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Layers, CheckCircle } from '@/components/common/Icons';
import { FeatureCard } from './FeatureCard';
import { animationVariants } from '@/hooks/useAnimations';

const features = [
  {
    icon: Upload,
    title: 'Upload anything',
    description: 'PDF, DOCX, notes, slides. Get instant AI analysis.',
    bg: 'brand' as const,
  },
  {
    icon: Layers,
    title: 'AI flashcards',
    description: 'Generated in seconds. Perfect for memorization.',
    bg: 'mint' as const,
  },
  {
    icon: CheckCircle,
    title: 'Practice quizzes',
    description: 'MCQs with explanations. Learn by doing.',
    bg: 'cream' as const,
  },
];

export const FeatureGrid = () => {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={animationVariants.container}
      className="relative py-20 px-5 md:px-8 bg-surface dark:bg-gray-900"
    >
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={animationVariants.item}
            >
              <FeatureCard {...feature} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};
