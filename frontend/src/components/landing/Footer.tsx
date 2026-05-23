'use client';

import React from 'react';
import { Brain } from '@/components/common/Icons';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0F0F0F] dark:bg-white text-white dark:text-[#0F0F0F] border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-12">
        {/* Footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo & Tagline */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-6 h-6 text-brand" />
              <span className="font-geist font-extrabold text-lg">StudyAI</span>
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-600">
              Master every topic with AI-powered learning.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-geist font-bold text-base mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="hover:text-brand transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-brand transition-colors"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-brand transition-colors"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-geist font-bold text-base mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="hover:text-brand transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-brand transition-colors"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-brand transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-geist font-bold text-base mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="hover:text-brand transition-colors"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-brand transition-colors"
                >
                  Terms
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-brand transition-colors"
                >
                  Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 dark:border-gray-300 pt-8">
          <p className="text-sm text-gray-400 dark:text-gray-600 text-center">
            &copy; {currentYear} StudyAI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
