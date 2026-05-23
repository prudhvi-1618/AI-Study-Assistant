'use client';

import type { ReactElement, SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement>;
export type IconComponent = (props: IconProps) => ReactElement;

const baseProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export function ArrowRight(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function Brain(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M9 3a3 3 0 0 0-3 3v1a3 3 0 0 0 0 6v1a4 4 0 0 0 4 4h1V3H9Z" />
      <path d="M15 3a3 3 0 0 1 3 3v1a3 3 0 0 1 0 6v1a4 4 0 0 1-4 4h-1V3h2Z" />
      <path d="M8 8h3" />
      <path d="M13 8h3" />
      <path d="M8 14h3" />
      <path d="M13 14h3" />
      <path d="M12 18v3" />
    </svg>
  );
}

export function Moon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5Z" />
    </svg>
  );
}

export function Sun(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

export function Upload(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 3v12" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
    </svg>
  );
}

export function Layers(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 16 9 5 9-5" />
    </svg>
  );
}

export function CheckCircle(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  );
}

export function Check(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export function Eye(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOff(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m3 3 18 18" />
      <path d="M10.6 10.6a3 3 0 0 0 2.8 2.8" />
      <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c6.5 0 10 8 10 8a18 18 0 0 1-3.2 4.4" />
      <path d="M6.6 6.6C3.5 8.7 2 12 2 12s3.5 8 10 8a10.8 10.8 0 0 0 4.1-.8" />
    </svg>
  );
}

export function Star(props: IconProps) {
  return (
    <svg {...baseProps} {...props} fill="currentColor" strokeWidth={1.5}>
      <path d="m12 3 2.7 5.47 6.04.88-4.37 4.26 1.03 6.02L12 16.79l-5.4 2.84 1.03-6.02-4.37-4.26 6.04-.88L12 3Z" />
    </svg>
  );
}
