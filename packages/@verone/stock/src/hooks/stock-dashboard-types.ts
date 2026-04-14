export interface StockOverview {
  total_value: number;
  products_in_stock: number;
  products_out_of_stock: number;
  products_below_min: number;
  total_products: number;
  total_quantity: number;
  total_forecasted_in: number;
  total_forecasted_out: number;
  total_available: number;
  po_total_ht: number;
  so_total_ht: number;
  po_count: number;
  so_count: number;
}

export interface MovementsSummary {
  last_7_days: {
    entries: { count: number; quantity: number };
    exits: { count: number; quantity: number };
    adjustments: { count: number; quantity: number };
  };
  today: { entries: number; exits: number; adjustments: number };
  total_movements: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  min_stock: number;
  cost_price: number;
  stock_forecasted_out: number;
  product_image_url?: string | null;
}

export interface RecentMovement {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  movement_type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER';
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reason_code: string;
  notes: string | null;
  performed_at: string;
  performer_name: string | null;
  channel_id: string | null;
}

export interface ForecastedOrder {
  id: string;
  order_number: string;
  order_type: 'purchase' | 'sales';
  client_name?: string;
  supplier_name?: string;
  total_quantity: number;
  expected_date: string;
  status: string;
}

export interface StockDashboardMetrics {
  overview: StockOverview;
  movements: MovementsSummary;
  low_stock_products: LowStockProduct[];
  recent_movements: RecentMovement[];
  incoming_orders: ForecastedOrder[];
  outgoing_orders: ForecastedOrder[];
}
