'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentDocuments } from '@/components/dashboard/RecentDocuments';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { ContinueCard } from '@/components/dashboard/ContinueCard';
import { UpcomingSchedule } from '@/components/dashboard/UpcomingSchedule';
import { BottomNav } from '@/components/dashboard/BottomNav';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-surface">
        {/* Responsive Sidebar (hidden on mobile, collapsed on tablet, full on desktop) */}
        <Sidebar />

        {/* Main Content Area */}
        <motion.main
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="md:ml-16 lg:ml-60 px-4 md:px-6 lg:px-8 py-6 pb-24 md:pb-6"
        >
          <motion.div variants={itemVariants}>
            <Header />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <StatsGrid />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <QuickActions />
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column: Recent Docs, Activity Chart, Continue Card */}
            <div className="xl:col-span-2 space-y-6">
              <motion.div variants={itemVariants}>
                <RecentDocuments />
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <ActivityChart />
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <ContinueCard />
              </motion.div>
            </div>

            {/* Right Column: Upcoming Reviews */}
            <div className="space-y-6">
              <motion.div variants={itemVariants}>
                <UpcomingSchedule />
              </motion.div>
            </div>
          </div>
        </motion.main>

        {/* Sticky Bottom Nav (visible on mobile only) */}
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
