import type { SupabaseClient } from '@supabase/supabase-js';

export type MovementType = 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER';

export type ReferenceType =
  | 'sales_order'
  | 'purchase_order'
  | 'manual_adjustment'
  | 'transfer'
  | 'return'
  | 'damage'
  | 'sample';

export type ReasonCode =
  | 'sale'
  | 'purchase'
  | 'return_customer'
  | 'return_supplier'
  | 'adjustment'
  | 'damage'
  | 'transfer_in'
  | 'transfer_out'
  | 'sample'
  | 'cancelled';

export type ForecastType = 'in' | 'out' | null;

export interface StockMovement {
  id: string;
  product_id: string;
  movement_type: MovementType;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reason_code: string;
  reference_type: ReferenceType | null;
  reference_id: string | null;
  notes: string | null;
  affects_forecast: boolean;
  forecast_type: ForecastType;
  performed_by: string | null;
  performed_at: string;
  channel_id: string | null;
  created_at: string;
  updated_at: string;
  products?: { id: string; sku: string; name: string } | null;
  sales_channels?: {
    id: string;
    name: string;
    code: string;
    is_active: boolean;
  } | null;
}

export interface StockItem {
  id: string;
  sku: string;
  name: string;
  stock_real: number;
  stock_quantity: number;
  stock_forecasted_in: number;
  stock_forecasted_out: number;
  min_stock: number | null;
  cost_price: number | null;
  archived_at: string | null;
  product_image_url?: string | null;
}

export interface CreateMovementParams {
  product_id: string;
  movement_type: MovementType;
  quantity_change: number;
  reason_code: string;
  reference_type?: ReferenceType | null;
  reference_id?: string | null;
  notes?: string | null;
  affects_forecast?: boolean;
  forecast_type?: ForecastType;
  channel_id?: string | null;
}

export interface MovementFilters {
  product_id?: string;
  movement_type?: MovementType | MovementType[];
  reference_type?: ReferenceType;
  reference_id?: string;
  channel_id?: string | null;
  affects_forecast?: boolean;
  date_from?: string;
  date_to?: string;
  limit?: number;
}

export interface UseStockCoreConfig {
  supabase: SupabaseClient;
  channelId?: string | null;
  userId: string;
}

export interface UseStockCoreReturn {
  loading: boolean;
  error: string | null;
  stockItems: StockItem[];
  getStockItems: (filters?: {
    search?: string;
    archived?: boolean;
  }) => Promise<StockItem[]>;
  getStockItem: (productId: string) => Promise<StockItem | null>;
  movements: StockMovement[];
  getMovements: (filters?: MovementFilters) => Promise<StockMovement[]>;
  createMovement: (params: CreateMovementParams) => Promise<StockMovement>;
  filterByChannel: (channelId: string) => Promise<StockMovement[]>;
  getMovementsByChannel: (
    channelId: string,
    dateFrom?: string,
    dateTo?: string
  ) => Promise<StockMovement[]>;
  refetch: () => Promise<void>;
}
