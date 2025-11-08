/**
 * Design System Vérone - Shadow Tokens
 *
 * Élévations progressives pour profondeur visuelle
 * Basé sur Material Design elevation system
 *
 * @see https://m3.material.io/styles/elevation/overview
 */

export const shadows = {
  /**
   * Aucune ombre (z-index: 0)
   */
  none: 'none',

  /**
   * Élévation subtile (z-index: 1)
   * Usage : Hover states, inputs
   */
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',

  /**
   * Élévation par défaut (z-index: 2)
   * Usage : Cards, buttons, dropdowns
   */
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',

  /**
   * Élévation médium (z-index: 3)
   * Usage : Popovers, tooltips
   */
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',

  /**
   * Élévation large (z-index: 4)
   * Usage : Modals, drawers
   */
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',

  /**
   * Élévation XL (z-index: 5)
   * Usage : Overlays, dialogs
   */
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',

  /**
   * Élévation 2XL (z-index: 6)
   * Usage : Notifications, toasts
   */
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',

  /**
   * Ombre interne
   * Usage : Inputs, wells
   */
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const;

/**
 * Semantic shadows pour composants
 */
export const componentShadows = {
  card: shadows.sm,
  cardHover: shadows.md,
  button: shadows.sm,
  buttonHover: shadows.DEFAULT,
  dropdown: shadows.lg,
  modal: shadows.xl,
  toast: shadows['2xl'],
  input: shadows.none,
  inputFocus: shadows.sm,
} as const;

/**
 * Type helpers
 */
export type ShadowScale = keyof typeof shadows;
export type ComponentShadow = keyof typeof componentShadows;
