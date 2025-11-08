/**
 * Design System Vérone - Light Theme
 *
 * Thème clair (défaut) pour l'application
 */

import { colors } from '../tokens/colors';

export const lightTheme = {
  colors: {
    // Backgrounds
    background: {
      primary: colors.background.DEFAULT, // #ffffff
      secondary: colors.background.subtle, // #f8f9fa
      tertiary: colors.background.muted, // #f1f3f5
      hover: colors.background.hover, // #e9ecef
    },

    // Foregrounds (text)
    foreground: {
      primary: colors.text.DEFAULT, // #212529
      secondary: colors.text.subtle, // #6c7293
      tertiary: colors.text.muted, // #ced4da
      inverse: colors.text.inverse, // #ffffff
    },

    // Borders
    border: {
      DEFAULT: colors.border.DEFAULT, // #e9ecef
      subtle: colors.border.subtle, // #f1f3f5
      strong: colors.border.strong, // #dee2e6
    },

    // Brand colors (solid, no gradients)
    primary: {
      DEFAULT: colors.primary.DEFAULT,
      hover: colors.primary[600],
      active: colors.primary[700],
      subtle: colors.primary[50],
    },

    success: {
      DEFAULT: colors.success.DEFAULT,
      hover: colors.success[600],
      active: colors.success[700],
      subtle: colors.success[50],
    },

    warning: {
      DEFAULT: colors.warning.DEFAULT,
      hover: colors.warning[600],
      active: colors.warning[700],
      subtle: colors.warning[50],
    },

    danger: {
      DEFAULT: colors.danger.DEFAULT,
      hover: colors.danger[600],
      active: colors.danger[700],
      subtle: colors.danger[50],
    },

    accent: {
      DEFAULT: colors.accent.DEFAULT,
      hover: colors.accent[600],
      active: colors.accent[700],
      subtle: colors.accent[50],
    },
  },
} as const;

export type LightTheme = typeof lightTheme;
