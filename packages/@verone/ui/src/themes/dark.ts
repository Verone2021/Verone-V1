/**
 * Design System Vérone - Dark Theme
 *
 * Thème sombre (futur) pour l'application
 * TODO: À implémenter selon les besoins
 */

import { colors } from '../tokens/colors';

export const darkTheme = {
  colors: {
    // Backgrounds (inversés pour dark mode)
    background: {
      primary: colors.neutral[900], // #0d1117
      secondary: colors.neutral[800], // #212529
      tertiary: colors.neutral[700], // #343a40
      hover: colors.neutral[600], // #495057
    },

    // Foregrounds (text)
    foreground: {
      primary: colors.neutral[50], // #f8f9fa
      secondary: colors.neutral[300], // #dee2e6
      tertiary: colors.neutral[400], // #ced4da
      inverse: colors.neutral[900], // #0d1117
    },

    // Borders
    border: {
      DEFAULT: colors.neutral[700], // #343a40
      subtle: colors.neutral[800], // #212529
      strong: colors.neutral[600], // #495057
    },

    // Brand colors (ajustés pour dark mode)
    primary: {
      DEFAULT: colors.primary[400],
      hover: colors.primary[300],
      active: colors.primary[200],
      subtle: colors.primary[900],
    },

    success: {
      DEFAULT: colors.success[400],
      hover: colors.success[300],
      active: colors.success[200],
      subtle: colors.success[900],
    },

    warning: {
      DEFAULT: colors.warning[400],
      hover: colors.warning[300],
      active: colors.warning[200],
      subtle: colors.warning[900],
    },

    danger: {
      DEFAULT: colors.danger[400],
      hover: colors.danger[300],
      active: colors.danger[200],
      subtle: colors.danger[900],
    },

    accent: {
      DEFAULT: colors.accent[400],
      hover: colors.accent[300],
      active: colors.accent[200],
      subtle: colors.accent[900],
    },
  },
} as const;

export type DarkTheme = typeof darkTheme;
