/**
 * Design System Vérone - Color Tokens
 *
 * Palette moderne 2025 avec couleurs solides uniquement (pas de gradients).
 * Basée sur les principes d'accessibilité WCAG 2.1 AA.
 *
 * @see https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 */

export const colors = {
  /**
   * Primary - Bleu professionnel
   * Usage : Actions principales, liens, focus states
   */
  primary: {
    DEFAULT: '#3b86d1',
    50: '#e8f4fc',
    100: '#d1e9f9',
    200: '#a3d3f3',
    300: '#75bded',
    400: '#5fa3e0',
    500: '#3b86d1', // DEFAULT
    600: '#2868a8',
    700: '#1f4d7e',
    800: '#163354',
    900: '#0d1a2a',
  },

  /**
   * Success - Vert validation
   * Usage : Confirmations, états positifs, croissance
   */
  success: {
    DEFAULT: '#38ce3c',
    50: '#e8f9e8',
    100: '#d1f3d2',
    200: '#a3e7a5',
    300: '#75db78',
    400: '#5dda61',
    500: '#38ce3c', // DEFAULT
    600: '#2ca530',
    700: '#207c24',
    800: '#145318',
    900: '#08290c',
  },

  /**
   * Warning - Orange attention
   * Usage : Alertes non-critiques, états d'attente
   */
  warning: {
    DEFAULT: '#ff9b3e',
    50: '#fff4e8',
    100: '#ffe9d1',
    200: '#ffd3a3',
    300: '#ffbd75',
    400: '#ffb165',
    500: '#ff9b3e', // DEFAULT
    600: '#e67a1f',
    700: '#b35c17',
    800: '#803e0f',
    900: '#4d2007',
  },

  /**
   * Danger - Rouge critique
   * Usage : Erreurs, suppressions, états critiques
   */
  danger: {
    DEFAULT: '#ff4d6b',
    50: '#ffe8ec',
    100: '#ffd1d9',
    200: '#ffa3b3',
    300: '#ff758d',
    400: '#ff7089',
    500: '#ff4d6b', // DEFAULT
    600: '#e6244a',
    700: '#b31c39',
    800: '#801428',
    900: '#4d0c17',
  },

  /**
   * Accent - Violet créativité
   * Usage : Actions secondaires, highlights, badges
   */
  accent: {
    DEFAULT: '#844fc1',
    50: '#f2eaf9',
    100: '#e5d5f3',
    200: '#cbabe7',
    300: '#b181db',
    400: '#9f6dd0',
    500: '#844fc1', // DEFAULT
    600: '#6a3f9a',
    700: '#4f2f73',
    800: '#35204d',
    900: '#1a1026',
  },

  /**
   * Neutral - Gris interface
   * Usage : Textes, bordures, backgrounds
   */
  neutral: {
    DEFAULT: '#6c7293',
    50: '#f8f9fa',
    100: '#f1f3f5',
    200: '#e9ecef',
    300: '#dee2e6',
    400: '#ced4da',
    500: '#6c7293', // DEFAULT
    600: '#495057',
    700: '#343a40',
    800: '#212529',
    900: '#0d1117',
    950: '#020305',
  },

  /**
   * Background - Backgrounds d'application
   */
  background: {
    DEFAULT: '#ffffff',
    subtle: '#f8f9fa',
    muted: '#f1f3f5',
    hover: '#e9ecef',
  },

  /**
   * Borders - Couleurs de bordure
   */
  border: {
    DEFAULT: '#e9ecef',
    subtle: '#f1f3f5',
    strong: '#dee2e6',
  },

  /**
   * Text - Couleurs de texte
   */
  text: {
    DEFAULT: '#212529',
    subtle: '#6c7293',
    muted: '#ced4da',
    inverse: '#ffffff',
  },
} as const;

/**
 * Type helper pour autocomplete
 */
export type ColorScale = keyof typeof colors;
export type ColorShade = keyof typeof colors.primary;
