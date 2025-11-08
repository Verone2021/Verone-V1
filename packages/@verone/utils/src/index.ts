/**
 * @verone/utils
 * Utilitaires et helpers partagés pour le monorepo Vérone
 */

// ========================================
// CORE UTILS
// ========================================

// Fonction cn (classnames utility)
export { cn } from './cn';

// Utilitaires business depuis utils.ts (SAUF validateEmail car doublon avec validation/)
export {
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
  formatDate,
  calculateDiscountPercentage,
  applyDiscount,
  formatCurrency,
  formatDateShort,
} from './utils';

// Logger
export * from './logger';

// Excel utils
export * from './excel-utils';

// PDF utils
export * from './pdf-utils';

// Organisation helpers
export * from './utils/organisation-helpers';

// ========================================
// VALIDATION
// ========================================

// NOTE: validation/ n'est pas exporté depuis l'index principal à cause de doublons
// Utiliser: import { ... } from '@verone/utils/validation'

// ========================================
// UPLOAD
// ========================================

// NOTE: upload/validation n'est pas exporté depuis l'index principal à cause de doublons
// Utiliser: import { ... } from '@verone/utils/upload'
export * from './upload/supabase-utils';
export * from './upload/upload-performance-monitor';
export * from './upload/image-optimization';

// ========================================
// SUPABASE
// ========================================

export { createClient } from './supabase';
export * from './supabase/types';
export * from './supabase/client';

// ⚠️ NE PAS exporter './supabase/server' depuis l'index principal
// car il utilise 'next/headers' qui ne fonctionne que côté serveur.
// Utilisez: import { createServerClient } from '@verone/utils/supabase/server'
// export * from './supabase/server'; // ❌ DÉSACTIVÉ

// ========================================
// EXPORT / REPORTS
// ========================================

export * from './export/csv';
export * from './reports/export-aging-report';
