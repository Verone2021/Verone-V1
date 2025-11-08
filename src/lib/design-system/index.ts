/**
 * Design System Vérone - Main Export
 *
 * Architecture professionnelle 2025 :
 * - Tokens atomiques (colors, spacing, typography, shadows)
 * - Thèmes (light, dark)
 * - Utilitaires (cn, etc.)
 *
 * Usage:
 * ```ts
 * import { colors, spacing, theme, cn } from '@/lib/design-system'
 * ```
 *
 * @see https://www.designsystems.com/
 */

// Export tokens
export * from './tokens';

// Export themes
export * from './themes';

// Export utils
export * from './utils';

// Default exports for convenience
import { theme } from './themes';
import { colors } from './tokens/colors';
import { shadows } from './tokens/shadows';
import { spacing } from './tokens/spacing';
import { typography } from './tokens/typography';

export const designSystem = {
  theme,
  tokens: {
    colors,
    spacing,
    typography,
    shadows,
  },
} as const;
