export { useStock } from './use-stock';
export { useStockAlerts } from './use-stock-alerts';
export { useStockAlertsCount } from './use-stock-alerts-count';
export { useStockAnalytics, ABC_CLASSES, XYZ_CLASSES } from './use-stock-analytics';
export { useStockDashboard } from './use-stock-dashboard';
export { useStockInventory } from './use-stock-inventory';
export { useStockMovements, type StockReasonCode } from './use-stock-movements';
export { useStockOptimized } from './use-stock-optimized';
export { useStockOrdersMetrics } from './use-stock-orders-metrics';
export { useStockReservations } from './use-stock-reservations';
export { useStockStatus, type StockStatusData } from './use-stock-status';
export { useStockUI } from './use-stock-ui';
export {
  useMovementsHistory,
  type MovementWithDetails,
  type MovementHistoryFilters,
  type MovementsStats
} from './use-movements-history';

// Alias for backward compatibility
export type { StockReasonCode as ReasonCode } from './use-stock-movements';
