'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trophy, RefreshCw, AlertTriangle, ArrowRight, Home, Sparkles } from 'lucide-react';

interface SessionSummaryProps {
  deckTitle: string;
  totalCards: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  timeSpentSeconds: number;
  onRestart: () => void;
  onReviewWeakCards?: () => void;
}

export function SessionSummary({
  deckTitle,
  totalCards,
  easyCount,
  mediumCount,
  hardCount,
  timeSpentSeconds,
  onRestart,
  onReviewWeakCards,
}: SessionSummaryProps) {
  // Format study timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Performance calculation
  const accuracy = totalCards > 0 ? Math.round(((easyCount + mediumCount * 0.5) / totalCards) * 100) : 0;

  return (
    <div className=" max-w-3xl p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden p-6 md:p-10 flex flex-col items-center"
      >
        {/* Trophy icon container */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-brand/10 rounded-full filter blur-xl animate-pulse" />
          <div className="w-20 h-20 rounded-[28px] bg-brand flex items-center justify-center relative border-4 border-brand-light">
            <Trophy className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Congratulations Header */}
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink text-center mb-1 sentence-case">
          Deck study session completed
        </h2>
        <p className="text-sm font-medium text-gray-500 text-center mb-8 sentence-case">
          You finished studying {deckTitle}
        </p>

        {/* Big Metric Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8">
          <div className="bg-surface rounded-2xl p-5 text-center border border-gray-50/50">
            <span className="text-xs font-semibold text-gray-500 block mb-1 uppercase tracking-wider">
              Time studied
            </span>
            <span className="text-2xl md:text-3xl font-extrabold text-ink block truncate leading-none">
              {formatTime(timeSpentSeconds)}
            </span>
          </div>

          <div className="bg-surface rounded-2xl p-5 text-center border border-gray-50/50">
            <span className="text-xs font-semibold text-gray-500 block mb-1 uppercase tracking-wider">
              Mastery score
            </span>
            <span className="text-3xl md:text-4xl font-extrabold text-brand block leading-none">
              {accuracy}%
            </span>
          </div>

          <div className="bg-surface rounded-2xl p-5 text-center border border-gray-50/50">
            <span className="text-xs font-semibold text-gray-500 block mb-1 uppercase tracking-wider">
              Cards reviewed
            </span>
            <span className="text-3xl md:text-4xl font-extrabold text-ink block leading-none">
              {totalCards}
            </span>
          </div>

          <div className="bg-surface rounded-2xl p-5 text-center border border-gray-50/50">
            <span className="text-xs font-semibold text-gray-500 block mb-1 uppercase tracking-wider">
              Streak updated
            </span>
            <span className="text-3xl md:text-4xl font-extrabold text-amber-600 block leading-none">
              +1 day
            </span>
          </div>
        </div>

        {/* Difficulty Distribution Breakdown */}
        <div className="w-full bg-surface rounded-3xl p-6 border border-gray-50/50 mb-8">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 sentence-case">
            Review rating breakdown
          </h3>
          <div className="flex items-center gap-4 h-5 rounded-full overflow-hidden w-full bg-gray-100">
            {easyCount > 0 && (
              <div
                className="bg-mint h-full transition-all"
                style={{ width: `${(easyCount / totalCards) * 100}%` }}
                title={`Easy: ${easyCount}`}
              />
            )}
            {mediumCount > 0 && (
              <div
                className="bg-cream h-full transition-all"
                style={{ width: `${(mediumCount / totalCards) * 100}%` }}
                title={`Medium: ${mediumCount}`}
              />
            )}
            {hardCount > 0 && (
              <div
                className="bg-blush h-full transition-all"
                style={{ width: `${(hardCount / totalCards) * 100}%` }}
                title={`Hard: ${hardCount}`}
              />
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-mint shrink-0" />
              <span className="text-xs font-bold text-gray-700 sentence-case">
                Easy: {easyCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cream shrink-0" />
              <span className="text-xs font-bold text-gray-700 sentence-case">
                Medium: {mediumCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blush shrink-0" />
              <span className="text-xs font-bold text-gray-700 sentence-case">
                Hard: {hardCount}
              </span>
            </div>
          </div>
        </div>

        {/* AI Insight recommendation */}
        {hardCount > 0 && (
          <div className="w-full bg-blush-light text-blush-dark rounded-3xl p-5 mb-8 flex items-start gap-3 border border-blush/10">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-extrabold sentence-case">AI learning advisor</h4>
              <p className="text-xs font-semibold leading-relaxed mt-1 sentence-case">
                You labeled {hardCount} cards as hard. Let's create a custom sub-session focused strictly on these topics to lock down memory retention.
              </p>
            </div>
          </div>
        )}

        {/* Action Button Controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {hardCount + mediumCount > 0 && onReviewWeakCards ? (
            <button
              onClick={onReviewWeakCards}
              className="flex-1 bg-ink text-white hover:bg-ink/90 active:scale-95 rounded-2xl px-5 py-4 flex items-center justify-center gap-2 font-bold text-sm transition-all cursor-pointer"
              type="button"
            >
              <Sparkles className="w-4 h-4 text-brand" />
              <span className="sentence-case">Review weak cards ({hardCount + mediumCount})</span>
            </button>
          ) : null}

          <button
            onClick={onRestart}
            className="flex-1 bg-brand hover:bg-brand-mid active:scale-95 text-white rounded-2xl px-5 py-4 flex items-center justify-center gap-2 font-bold text-sm transition-all cursor-pointer"
            type="button"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="sentence-case">Study deck again</span>
          </button>

          <Link
            href="/dashboard"
            className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 active:scale-95 text-gray-700 rounded-2xl px-5 py-4 flex items-center justify-center gap-2 font-bold text-sm transition-all text-center"
          >
            <Home className="w-4 h-4 text-gray-500" />
            <span className="sentence-case">Dashboard</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
