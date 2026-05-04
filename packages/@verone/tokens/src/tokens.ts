/**
 * Export TypeScript des design tokens Vérone (dérivé de tokens.json).
 * Source: W3C Design Tokens format — @see tokens.json
 *
 * Usage:
 * import { spacing, breakpoints, motionDuration, motionEasing, zIndex } from '@verone/tokens';
 */

// Spacing scale (rem) — aligné sur scale Tailwind CSS
export const spacing = {
  0: '0rem',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  6: '1.5rem',
  8: '2rem',
  12: '3rem',
  16: '4rem',
  24: '6rem',
  32: '8rem',
} as const;

// Breakpoints (px) — source unique, alignée avec use-breakpoint.ts de @verone/hooks
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Durées d'animation
export const motionDuration = {
  instant: '0ms',
  fast: '150ms',
  normal: '250ms',
  slow: '400ms',
} as const;

// Courbes d'accélération (valeurs CSS cubic-bezier)
export const motionEasing = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

// Z-index scale
export const zIndex = {
  dropdown: 10,
  sticky: 20,
  modal: 50,
  toast: 60,
} as const;

// Types utilitaires
export type SpacingScale = typeof spacing;
export type SpacingKey = keyof SpacingScale;
export type BreakpointKey = keyof typeof breakpoints;
export type MotionDurationKey = keyof typeof motionDuration;
export type MotionEasingKey = keyof typeof motionEasing;
export type ZIndexKey = keyof typeof zIndex;
