'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TestimonialCard } from './TestimonialCard';
import { animationVariants } from '@/hooks/useAnimations';

const testimonials = [
  {
    quote:
      'StudyAI helped me organize my notes and create flashcards instantly. Passed my biology exam with an A!',
    name: 'Sarah Chen',
    subject: 'Biology',
    rating: 5,
  },
  {
    quote:
      'The quiz feature is amazing. Practicing with explanations made the concepts stick way better.',
    name: 'Marcus Johnson',
    subject: 'Physics',
    rating: 5,
  },
  {
    quote:
      'I used StudyAI for my calculus midterm and the personalized study plan saved me so much time.',
    name: 'Emma Rodriguez',
    subject: 'Calculus',
    rating: 5,
  },
];

export const TestimonialsGrid = () => {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={animationVariants.container}
      className="py-20 px-5 md:px-8 bg-white dark:bg-[#0F0F0F]"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section title */}
        <motion.h2
          variants={animationVariants.item}
          className="font-geist font-extrabold text-4xl text-center mb-12 text-[#0F0F0F] dark:text-white"
        >
          Loved by students
        </motion.h2>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={animationVariants.item}
            >
              <TestimonialCard {...testimonial} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};
