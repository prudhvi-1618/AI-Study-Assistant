'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      href,
      onClick,
      disabled = false,
      className = '',
      type = 'button',
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-opacity-40';

    const variantStyles = {
      primary:
        'bg-brand hover:bg-brand/90 text-white dark:bg-brand dark:hover:bg-brand/80',
      secondary:
        'border-2 border-brand text-brand hover:bg-brand/5 dark:text-brand dark:hover:bg-brand/10',
      ghost:
        'text-[#0F0F0F] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800',
    };

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    const classes = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    if (href) {
      return (
        <motion.a
          href={href}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className={classes}
          ref={ref as React.Ref<HTMLAnchorElement>}
        >
          {children}
        </motion.a>
      );
    }

    return (
      <motion.button
        type={type}
        onClick={onClick}
        disabled={disabled}
        whileHover={disabled ? undefined : { scale: 1.02 }}
        whileTap={disabled ? undefined : { scale: 0.97 }}
        className={`${classes} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} transition-all duration-200`}
        ref={ref as React.Ref<HTMLButtonElement>}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
