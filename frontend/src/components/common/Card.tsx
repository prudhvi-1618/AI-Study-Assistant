'use client';

import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  bg?: 'light' | 'white' | 'brand' | 'mint' | 'cream' | 'blush';
  rounded?: 'md' | 'lg' | '2xl' | '3xl';
  shadow?: boolean;
  border?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
}

const bgStyles = {
  light: 'bg-[#F7F7F5] dark:bg-gray-900',
  white: 'bg-white dark:bg-gray-800',
  brand: 'bg-brand-light dark:bg-brand-dark',
  mint: 'bg-mint-light dark:bg-mint-dark',
  cream: 'bg-cream-light dark:bg-cream-dark',
  blush: 'bg-blush-light dark:bg-blush-dark',
};

const roundedStyles = {
  md: 'rounded-md',
  lg: 'rounded-lg',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
};

const paddingStyles = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      bg = 'light',
      rounded = '2xl',
      shadow = true,
      border = true,
      padding = 'md',
      className = '',
    },
    ref
  ) => {
    const classes = `
      ${bgStyles[bg]}
      ${roundedStyles[rounded]}
      ${paddingStyles[padding]}
      ${shadow ? 'shadow-sm' : ''}
      ${border ? 'border border-gray-100 dark:border-gray-700' : ''}
      ${className}
    `;

    return (
      <div ref={ref} className={classes}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
