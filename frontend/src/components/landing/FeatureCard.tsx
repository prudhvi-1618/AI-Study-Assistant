'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, type IconComponent } from '@/components/common/Icons';
import { Card } from '@/components/common/Card';

interface FeatureCardProps {
  icon: IconComponent;
  title: string;
  description: string;
  bg?: 'brand' | 'mint' | 'cream' | 'blush';
}

export const FeatureCard = ({
  icon: Icon,
  title,
  description,
  bg = 'brand',
}: FeatureCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card bg={bg} padding="lg" rounded="2xl">
        <div className="h-full flex flex-col justify-between">
          {/* Icon */}
          <Icon className="w-12 h-12 mb-4 text-current opacity-80" />

          {/* Title and description */}
          <div className="mb-4">
            <h3 className="font-geist font-bold text-2xl mb-2 text-[#0F0F0F] dark:text-white">
              {title}
            </h3>
            <p className="text-base text-gray-700 dark:text-gray-300">
              {description}
            </p>
          </div>

          {/* Arrow link */}
          <div className="flex items-center text-sm font-semibold text-[#0F0F0F] dark:text-white hover:gap-1 transition-all duration-200">
            <span>Learn more</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
