'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Award, Flame, CheckCircle, HelpCircle, Sparkles } from 'lucide-react';

interface ProgressStatsProps {
  reviewedCount: number;
  totalCount: number;
  streakDays: number;
  accuracyRate: number; // e.g., 85
}

export function ProgressStats({
  reviewedCount,
  totalCount,
  streakDays,
  accuracyRate,
}: ProgressStatsProps) {
  // Dynamic session completion percentage
  const percentage = totalCount > 0 ? Math.round((reviewedCount / totalCount) * 100) : 0;

  // SVG Progress Ring calculations
  const radius = 38;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius; // Approx 238.76
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <aside className="hidden xl:flex flex-col w-80 border-l border-gray-100 bg-white sticky -top-6 h-fit p-6 select-none overflow-y-auto">
      {/* Session Progress Header */}
      <h3 className="text-sm font-bold text-ink mb-4 uppercase tracking-wider text-gray-500">
        Session progress
      </h3>

      {/* Circular Progress Ring Container */}
      <div className="flex flex-col items-center justify-center bg-surface rounded-3xl p-6 relative border border-gray-50/50">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              className="stroke-gray-200 fill-none"
              strokeWidth={strokeWidth}
            />
            {/* Progress Circle */}
            <motion.circle
              cx="56"
              cy="56"
              r={radius}
              className="stroke-brand fill-none"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              strokeLinecap="round"
            />
          </svg>
          {/* Centered Percentage Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
            <span className="text-2xl font-extrabold text-ink leading-none">
              {percentage}%
            </span>
            <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
              done
            </span>
          </div>
        </div>

        <p className="text-xs font-semibold text-gray-500 mt-4 text-center sentence-case">
          Reviewing active session cards
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {/* Cards reviewed */}
        <div className="bg-surface rounded-2xl p-4 flex flex-col justify-between border border-gray-50/50">
          <div className="flex items-center gap-1 text-gray-500">
            <CheckCircle className="w-3.5 h-3.5 text-brand" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Rated</span>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-ink">
              {reviewedCount}
            </span>
            <span className="text-xs font-medium text-gray-400 ml-1">/ {totalCount}</span>
          </div>
        </div>

        {/* Study Streak */}
        <div className="bg-surface rounded-2xl p-4 flex flex-col justify-between border border-gray-50/50">
          <div className="flex items-center gap-1 text-gray-500">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Streak</span>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-ink">
              {streakDays}
            </span>
            <span className="text-xs font-medium text-gray-400 ml-1">days</span>
          </div>
        </div>

        {/* Remaining */}
        <div className="bg-surface rounded-2xl p-4 flex flex-col justify-between border border-gray-50/50">
          <div className="flex items-center gap-1 text-gray-500">
            <HelpCircle className="w-3.5 h-3.5 text-mint-mid" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Left</span>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-ink">
              {Math.max(0, totalCount - reviewedCount)}
            </span>
            <span className="text-xs font-medium text-gray-400 ml-1">cards</span>
          </div>
        </div>

        {/* Study accuracy */}
        <div className="bg-surface rounded-2xl p-4 flex flex-col justify-between border border-gray-50/50">
          <div className="flex items-center gap-1 text-gray-500">
            <Award className="w-3.5 h-3.5 text-blush-mid" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Accuracy</span>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-ink">
              {accuracyRate}%
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
