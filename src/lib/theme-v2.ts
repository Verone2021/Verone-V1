/**
 * Vérone Modern 2025 - Design System V2
 * Palette de couleurs et design tokens pour dashboard moderne
 * Inspiré des best practices Odoo, Figma, Dribbble 2025
 */

export const themeV2 = {
  // Palette principale
  colors: {
    // Primary - Bleu confiance (navigation, liens, actions principales)
    primary: {
      DEFAULT: '#3b86d1',
      light: '#5fa3e0',
      dark: '#2868a8',
      50: '#e8f4fc',
      100: '#d1e9f9',
      500: '#3b86d1',
      700: '#2868a8',
      900: '#1a4875',
    },

    // Success - Vert croissance (validations, succès, croissance positive)
    success: {
      DEFAULT: '#38ce3c',
      light: '#5dda61',
      dark: '#2aa52d',
      50: '#e9faea',
      100: '#d3f5d4',
      500: '#38ce3c',
      700: '#2aa52d',
      900: '#1c7820',
    },

    // Warning - Orange doux (alertes modérées, attention)
    warning: {
      DEFAULT: '#ff9b3e',
      light: '#ffb165',
      dark: '#e6842d',
      50: '#fff5eb',
      100: '#ffebd7',
      500: '#ff9b3e',
      700: '#e6842d',
      900: '#b3651f',
    },

    // Accent - Violet créatif (actions importantes, highlights)
    accent: {
      DEFAULT: '#844fc1',
      light: '#9f6dd0',
      dark: '#6b3d9f',
      50: '#f3edf9',
      100: '#e7dbf3',
      500: '#844fc1',
      700: '#6b3d9f',
      900: '#4f2c74',
    },

    // Danger - Rouge (erreurs, alertes critiques)
    danger: {
      DEFAULT: '#ff4d6b',
      light: '#ff7089',
      dark: '#e63854',
      50: '#ffebef',
      100: '#ffd7df',
      500: '#ff4d6b',
      700: '#e63854',
      900: '#b32a40',
    },

    // Neutral - Slate (textes, bordures, backgrounds)
    neutral: {
      DEFAULT: '#6c7293',
      50: '#f8f9fa',
      100: '#e9ecef',
      200: '#dee2e6',
      300: '#ced4da',
      400: '#adb5bd',
      500: '#6c7293',
      600: '#495057',
      700: '#343a40',
      800: '#212529',
      900: '#181824',
    },
  },

  // Spacing pour composants compacts
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '0.75rem', // 12px
    lg: '1rem', // 16px
    xl: '1.5rem', // 24px
    '2xl': '2rem', // 32px
  },

  // Tailles de texte ultra-compactes
  fontSize: {
    xxs: '0.625rem', // 10px
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
  },

  // Heights pour composants
  heights: {
    kpiCard: '40px',
    actionButton: '80px',
    header: '60px',
    section: '50px',
  },

  // Border radius
  borderRadius: {
    sm: '0.375rem', // 6px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },

  // Shadows pour depth
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  // Transitions
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    DEFAULT: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const

// Type-safe color helpers
export type ThemeColor = keyof typeof themeV2.colors

export const getColor = (color: ThemeColor, shade: number | 'DEFAULT' | 'light' | 'dark' = 'DEFAULT') => {
  const colorObj = themeV2.colors[color]
  if (typeof colorObj === 'object' && shade in colorObj) {
    return colorObj[shade as keyof typeof colorObj]
  }
  return colorObj as string
}

// Utility: Generate gradient
export const getGradient = (from: string, to: string, direction: string = 'to right') => {
  return `linear-gradient(${direction}, ${from}, ${to})`
}

// Pre-defined gradients pour ActionButtons
export const gradients = {
  blue: getGradient('#3b86d1', '#5fa3e0'),
  green: getGradient('#38ce3c', '#5dda61'),
  orange: getGradient('#ff9b3e', '#ffb165'),
  purple: getGradient('#844fc1', '#9f6dd0'),
  red: getGradient('#ff4d6b', '#ff7089'),
  blueGreen: getGradient('#3b86d1', '#38ce3c'),
  purpleBlue: getGradient('#844fc1', '#3b86d1'),
  orangeRed: getGradient('#ff9b3e', '#ff4d6b'),
} as const

export type GradientType = keyof typeof gradients
