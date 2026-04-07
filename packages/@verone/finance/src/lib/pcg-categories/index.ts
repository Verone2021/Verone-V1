/**
 * PCG (Plan Comptable Général) — Point d'entrée unique
 * Conforme au PCG français 2025 - Classes 1 à 8
 *
 * Sources:
 * - ANC PCG 2025: https://www.anc.gouv.fr
 * - Indy: https://www.indy.fr/guide/tenue-comptable/plan-comptable/
 * - Pennylane: https://www.pennylane.com/fr/fiches-pratiques/plan-comptable/
 */

// Types
export type { PcgCategory, PcgLevel } from './pcg-types';

// Data — niveau 1
export { PCG_CLASSES } from './pcg-classes';

// Data — niveau 2
export { PCG_ACCOUNTS } from './pcg-accounts';

// Data — niveau 3 + agrégations
export {
  PCG_SUBACCOUNTS,
  ALL_PCG_CATEGORIES,
  PCG_MAP,
} from './pcg-subaccounts';

// Suggestions + legacy mapping
export {
  PCG_SUGGESTED_CATEGORIES,
  PCG_SUGGESTED_INCOME_CATEGORIES,
  LEGACY_TO_PCG_MAP,
} from './pcg-suggestions';

// Couleurs
export { PCG_TO_CATEGORY_COLOR, getPcgColor } from './pcg-colors';

// Fonctions utilitaires
export {
  getPcgCategory,
  getPcgParentClass,
  getPcgChildren,
  getPcgPath,
  getPcgFullLabel,
  migrateLegacyCategory,
  groupByPcgClass,
  getPcgCategoriesByType,
} from './pcg-utils';
