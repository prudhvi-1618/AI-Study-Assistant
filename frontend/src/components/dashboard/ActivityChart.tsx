'use client';

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

interface ChartDataPoint {
  day: string;
  hours: number;
}

const data: ChartDataPoint[] = [
  { day: 'Mon', hours: 1.5 },
  { day: 'Tue', hours: 2.5 },
  { day: 'Wed', hours: 0.5 },
  { day: 'Thu', hours: 3.0 },
  { day: 'Fri', hours: 2.0 },
  { day: 'Sat', hours: 1.0 },
  { day: 'Sun', hours: 0 },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-ink text-white text-xs font-bold px-2 py-1.5 rounded-lg shadow-sm border-none select-none">
        {payload[0].value.toFixed(1)} hrs
      </div>
    );
  }
  return null;
};

export function ActivityChart() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <motion.section
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-6 select-none"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-ink sentence-case">
          Study activity
        </h2>
        <select
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer"
          defaultValue="week"
        >
          <option value="week">This week</option>
          <option value="month">This month</option>
        </select>
      </div>

      {/* Chart container */}
      <div className="h-40 w-full relative">
        {!mounted ? (
          <div className="absolute inset-0 bg-gray-50/50 animate-pulse rounded-xl flex items-center justify-center text-xs text-gray-400">
            Loading chart...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              {/* Axes config: minimal */}
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 500 }}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis hide domain={[0, 'dataMax + 0.5']} />
              
              {/* Custom Tooltip */}
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'transparent' }}
                offset={10}
              />

              {/* Bar config: rounded, with conditional colors, minPointSize for zero value bars */}
              <Bar
                dataKey="hours"
                radius={[6, 6, 0, 0]}
                barSize={32}
                minPointSize={6}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.hours > 0 ? '#7C71F0' : '#E9E5FF'} // Brand purple for active, Lavender for zero
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.section>
  );
}
