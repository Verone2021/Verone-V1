/**
 * @verone/orders - Module orders pour Vérone CRM/ERP
 */

// Components
export * from './components/tables';
export * from './components/sections';
export * from './components/forms';
export * from './components/charts';
export * from './components/modals';
export * from './components/linkme-contacts';
export type * from './components/shipments';

// SalesOrdersTable - Composant réutilisable pour toutes les pages commandes
export { SalesOrdersTable } from './components/sales-orders-table';
export type { SalesOrdersTableProps } from './components/sales-orders-table';

// OrderTimeline - Timeline historique commandes
export { OrderTimeline } from './components/OrderTimeline';

// Types
export * from './types/advanced-filters';

// Hooks
export * from './hooks';

// Validators
export { isOrderLocked, canEditItems } from './validators/order-status';

// Lib (LinkMe orders - shared between CMS and Front)
export * from './lib';
