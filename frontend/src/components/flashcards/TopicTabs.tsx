'use client';

import React from 'react';

interface TopicTabsProps {
  topics: string[];
  activeTopic: string;
  onSelectTopic: (topic: string) => void;
}

export function TopicTabs({ topics, activeTopic, onSelectTopic }: TopicTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1.5 px-4 md:px-6 mt-2 scrollbar-hide select-none">
      {topics.map((topic) => {
        const isActive = topic === activeTopic;

        return (
          <button
            key={topic}
            onClick={() => onSelectTopic(topic)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              isActive
                ? 'bg-ink text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:text-ink hover:bg-gray-50'
            }`}
            type="button"
          >
            <span className="sentence-case">{topic}</span>
          </button>
        );
      })}
    </div>
  );
}
