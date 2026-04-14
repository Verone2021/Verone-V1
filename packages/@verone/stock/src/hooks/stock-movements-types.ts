export type MovementType = 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER';

export type StockReasonCode =
  | 'sale'
  | 'transfer_out'
  | 'damage_transport'
  | 'damage_handling'
  | 'damage_storage'
  | 'theft'
  | 'loss_unknown'
  | 'sample_client'
  | 'sample_showroom'
  | 'marketing_event'
  | 'photography'
  | 'rd_testing'
  | 'prototype'
  | 'quality_control'
  | 'return_supplier'
  | 'return_customer'
  | 'warranty_replacement'
  | 'inventory_correction'
  | 'write_off'
  | 'obsolete'
  | 'purchase_reception'
  | 'return_from_client'
  | 'found_inventory'
  | 'manual_adjustment';

export interface StockMovement {
  id: string;
  product_id: string;
  warehouse_id?: string;
  movement_type: MovementType;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  unit_cost?: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  reason_code?: StockReasonCode;
  affects_forecast?: boolean;
  forecast_type?: 'in' | 'out';
  performed_by: string;
  performed_at: string;
  created_at: string;
  updated_at: string;
  products?: {
    id: string;
    name: string;
    sku: string;
    primary_image_url?: string;
  };
  user_profiles?: { first_name?: string; last_name?: string };
}

export interface CreateStockMovementData {
  product_id: string;
  movement_type: MovementType;
  quantity_change: number;
  unit_cost?: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  reason_code?: StockReasonCode;
  affects_forecast?: boolean;
  forecast_type?: 'in' | 'out';
}

export interface StockMovementFilters {
  product_id?: string;
  movement_type?: MovementType;
  reference_type?: string;
  reason_code?: StockReasonCode;
  affects_forecast?: boolean;
  date_from?: string;
  date_to?: string;
  performed_by?: string;
}

export interface StockMovementStats {
  total_movements: number;
  total_in: number;
  total_out: number;
  total_adjustments: number;
  total_transfers: number;
}
