/**
 * @verone/finance - Module finance pour Vérone CRM/ERP
 */

// Components
export * from './components';
export * from './components/forms';
export * from './components/buttons';
export * from './components/kpis';

// Hooks
export * from './hooks';

// Lib - PCG Categories (Plan Comptable Général)
// Note: getPcgCategory pour lookup statique, usePcgCategories pour données BDD
// Export sélectif pour éviter conflit avec hook PcgCategory
export {
  getPcgCategory,
  getPcgParentClass,
  getPcgChildren,
  getPcgColor,
  getPcgCategoriesByType,
  PCG_CLASSES,
  PCG_ACCOUNTS,
  PCG_SUBACCOUNTS,
  ALL_PCG_CATEGORIES,
  PCG_MAP,
  PCG_SUGGESTED_CATEGORIES,
  PCG_SUGGESTED_INCOME_CATEGORIES,
  PCG_TO_CATEGORY_COLOR,
} from './lib/pcg-categories';

// Lib - TVA (French VAT)
export * from './lib/tva';

// Lib - Payment Methods
export * from './lib/payment-methods';

// Services - NE PAS EXPORTER ICI
// Les services serveur contiennent du code server-only (next/headers)
// Utiliser: import { ... } from '@verone/finance/services' dans les API routes uniquement
// export * from './services';

// Utils - Ne PAS exporter ici pour éviter conflits avec hooks
// Utiliser: import { ... } from '@verone/finance/utils'
// export * from './utils';
