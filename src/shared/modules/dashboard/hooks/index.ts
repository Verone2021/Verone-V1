export { useCompleteDashboardMetrics } from './use-complete-dashboard-metrics';
export { useRealDashboardMetrics } from './use-real-dashboard-metrics';
export {
  useDashboardAnalytics,
  type RevenueDataPoint,
  type StockMovementDataPoint,
  type PurchaseOrderDataPoint,
  type ProductsDataPoint,
} from './use-dashboard-analytics';
export { useDashboardNotifications } from './use-dashboard-notifications';
export { useRecentActivity } from './use-recent-activity';

// Metrics hooks (migrated from src/hooks/metrics)
export * from './metrics';
