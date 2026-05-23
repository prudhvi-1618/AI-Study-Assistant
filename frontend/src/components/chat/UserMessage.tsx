'use client';

import React from 'react';
import { Message } from '@/lib/stream';
import { motion } from 'framer-motion';

interface UserMessageProps {
  message: Message;
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex justify-end select-text"
    >
      <div className="max-w-[85%] md:max-w-2xl bg-brand text-white rounded-[24px] rounded-br-md px-5 py-4 shadow-sm">
        <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
          {message.content}
        </p>
        <span className="text-[11px] text-white/70 mt-2 block text-right font-medium select-none">
          {message.timestamp}
        </span>
      </div>
    </motion.div>
  );
}
