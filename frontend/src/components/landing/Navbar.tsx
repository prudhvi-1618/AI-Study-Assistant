'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Moon, Sun } from '@/components/common/Icons';
import { Button } from '@/components/common/Button';
import { useTheme } from '@/providers/ThemeProvider';

export const Navbar = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full backdrop-blur-sm bg-white/80 dark:bg-[#0F0F0F]/80 border-b border-gray-100 dark:border-gray-700"
    >
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Brain className="w-8 h-8 text-brand" />
          <span className="font-geist font-extrabold text-xl text-ink dark:text-white">
            StudyAI
          </span>
        </motion.div>

        {/* Right side: Theme toggle + Auth buttons */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Dark mode toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-ink dark:text-white"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </motion.button>

          {/* Sign in button */}
          <Button variant="ghost" size="sm" href="/login">
            Sign in
          </Button>

          {/* Get started button */}
          <Button variant="primary" size="sm" href="/register">
            Get started
          </Button>
        </div>
      </div>
    </motion.nav>
  );
};
