'use client';

import React from 'react';
import { Layers, Trophy, FileText } from 'lucide-react';

export function StatsGrid() {
  // SVG circle math:
  // r = 20, center = 24, 24
  // circumference = 2 * pi * r = 125.66
  // 72% filled means offset is 125.66 * (1 - 0.72) = 35.18
  const radius = 20;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;
  const fillPercentage = 0.72;
  const strokeDashoffset = circumference * (1 - fillPercentage);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {/* Card 1 — Study streak */}
      <div className="col-span-2 lg:col-span-1 bg-brand-light rounded-2xl p-4 flex justify-between items-start hover:-translate-y-1 transition-transform duration-200 select-none">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-brand-mid sentence-case">
            Study streak
          </span>
          <span className="text-4xl font-extrabold text-brand-dark leading-none mt-2">
            7 days
          </span>
          <span className="text-xs font-medium text-brand-mid mt-2 flex items-center gap-1 sentence-case">
            🔥 Personal best!
          </span>
        </div>

        {/* Circular Progress Ring */}
        <div className="relative w-12 h-12 shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="24"
              cy="24"
              r={radius}
              className="stroke-brand-dark/10"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Foreground Progress Circle */}
            <circle
              cx="24"
              cy="24"
              r={radius}
              className="stroke-brand"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          {/* Centered Percentage Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-extrabold text-brand-dark">72%</span>
          </div>
        </div>
      </div>

      {/* Card 2 — Flashcards */}
      <div className="bg-mint-light rounded-2xl p-4 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-200 select-none">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-500 sentence-case">
              Flashcards reviewed
            </span>
            <span className="text-3xl md:text-4xl font-extrabold text-mint-dark leading-none mt-2">
              128
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-white/60 flex items-center justify-center text-mint-dark shrink-0">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <span className="text-xs font-semibold text-mint-mid mt-4 sentence-case">
          ↑ 24 this week
        </span>
      </div>

      {/* Card 3 — Quiz Score */}
      <div className="bg-cream-light rounded-2xl p-4 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-200 select-none">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-500 sentence-case">
              Avg quiz score
            </span>
            <span className="text-3xl md:text-4xl font-extrabold text-cream-dark leading-none mt-2">
              88%
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-white/60 flex items-center justify-center text-cream-dark shrink-0">
            <Trophy className="w-4 h-4" />
          </div>
        </div>
        <span className="text-xs font-semibold text-cream-mid mt-4 sentence-case">
          ↑ 4% from last week
        </span>
      </div>

      {/* Card 4 — Documents */}
      <div className="bg-blush-light rounded-2xl p-4 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-200 select-none">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-500 sentence-case">
              Docs uploaded
            </span>
            <span className="text-3xl md:text-4xl font-extrabold text-blush-dark leading-none mt-2">
              12
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-white/60 flex items-center justify-center text-blush-dark shrink-0">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <span className="text-xs font-semibold text-amber-600 mt-4 animate-pulse sentence-case">
          3 processing...
        </span>
      </div>
    </div>
  );
}
