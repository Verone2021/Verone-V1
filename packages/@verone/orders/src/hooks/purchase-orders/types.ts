// Types pour les commandes fournisseurs

import type { ManualPaymentType, OrderPayment } from '../use-sales-orders';

export type { ManualPaymentType, OrderPayment };

export type PurchaseOrderStatus =
  | 'draft'
  | 'validated' // ✅ Statut validation (rouge → vert)
  | 'partially_received'
  | 'received'
  | 'cancelled';

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  status: PurchaseOrderStatus;
  payment_status_v2?: 'pending' | 'paid' | 'partially_paid' | 'overpaid' | null;
  paid_amount?: number;
  paid_at?: string | null;
  // 🆕 Transaction liée (enrichissement)
  is_matched?: boolean;
  matched_transaction_id?: string | null;
  matched_transaction_label?: string | null;
  matched_transaction_amount?: number | null;
  matched_transaction_emitted_at?: string | null;
  currency: string;
  tax_rate: number;
  eco_tax_total: number;
  eco_tax_vat_rate: number | null;
  total_ht: number;
  total_ttc: number;
  order_date?: string | null;
  expected_delivery_date?: string;
  delivery_address?: Record<string, unknown>;
  payment_terms?: string;
  notes?: string;

  // Workflow users et timestamps
  created_by: string;
  validated_by?: string;
  received_by?: string;

  validated_at?: string;
  received_at?: string;
  cancelled_at?: string;

  created_at: string;
  updated_at: string;

  // Relations jointes
  organisations?: {
    id: string;
    legal_name: string;
    trade_name: string | null;
    email?: string;
    phone?: string;
    payment_terms?: string | null;
  };
  purchase_order_items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_price_ht: number;
  discount_percentage: number;
  total_ht: number;
  eco_tax: number;
  quantity_received: number;
  expected_delivery_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Fee allocation
  allocated_shipping_ht?: number;
  allocated_customs_ht?: number;
  allocated_insurance_ht?: number;
  unit_cost_net?: number | null;

  // Échantillons
  sample_type?: 'internal' | 'customer' | null;
  customer_organisation_id?: string | null;
  customer_individual_id?: string | null;
  customer_organisation?: {
    id: string;
    legal_name: string;
    trade_name: string | null;
  } | null;
  customer_individual?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;

  // Relations jointes
  products?: {
    id: string;
    name: string;
    sku: string;
    stock_quantity?: number;
    stock_real?: number;
    stock_forecasted_in?: number;
    stock_forecasted_out?: number;
    primary_image_url?: string | null;
  };
}

export interface CreatePurchaseOrderData {
  supplier_id: string;
  expected_delivery_date?: string;
  delivery_address?: Record<string, unknown>;
  payment_terms?: string;
  notes?: string;
  eco_tax_vat_rate?: number | null;
  // Frais additionnels fournisseurs
  shipping_cost_ht?: number;
  customs_cost_ht?: number;
  insurance_cost_ht?: number;
  items: CreatePurchaseOrderItemData[];
}

export interface CreatePurchaseOrderItemData {
  product_id: string;
  quantity: number;
  unit_price_ht: number;
  discount_percentage?: number;
  eco_tax?: number;
  expected_delivery_date?: string;
  notes?: string;
}

export interface UpdatePurchaseOrderData {
  expected_delivery_date?: string;
  delivery_address?: Record<string, unknown>;
  payment_terms?: string;
  notes?: string;
}

export interface ReceiveItemData {
  item_id: string;
  quantity_received: number;
  unit_cost?: number;
  notes?: string;
}

export interface PurchaseOrderFilters {
  supplier_id?: string;
  status?: PurchaseOrderStatus;
  date_from?: string;
  date_to?: string;
  po_number?: string;
}

export interface PurchaseOrderStats {
  total_orders: number;
  total_value: number;
  pending_orders: number;
  received_orders: number;
  cancelled_orders: number;
}
