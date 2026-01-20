/**
 * @verone/ui
 * Composants UI et Design System pour le monorepo Vérone
 */

// Design System (tokens, themes, utils)
export * from './design-system';
export { cn } from './design-system/utils';

// Theme V2 (backward compatibility)
export * from './theme-v2';

// UI Components - shadcn/ui base
export * from './components/ui';

// UI Components - Business specific
// TODO: export * from './components/stock'; (directory not yet created)

// UI Components - Forms
export * from './components/forms';
