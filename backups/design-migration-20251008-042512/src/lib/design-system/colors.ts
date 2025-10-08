/**
 * 🎨 Design System Vérone - Couleurs Autorisées UNIQUEMENT
 *
 * RÈGLE ABSOLUE : Noir (#000000) + Blanc (#FFFFFF) + Gris (#666666 et nuances)
 * ❌ INTERDIT : Jaune, Ambre, Orange, Doré - AUCUNE nuance
 *
 * Date: 8 Octobre 2025
 * Conformité: Charte graphique Vérone officielle
 */

/**
 * Palette principale Vérone (UNIQUEMENT noir/blanc/gris)
 */
export const veroneColors = {
  // Couleurs signature Vérone
  primary: {
    black: '#000000',
    white: '#FFFFFF',
    gray: '#666666'
  },

  // Nuances de gris (Tailwind gray scale)
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  },

  // États système (couleurs fonctionnelles UNIQUEMENT)
  system: {
    success: '#10b981',  // Vert - validations OK
    error: '#ef4444',    // Rouge - erreurs système
    info: '#3b82f6',     // Bleu - informations
    // ❌ PAS de warning en jaune/orange/amber !
    warning: '#000000'   // NOIR pour warnings (Design Vérone)
  }
} as const

/**
 * Classes Tailwind pour statuts produits (noir/blanc/gris UNIQUEMENT)
 */
export const statusColors = {
  // Statuts produits
  draft: 'bg-gray-100 text-gray-800 border-gray-300',
  active: 'bg-black text-white border-black',
  archived: 'bg-white text-gray-600 border-gray-400',
  pending: 'bg-gray-200 text-gray-900 border-gray-400',
  published: 'bg-black text-white border-black',
  discontinued: 'bg-gray-300 text-gray-700 border-gray-500',

  // Statuts stocks (gris uniquement, pas orange/yellow)
  'in-stock': 'bg-white text-gray-900 border-gray-400',
  'low-stock': 'bg-gray-100 text-gray-900 border-gray-400',
  'out-of-stock': 'bg-gray-200 text-gray-900 border-gray-500',
  'critical': 'bg-black text-white border-black',

  // Statuts commandes (sans couleurs chaudes)
  'order-pending': 'bg-gray-100 text-gray-800 border-gray-300',
  'order-confirmed': 'bg-black text-white border-black',
  'order-shipped': 'bg-gray-700 text-white border-gray-700',
  'order-delivered': 'bg-white text-gray-900 border-gray-400',

  // Statuts échantillons (conformes)
  'sample-required': 'bg-black text-white border-black',
  'sample-ordered': 'bg-gray-100 text-gray-800 border-gray-300',
  'sample-received': 'bg-white text-gray-900 border-gray-400',
  'sample-approved': 'bg-gray-900 text-white border-gray-900'
} as const

/**
 * Classes Tailwind pour badges (palette conforme)
 */
export const badgeColors = {
  default: 'bg-gray-100 text-gray-800 border-gray-300',
  primary: 'bg-black text-white border-black',
  secondary: 'bg-white text-black border-black',
  outline: 'bg-transparent text-black border-black',
  ghost: 'bg-transparent text-gray-700 border-transparent',

  // ❌ SUPPRIMÉ : warning, alert, caution (étaient en jaune/orange)
  // ✅ REMPLACÉ par variants noir/gris
  important: 'bg-black text-white border-black',
  info: 'bg-gray-100 text-gray-900 border-gray-300',
  subtle: 'bg-gray-50 text-gray-700 border-gray-200'
} as const

/**
 * Classes pour icônes et indicateurs visuels
 */
export const iconColors = {
  // Icônes normales (gris)
  default: 'text-gray-600',
  muted: 'text-gray-400',
  dark: 'text-gray-900',
  light: 'text-gray-300',

  // Icônes système (couleurs fonctionnelles uniquement)
  success: 'text-green-600',
  error: 'text-red-600',
  info: 'text-blue-600',
  // ❌ PAS de warning en orange/yellow
  warning: 'text-black',  // Noir pour warnings

  // Icônes interactives
  interactive: 'text-black hover:text-gray-700',
  disabled: 'text-gray-300'
} as const

/**
 * Classes pour indicateurs de niveau de stock
 * Remplace les couleurs orange/yellow par gris progressifs
 */
