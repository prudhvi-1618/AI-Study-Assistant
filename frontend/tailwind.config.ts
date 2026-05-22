import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7C71F0',
          light: '#E9E5FF',
          dark: '#2A1D6E',
        },
        mint: {
          DEFAULT: '#7DD9B3',
          light: '#D1FAE5',
          dark: '#065F46',
        },
        cream: {
          DEFAULT: '#FDE68A',
          light: '#FEF9C3',
          dark: '#78350F',
        },
        blush: {
          DEFAULT: '#F9A8D4',
          light: '#FCE7F3',
          dark: '#831843',
        },
        ink: '#0F0F0F',
        surface: '#F7F7F5',
      },
      fontFamily: {
        geist: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        inter: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Heading sizes
        h1: ['4rem', { lineHeight: '1.1', fontWeight: '800' }], // text-6xl
        'h1-lg': ['5rem', { lineHeight: '1.05', fontWeight: '800' }], // text-8xl
        h2: ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }], // text-4xl
        h3: ['1.875rem', { lineHeight: '1.2', fontWeight: '700' }], // text-3xl
        h4: ['1.5rem', { lineHeight: '1.3', fontWeight: '700' }], // text-2xl
        h5: ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }], // text-xl
        h6: ['1rem', { lineHeight: '1.4', fontWeight: '600' }], // text-base
      },
      borderRadius: {
        card: '1.5rem', // rounded-2xl
        button: '1.5rem', // rounded-2xl
        lg: '1.5rem', // rounded-2xl
        '3xl': '1.875rem', // rounded-3xl
      },
      spacing: {
        // Standard gaps for cards
        gap: {
          3: '0.75rem',
          4: '1rem',
          5: '1.25rem',
          6: '1.5rem',
        },
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      keyframes: {
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(1.25rem)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideInLeft: {
          '0%': {
            opacity: '0',
            transform: 'translateX(-1.25rem)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        slideInRight: {
          '0%': {
            opacity: '0',
            transform: 'translateX(1.25rem)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.4s ease-out',
        slideInLeft: 'slideInLeft 0.4s ease-out',
        slideInRight: 'slideInRight 0.4s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
