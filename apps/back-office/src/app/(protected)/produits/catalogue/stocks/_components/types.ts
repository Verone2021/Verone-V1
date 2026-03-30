export interface StockFilters {
  search: string;
  status:
    | 'all'
    | 'in_stock'
    | 'low_stock'
    | 'out_of_stock'
    | 'forecasted_shortage';
  category: string;
  sortBy: 'name' | 'sku' | 'stock_real' | 'stock_available' | 'updated_at';
  sortOrder: 'asc' | 'desc';
}

export interface ProductWithStock {
  id: string;
  name: string;
  sku: string;
  stock_real: number;
  stock_forecasted_in: number;
  stock_forecasted_out: number;
  stock_available: number;
  stock_total_forecasted: number;
  last_movement_at?: string | null;
  primary_image_url?: string;
  [key: string]: unknown;
}

export const DEFAULT_FILTERS: StockFilters = {
  search: '',
  status: 'all',
  category: 'all',
  sortBy: 'name',
  sortOrder: 'asc',
};

export const MIN_STOCK_LEVEL = 5;
