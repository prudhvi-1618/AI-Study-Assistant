'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Calendar as CalendarIcon } from 'lucide-react';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

interface ScheduleItem {
  subject: string;
  time: string;
  urgent?: boolean;
  dotColor: string;
  dotBorder: string;
}

const scheduleItems: ScheduleItem[] = [
  {
    subject: 'Physics flashcard review',
    time: 'Today, 6:00 PM',
    urgent: true,
    dotColor: 'bg-brand-light',
    dotBorder: 'border-brand',
  },
  {
    subject: 'Chemistry quiz',
    time: 'Tomorrow, 10:00 AM',
    dotColor: 'bg-mint-light',
    dotBorder: 'border-mint',
  },
  {
    subject: 'Math formula revision',
    time: 'Fri, 4:00 PM',
    dotColor: 'bg-cream-light',
    dotBorder: 'border-cream-mid',
  },
];

export function UpcomingSchedule() {
  return (
    <motion.section
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm select-none"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-ink sentence-case">
          Upcoming reviews
        </h2>
        <CalendarIcon className="w-5 h-5 text-gray-400" />
      </div>

      {/* Schedule Items List */}
      <div className="flex flex-col">
        {scheduleItems.map((item, idx) => (
          <div
            key={item.subject + idx}
            className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0 last:pb-0 first:pt-0"
          >
            {/* Left: Pastel color dot */}
            <span
              className={`w-3 h-3 rounded-full border-2 ${item.dotColor} ${item.dotBorder} shrink-0 mt-1`}
            />

            {/* Middle: Subject & Time */}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-ink leading-tight sentence-case">
                {item.subject}
              </span>
              <span className="text-xs text-gray-500 mt-1 font-medium sentence-case">
                {item.time}
              </span>
            </div>

            {/* Right: Urgent Badge */}
            {item.urgent && (
              <span className="bg-red-50 text-red-500 text-xs font-semibold px-2 py-0.5 rounded-full ml-auto whitespace-nowrap sentence-case shrink-0">
                Urgent
              </span>
            )}
          </div>
        ))}
      </div>
    </motion.section>
  );
}
