/**
 * @verone/orders - Module orders pour Vérone CRM/ERP
 */

// Components
export * from './components/tables';
export * from './components/sections';
export * from './components/forms';
export * from './components/charts';
export * from './components/modals';
export type * from './components/shipments';

// SalesOrdersTable - Composant réutilisable pour toutes les pages commandes
export { SalesOrdersTable } from './components/SalesOrdersTable';
export type { SalesOrdersTableProps } from './components/SalesOrdersTable';

// Types
export * from './types/advanced-filters';

// Hooks
export * from './hooks';

// Lib (LinkMe orders - shared between CMS and Front)
export * from './lib';
