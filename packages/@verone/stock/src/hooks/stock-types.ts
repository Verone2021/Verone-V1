import type { StockReasonCode } from './stock-movements-types';
export type { StockReasonCode };

export interface StockData {
  product_id: string;
  stock_real: number;
  stock_forecasted_in: number;
  stock_forecasted_out: number;
  stock_available: number;
  stock_total_forecasted: number;
  min_stock: number;
  product_name?: string;
  product_sku?: string;
  last_movement_at?: string;
}

export interface StockSummary {
  total_products: number;
  total_stock_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  forecasted_shortage_count: number;
  total_real: number;
  total_forecasted_in: number;
  total_forecasted_out: number;
}

export interface ManualMovementData {
  product_id: string;
  movement_type: 'add' | 'remove' | 'adjust';
  quantity: number;
  reason_code: StockReasonCode;
  notes?: string;
  unit_cost?: number;
}
