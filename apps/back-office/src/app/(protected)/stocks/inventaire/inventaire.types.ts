export type QuickDateFilter = 'all' | 'today' | '7days' | '30days';
export type StockLevelFilter = 'all' | 'critical' | 'low' | 'sufficient';

export interface InventoryFilters {
  search: string;
  dateFrom: string;
  dateTo: string;
}
