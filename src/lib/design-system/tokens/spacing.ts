/**
 * Design System Vérone - Spacing Tokens
 *
 * Échelle d'espacement basée sur 4px (0.25rem)
 * Scale harmonique : 4, 8, 12, 16, 24, 32, 48, 64, 96, 128
 *
 * @see https://tailwindcss.com/docs/customizing-spacing
 */

export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  11: '2.75rem', // 44px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  15: '3.75rem', // 60px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
  40: '10rem', // 160px
  44: '11rem', // 176px
  48: '12rem', // 192px
  52: '13rem', // 208px
  56: '14rem', // 224px
  60: '15rem', // 240px
  64: '16rem', // 256px
  72: '18rem', // 288px
  80: '20rem', // 320px
  96: '24rem', // 384px
} as const;

/**
 * Semantic spacing pour composants communs
 */
export const componentSpacing = {
  // Padding interne composants
  buttonPadding: {
    sm: `${spacing[2]} ${spacing[3]}`, // 8px 12px
    md: `${spacing[2.5]} ${spacing[4]}`, // 10px 16px
    lg: `${spacing[3]} ${spacing[6]}`, // 12px 24px
  },

  // Hauteurs fixes composants
  heights: {
    input: spacing[10], // 40px
    button: spacing[10], // 40px
    kpiCard: '65px', // Nouvelle hauteur KPI (vs 40px précédent)
    actionButton: spacing[15], // 60px (vs 80px précédent)
    header: spacing[15], // 60px
  },

  // Gaps entre éléments
  gaps: {
    xs: spacing[1], // 4px
    sm: spacing[2], // 8px
    md: spacing[3], // 12px
    lg: spacing[4], // 16px
    xl: spacing[6], // 24px
  },
} as const;

/**
 * Type helpers
 */
export type SpacingScale = keyof typeof spacing;
export type ComponentSpacing = keyof typeof componentSpacing;
