// Stock hooks barrel exports
export * from './use-stock-alerts';
export * from './use-stock-alerts-count';
export * from './use-stock-analytics';
export * from './use-stock-inventory';
export * from './use-stock-optimized';
export * from './use-stock-orders-metrics';
export * from './use-stock-reservations';
export * from './use-stock-status';
export * from './use-movements-history';
export * from './use-stock-dashboard';

// Re-exports explicites pour éviter ambiguïté
export { useStock, type StockSummary } from './use-stock';
export { useStockMovements, type StockMovement } from './use-stock-movements';
export { useStockUI } from './use-stock-ui';


// Re-export types
export type { StockReasonCode, MovementType } from './use-stock-movements';
