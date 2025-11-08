/**
 * Composants UI Unifiés - Design System V2
 *
 * Point d'entrée centralisé pour tous les composants génériques unifiés.
 * Remplace les composants legacy dupliqués.
 *
 * @see /docs/audits/2025-11/ARCHITECTURE-COMPOSANTS-GENERIQUES-V2.md
 * @see /docs/audits/2025-11/GUIDE-DESIGN-SYSTEM-V2.md
 */

export {
  ButtonUnified,
  buttonVariants,
  type ButtonUnifiedProps,
} from '../button-unified';

export {
  KPICardUnified,
  type KPICardUnifiedProps,
} from '../kpi-card-unified';

// Alias pour compatibilité progressive
export { ButtonUnified as Button } from '../button-unified';
export { KPICardUnified as KPICard } from '../kpi-card-unified';
