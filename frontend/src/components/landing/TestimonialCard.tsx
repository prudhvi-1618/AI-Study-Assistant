'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from '@/components/common/Icons';
import { Card } from '@/components/common/Card';

interface TestimonialCardProps {
  quote: string;
  name: string;
  subject: string;
  rating: number;
}

export const TestimonialCard = ({
  quote,
  name,
  subject,
  rating,
}: TestimonialCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card bg="white" padding="lg" rounded="2xl">
        {/* Quote */}
        <p className="text-base font-medium italic text-gray-800 dark:text-gray-200 mb-6">
          &quot;{quote}&quot;
        </p>

        {/* Stars */}
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < rating
                  ? 'fill-cream text-cream dark:fill-brand dark:text-brand'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Name and subject */}
        <h4 className="font-geist font-bold text-sm text-[#0F0F0F] dark:text-white">
          {name}
        </h4>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {subject}
        </p>
      </Card>
    </motion.div>
  );
};
