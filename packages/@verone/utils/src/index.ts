/**
 * @verone/utils
 * Utilitaires et helpers partagés
 */

// Export toutes les fonctions utilitaires
export {
  cn,
  formatPrice,
  formatPriceFromCents,
  generateSKU,
  validateSKU,
  formatWeight,
  formatDimensions,
  statusConfig,
  checkSLOCompliance,
  debounce,
  generateSlug,
  validateEmail,
  formatDate,
  calculateDiscountPercentage,
  applyDiscount,
  formatCurrency,
  formatDateShort,
} from './cn';

// Supabase client
export { createClient } from './supabase';
