/**
 * @verone/ui - Composants UI shadcn/Radix + Custom Vérone
 *
 * Composants UI complets pour le monorepo Vérone
 * Basés sur shadcn/ui + Radix UI + Tailwind CSS + Custom Design System V2
 */

// ========================================
// BUTTON COMPONENTS
// ========================================
export * from './button-unified';
export * from './icon-button';
// Export ButtonV2 (Design System V2 - BLEU #3b86d1) + alias Button
export {
  Button,
  ButtonV2,
  type ButtonProps,
  type ButtonV2Props,
} from './button';
// Composants supprimés (non utilisés) : action-button, modern-action-button, standard-modify-button

// ========================================
// FORM COMPONENTS
// ========================================
export * from './input';
export * from './textarea';
export * from './label';
export * from './form';
export * from './select';
export * from './checkbox';
export * from './radio-group';
export * from './switch';
export * from './slider';

// ========================================
// LAYOUT COMPONENTS
// ========================================
export * from './card';
export * from './verone-card';
export * from './separator';
export * from './accordion';
export * from './collapsible';
export * from './tabs';
export * from './tabs-navigation';
export * from './sidebar';
export * from './breadcrumb';
export * from './scroll-area';
export * from './table';

// ========================================
// FEEDBACK COMPONENTS
// ========================================
export * from './alert';
export * from './alert-dialog';
export * from './confirm-dialog';
export * from './error-state-card';
export * from './skeleton';
export * from './badge';
export * from './data-status-badge';
export * from './role-badge';
export * from './stat-pill';
// DISABLED: Dépend de @/lib/feature-flags non disponible dans @verone/ui
// export * from './phase-indicator';
export * from './progress';
export * from './activity-timeline';

// ========================================
// USER COMPONENTS
// ========================================
export * from './avatar';

// ========================================
// OVERLAY COMPONENTS
// ========================================
export * from './dialog';
export * from './sheet';
export * from './popover';
export * from './dropdown-menu';
export * from './tooltip';
export * from './notification-system';

// ========================================
// COMMAND COMPONENTS
// ========================================
export * from './combobox';
export * from './command';
export * from './command-palette';

// ========================================
// DATE COMPONENTS
// ========================================
export * from './calendar';

// ========================================
// KPI & METRICS COMPONENTS
// ========================================
export * from './kpi-card-unified';
// Composants supprimés (non utilisés) : compact-kpi-card, medium-kpi-card, elegant-kpi-card

// ========================================
// NAVIGATION COMPONENTS
// ========================================
export * from './group-navigation';
export * from './pagination';
export * from './view-mode-toggle';

// ========================================
// ACTION COMPONENTS
// ========================================
export * from './quick-actions-list';
export * from './compact-quick-actions';

// ========================================
// UPLOAD COMPONENTS
// ========================================
export * from './image-upload-zone';

// ========================================
// CUSTOM COMPONENTS
// ========================================
export * from './room-multi-select';
// phase-indicator déplacé vers apps/back-office/src/components/ui/

// ========================================
// HELP & ONBOARDING COMPONENTS
// ========================================
export * from './help-lexique-section';

// ========================================
// ADDRESS COMPONENTS
// ========================================
export * from './address-autocomplete';
