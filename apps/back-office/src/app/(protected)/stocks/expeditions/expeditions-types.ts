import type { Database } from '@verone/types';

// Row types from DB
export type ProductRow = Database['public']['Tables']['products']['Row'];
export type ProductImage =
  Database['public']['Tables']['product_images']['Row'];
export type SalesOrderItemRow =
  Database['public']['Tables']['sales_order_items']['Row'];
export type SalesOrderRow = Database['public']['Tables']['sales_orders']['Row'];

export interface ProductWithImages extends Partial<ProductRow> {
  product_images?: ProductImage[];
}

export interface SalesOrderItem extends SalesOrderItemRow {
  products?: ProductWithImages;
}

export interface SalesOrder extends SalesOrderRow {
  sales_order_items?: SalesOrderItem[];
  customer_name?: string;
}

export interface ShipmentStats {
  total_pending: number;
  total_partial: number;
  total_completed_today: number;
  total_overdue: number;
  total_urgent: number;
}

export interface ShipmentHistoryItem {
  /** ID du shipment (sales_order_shipments.id) — requis pour l'édition */
  id?: string;
  /** Alias de id, depuis ShipmentHistory.shipment_id */
  shipment_id?: string;
  /** Méthode de livraison — 'manual' = édition possible */
  delivery_method?: string;
  shipped_at?: string;
  tracking_number?: string;
  tracking_url?: string;
  carrier_name?: string;
  service_name?: string;
  shipping_cost?: number;
  cost_paid_eur?: number;
  cost_charged_eur?: number;
  shipped_by_name?: string;
  notes?: string;
  total_quantity?: number;
  items?: Array<{
    product_name: string;
    product_sku: string;
    quantity_shipped: number;
    product_image_url?: string;
  }>;
}

export interface PacklinkShipment {
  packlink_shipment_id: string;
  sales_order_id: string;
  order_number: string;
  customer_name: string;
  items: Array<{ product_name: string; quantity: number }>;
  carrier_name: string | null;
  carrier_service: string | null;
  shipping_cost: number | null;
  packlink_status: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  label_url: string | null;
  estimated_delivery_at: string | null;
  created_at: string | null;
}

/**
 * Ligne de la vue v_sales_order_progress (BO-SHIP-PROG-001).
 * Source unifiée de la progression d'expédition d'une commande :
 * agrège sales_order_items (commandé / confirmé stock) et
 * sales_order_shipments (lots actifs en cours, incluant Packlink a_payer).
 */
export interface SalesOrderProgress {
  sales_order_id: string;
  total_ordered: number;
  total_confirmed_shipped: number;
  total_in_flight: number;
  total_reserved: number;
  total_remaining: number;
  progress_percent: number;
  has_pending_payment: boolean;
  has_incident: boolean;
}

export interface ToShipFilters {
  status?: string;
  search?: string;
  urgent_only?: boolean;
  overdue_only?: boolean;
}

export interface HistoryFilters {
  status?: string;
  search?: string;
}