export const stockLevelColors = {
  critical: {
    text: 'text-black',
    bg: 'bg-black',
    border: 'border-black',
    label: 'Critique'
  },
  low: {
    text: 'text-gray-700',
    bg: 'bg-gray-100',
    border: 'border-gray-400',
    label: 'Faible'
  },
  normal: {
    text: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    label: 'Normal'
  },
  high: {
    text: 'text-gray-800',
    bg: 'bg-white',
    border: 'border-gray-200',
    label: 'Élevé'
  }
} as const

/**
 * Classes pour alertes système (sans orange/yellow)
 */
export const alertColors = {
  info: 'bg-white text-black border-2 border-black',
  success: 'bg-white text-green-700 border-2 border-green-600',
  error: 'bg-white text-red-700 border-2 border-red-600',
  // ❌ SUPPRIMÉ : warning en orange/yellow
  // ✅ WARNING en noir (Design Vérone)
  warning: 'bg-black text-white border-2 border-black'
} as const

/**
 * Helper: Obtenir couleur conforme Vérone selon intention
 */
export function getVeroneColor(intent: 'success' | 'error' | 'info' | 'warning' | 'default'): string {
  switch (intent) {
    case 'success':
      return veroneColors.system.success
    case 'error':
      return veroneColors.system.error
    case 'info':
      return veroneColors.system.info
    case 'warning':
      // ❌ PAS de jaune/orange pour warnings !
      // ✅ Noir (signature Vérone)
      return veroneColors.system.warning
    case 'default':
      return veroneColors.primary.black
  }
}

/**
 * Helper: Obtenir classe Tailwind texte selon intention
 */
export function getVeroneTextClass(intent: 'success' | 'error' | 'info' | 'warning' | 'default'): string {
  switch (intent) {
    case 'success':
      return 'text-green-600'
    case 'error':
      return 'text-red-600'
    case 'info':
      return 'text-blue-600'
    case 'warning':
      // ❌ PAS text-orange ou text-yellow
      return 'text-black'
    case 'default':
      return 'text-gray-900'
  }
}

/**
 * Helper: Obtenir classe Tailwind background selon intention
 */
export function getVeroneBgClass(intent: 'success' | 'error' | 'info' | 'warning' | 'default'): string {
  switch (intent) {
    case 'success':
      return 'bg-green-50'
    case 'error':
      return 'bg-red-50'
    case 'info':
      return 'bg-blue-50'
    case 'warning':
      // ❌ PAS bg-orange ou bg-yellow
      return 'bg-gray-100'
    case 'default':
      return 'bg-gray-50'
  }
}

/**
 * Helper: Obtenir status stock avec couleurs conformes
 */
export function getStockStatus(quantity: number, minLevel: number = 10): {
  level: keyof typeof stockLevelColors
  color: string
  label: string
} {
  if (quantity <= 0) {
    return {
      level: 'critical',
      color: stockLevelColors.critical.text,
      label: stockLevelColors.critical.label
    }
  }

  if (quantity <= minLevel) {
    return {
      level: 'critical',
      color: stockLevelColors.critical.text,
      label: stockLevelColors.critical.label
    }
  }

  if (quantity <= minLevel * 2) {
    // ❌ Avant: text-yellow-600 (interdit)
    // ✅ Maintenant: text-gray-700
    return {
      level: 'low',
      color: stockLevelColors.low.text,
      label: stockLevelColors.low.label
    }
  }

  if (quantity <= minLevel * 5) {
    return {
      level: 'normal',
      color: stockLevelColors.normal.text,
      label: stockLevelColors.normal.label
    }
  }

  return {
    level: 'high',
    color: stockLevelColors.high.text,
    label: stockLevelColors.high.label
  }
}

/**
 * Type pour contrôle TypeScript strict
 */
export type VeroneColorIntent = 'success' | 'error' | 'info' | 'warning' | 'default'
export type VeroneStatusType = keyof typeof statusColors
export type VeroneBadgeType = keyof typeof badgeColors
export type VeroneStockLevel = keyof typeof stockLevelColors

/**
 * Export centralisé
 */
export const veroneDesignSystem = {
  colors: veroneColors,
  status: statusColors,
  badges: badgeColors,
  icons: iconColors,
  alerts: alertColors,
  stock: stockLevelColors,
  helpers: {
    getColor: getVeroneColor,
    getTextClass: getVeroneTextClass,
    getBgClass: getVeroneBgClass,
    getStockStatus
  }
} as const

export default veroneDesignSystem
