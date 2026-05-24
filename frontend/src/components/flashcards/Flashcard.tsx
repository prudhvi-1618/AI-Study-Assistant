'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Sparkles, HelpCircle, BookOpen } from 'lucide-react';
import { Flashcard as FlashcardType } from '@/lib/flashcards/data';

interface FlashcardProps {
  card: FlashcardType;
  index: number;
  total: number;
  flipped: boolean;
  onFlip: () => void;
  onSwipeLeft?: () => void;  // Mark hard
  onSwipeRight?: () => void; // Mark easy
  onExplain?: (cardId: string) => void;
}

export function Flashcard({
  card,
  index,
  total,
  flipped,
  onFlip,
  onSwipeLeft,
  onSwipeRight,
  onExplain,
}: FlashcardProps) {
  const dragX = useMotionValue(0);
  // Map drag offset x to Z-axis swing rotation for a natural card deck swipe effect
  const dragRotate = useTransform(dragX, [-200, 200], [-10, 10]);
  // Map drag offset x to a subtle opacity fade when swiping far away
  const dragOpacity = useTransform(dragX, [-300, -200, 0, 200, 300], [0.5, 0.9, 1, 0.9, 0.5]);

  const handleDragEnd = (event: any, info: any) => {
    // If dragged horizontally past threshold, trigger swipe rating callbacks
    if (info.offset.x > 140) {
      onSwipeRight?.();
    } else if (info.offset.x < -140) {
      onSwipeLeft?.();
    }
  };

  // Get difficulty styling
  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-mint-light text-mint-dark';
      case 'medium':
        return 'bg-cream-light text-cream-dark';
      case 'hard':
        return 'bg-blush-light text-blush-dark';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      style={{ x: dragX, rotate: dragRotate, opacity: dragOpacity }}
      onDragEnd={handleDragEnd}
      className="relative w-full max-w-3xl h-[420px] md:h-[500px] cursor-pointer touch-none select-none"
      title="Drag left/right to rate or click to flip"
    >
      {/* 3D Rotator Container */}
      <motion.div
        style={{
          perspective: 1200,
          transformStyle: 'preserve-3d',
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
        onClick={onFlip}
        className="w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-[32px]"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onFlip();
          }
        }}
        role="button"
        aria-label={`Flashcard ${index + 1} of ${total}. Question: ${card.question}. Press space to flip.`}
      >
        {/* FRONT SIDE (Question) */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
          className="absolute inset-0 rounded-[32px] bg-white border border-gray-100 shadow-sm p-6 md:p-10 flex flex-col overflow-hidden"
        >
          {/* Top Row: Tags */}
          <div className="flex justify-between items-center select-none">
            <span className="bg-brand-light text-brand-dark rounded-full px-3 py-1 text-xs font-bold tracking-tight sentence-case">
              {card.topic}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold tracking-tight sentence-case ${getDifficultyBadge(card.difficulty)}`}>
              {card.difficulty}
            </span>
          </div>

          {/* Question Text */}
          <div className="flex-1 flex flex-col justify-center mt-4">
            <div className="flex items-start gap-2.5">
              <HelpCircle className="w-6 h-6 text-brand shrink-0 mt-1 md:mt-2 hidden md:block" />
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight text-ink sentence-case">
                {card.question}
              </h2>
            </div>
          </div>

          {/* Hint Section */}
          {card.hint && (
            <div
              onClick={(e) => e.stopPropagation()} // Prevent card flip on hint click
              className="bg-surface rounded-2xl p-4 text-xs md:text-sm text-gray-600 border border-gray-100/50 mt-auto flex items-start gap-2"
            >
              <Sparkles className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <p className="sentence-case">
                <span className="font-bold">Hint: </span>
                {card.hint}
              </p>
            </div>
          )}

          {/* Tap reveal label */}
          <div className="text-[10px] md:text-xs text-gray-400 text-center mt-4 font-semibold select-none sentence-case">
            Tap or press space to reveal answer
          </div>
        </div>

        {/* BACK SIDE (Answer) */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
          className="absolute inset-0 rounded-[32px] bg-brand text-white shadow-md p-6 md:p-10 flex flex-col overflow-hidden"
        >
          {/* Top Row: Tags */}
          <div className="flex justify-between items-center select-none">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white rounded-full px-3 py-1 text-xs font-bold tracking-tight sentence-case">
                Answer Key
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExplain?.(card.id);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer border border-white/10"
                type="button"
              >
                <Sparkles className="w-3 h-3 animate-pulse" />
                <span>AI Explain</span>
              </button>
            </div>
            {card.importance && (
              <span className="text-[10px] md:text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-lg select-none">
                Exam Importance: {card.importance}
              </span>
            )}
          </div>

          {/* Answer Text */}
          <div className="flex-1 flex flex-col justify-center mt-4 overflow-y-auto pr-1">
            <div className="flex items-start gap-2.5">
              <BookOpen className="w-5 h-5 text-white/80 shrink-0 mt-1.5 hidden md:block" />
              <p className="text-base md:text-lg leading-relaxed font-medium sentence-case">
                {card.answer}
              </p>
            </div>

            {/* Example Box */}
            {card.example && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="mt-4 bg-white/10 rounded-2xl p-4 text-xs md:text-sm leading-relaxed text-white/90 border border-white/5"
              >
                <p className="sentence-case">
                  <span className="font-bold text-white">Example: </span>
                  {card.example}
                </p>
              </div>
            )}
          </div>

          {/* Bottom Meta */}
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10 text-[10px] md:text-xs text-white/70 font-semibold select-none">
            <span className="truncate max-w-[200px] sentence-case">
              {card.source ? `Source: ${card.source}` : ''}
            </span>
            <span className="sentence-case">Card {index + 1} of {total}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
