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
// Export sélectif de Button sans buttonVariants (conflit)
export { Button, ButtonV2, type ButtonV2Props } from './button';
export * from './action-button';
export * from './modern-action-button';
export * from './standard-modify-button';

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
// OVERLAY COMPONENTS
// ========================================
export * from './dialog';
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
export * from './compact-kpi-card';
export * from './medium-kpi-card';
export * from './elegant-kpi-card';

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
export * from './phase-indicator';
