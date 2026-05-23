'use client';

import React, { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'brand' | 'mint' | 'cream' | 'blush' | 'gray';
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles = {
  brand: 'bg-brand-light text-brand-dark dark:bg-brand-dark dark:text-brand-light',
  mint: 'bg-mint-light text-mint-dark dark:bg-mint-dark dark:text-mint-light',
  cream: 'bg-cream-light text-cream-dark dark:bg-cream-dark dark:text-cream-light',
  blush: 'bg-blush-light text-blush-dark dark:bg-blush-dark dark:text-blush-light',
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

const sizeStyles = {
  sm: 'px-3 py-1 text-xs font-medium',
  md: 'px-4 py-1.5 text-sm font-medium',
};

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ children, variant = 'brand', size = 'md', className = '' }, ref) => {
    const classes = `
      inline-flex items-center justify-center
      rounded-full
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${className}
    `;

    return (
      <div ref={ref} className={classes}>
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';
