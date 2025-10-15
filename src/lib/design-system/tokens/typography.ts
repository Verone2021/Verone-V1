/**
 * Design System Vérone - Typography Tokens
 *
 * Échelle typographique modulaire avec ratio 1.2 (Minor Third)
 * Font stack : Inter (UI) + JetBrains Mono (Code)
 *
 * @see https://type-scale.com/
 */

export const typography = {
  /**
   * Font families
   */
  fontFamily: {
    sans: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(', '),
    mono: [
      'JetBrains Mono',
      'Menlo',
      'Monaco',
      'Consolas',
      'Liberation Mono',
      'Courier New',
      'monospace',
    ].join(', '),
  },

  /**
   * Font sizes (modular scale 1.2)
   */
  fontSize: {
    xs: '0.625rem', // 10px
    sm: '0.75rem', // 12px
    base: '0.875rem', // 14px (base pour dashboard)
    md: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
  },

  /**
   * Font weights
   */
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  /**
   * Line heights
   */
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  /**
   * Letter spacing
   */
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const

/**
 * Semantic typography pour composants
 */
export const componentTypography = {
  // KPI Cards
  kpi: {
    value: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
    },
    label: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.snug,
    },
  },

  // Buttons
  button: {
    sm: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.medium,
    },
    md: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
    },
    lg: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
    },
  },

  // Headings
  heading: {
    h1: {
      fontSize: typography.fontSize['4xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
    },
    h2: {
      fontSize: typography.fontSize['3xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
    },
    h3: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.snug,
    },
    h4: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.snug,
    },
  },

  // Body text
  body: {
    sm: {
      fontSize: typography.fontSize.sm,
      lineHeight: typography.lineHeight.normal,
    },
    base: {
      fontSize: typography.fontSize.base,
      lineHeight: typography.lineHeight.normal,
    },
    lg: {
      fontSize: typography.fontSize.md,
      lineHeight: typography.lineHeight.relaxed,
    },
  },
} as const

/**
 * Type helpers
 */
export type FontSize = keyof typeof typography.fontSize
export type FontWeight = keyof typeof typography.fontWeight
