import type { Database } from '@verone/types/supabase';

export type SalesOrderStatus =
  Database['public']['Enums']['sales_order_status'];

/** LinkMe channel UUID */
export const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

/**
 * Interface item de commande
 */
export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_image_url: string | null;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  tax_rate: number;
  base_price_ht: number;
  margin_rate: number;
  commission_rate: number;
  selling_price_ht: number;
  affiliate_margin: number;
  is_affiliate_product: boolean;
  affiliate_commission_rate: number;
}

/**
 * Interface adresse structuree (JSONB)
 */
export interface StructuredAddress {
  line1?: string;
  line2?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
}

/**
 * Interface commande LinkMe
 */
export interface LinkMeOrder {
  id: string;
  order_number: string;
  linkme_display_number: string | null;
  status: string;
  payment_status: string | null;
  total_ht: number;
  total_ttc: number;
  shipping_cost_ht: number;
  handling_cost_ht: number;
  insurance_cost_ht: number;
  total_affiliate_margin: number;
  total_payout_ht: number;
  customer_name: string;
  customer_type: 'organization' | 'individual';
  customer_id: string;
  customer_address: string | null;
  customer_postal_code: string | null;
  customer_city: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  // Adresses structurees (depuis sales_orders)
  billing_address: StructuredAddress | null;
  shipping_address: StructuredAddress | null;
  // Dates de livraison (depuis sales_order_linkme_details)
  desired_delivery_date: string | null;
  confirmed_delivery_date: string | null;
  // Contact facturation (depuis sales_order_linkme_details)
  billing_name: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  // Requester contact (depuis sales_order_linkme_details)
  requester_name: string | null;
  requester_email: string | null;
  requester_phone: string | null;
  requester_position: string | null;
  // Delivery contact (depuis sales_order_linkme_details)
  delivery_contact_name: string | null;
  delivery_contact_email: string | null;
  delivery_contact_phone: string | null;
  // Delivery address text (depuis sales_order_linkme_details)
  delivery_address_text: string | null;
  delivery_postal_code: string | null;
  delivery_city: string | null;
  // Delivery options
  is_mall_delivery: boolean;
  delivery_notes: string | null;
  owner_type: string | null;
  // Reception contact
  reception_contact_name: string | null;
  reception_contact_email: string | null;
  reception_contact_phone: string | null;
  // Affiliate info
  affiliate_id: string;
  affiliate_name: string | null;
  affiliate_type: 'enseigne' | 'organisation' | null;
  selection_id: string | null;
  selection_name: string | null;
  items_count: number;
  created_at: string;
  updated_at: string;
  // Approbation
  pending_admin_validation: boolean;
  // Items charges separement
  items: OrderItem[];
}

// ============================================
// Supabase row types for the joined query
// ============================================

export interface QueryOrderRow {
  id: string;
  order_number: string;
  linkme_display_number: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  payment_status_v2: string | null;
  total_ht: number;
  total_ttc: number;
  shipping_cost_ht: number | null;
  handling_cost_ht: number | null;
  insurance_cost_ht: number | null;
  affiliate_total_ht: number | null;
  billing_address: StructuredAddress | null;
  shipping_address: StructuredAddress | null;
  pending_admin_validation: boolean | null;
  created_by_affiliate_id: string | null;
  linkme_selection_id: string | null;
  customer_id: string | null;
  customer_type: string;
  channel: { id: string; name: string; code: string } | null;
  items: QueryItemRow[];
  linkme_details: QueryLinkmeDetailsRow[];
  affiliate: {
    id: string;
    display_name: string;
    affiliate_type: string;
  } | null;
  selection: { id: string; name: string } | null;
  organisation: {
    id: string;
    trade_name: string | null;
    legal_name: string;
    ownership_type: string | null;
    address_line1: string | null;
    city: string | null;
    postal_code: string | null;
    country: string | null;
  } | null;
  individual_customer: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

export interface QueryItemRow {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number | null;
  tax_rate: number;
  retrocession_amount: number | null;
  retrocession_rate: number | null;
  base_price_ht_locked: number | null;
  selling_price_ht_locked: number | null;
  product: {
    id: string;
    name: string;
    sku: string | null;
    created_by_affiliate: string | null;
    affiliate_commission_rate: number | null;
  } | null;
}

export interface QueryLinkmeDetailsRow {
  billing_name: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  requester_position: string | null;
  delivery_contact_name: string | null;
  delivery_contact_email: string | null;
  delivery_contact_phone: string | null;
  delivery_address: string | null;
  delivery_postal_code: string | null;
  delivery_city: string | null;
  desired_delivery_date: string | null;
  confirmed_delivery_date: string | null;
  is_mall_delivery: boolean | null;
  delivery_notes: string | null;
  owner_type: string | null;
  reception_contact_name: string | null;
  reception_contact_email: string | null;
  reception_contact_phone: string | null;
}

export interface ProductImageRow {
  product_id: string;
  public_url: string | null;
}

// ============================================
// Pagination options
// ============================================

export interface UseLinkMeOrdersOptions {
  page: number;
  pageSize: number;
  yearFilter?: string; // 'all' | 'current' | '2025' | '2026' etc.
  periodFilter?: string; // 'all' | 'q1'-'q4' | '01'-'12'
  ownershipTypeFilter?: string; // 'all' | 'succursale' | 'franchise'
  statusFilter?: 'all' | SalesOrderStatus; // tab filter
}

export interface UseLinkMeOrdersResult {
  orders: LinkMeOrder[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
  /** Status counts for tabs (total across all pages) */
  statusCounts: Record<string, number>;
  /** Whether status counts are still loading */
  isCountsLoading: boolean;
}

export interface OrderStats {
  total_orders: number;
  total_ht: number;
  total_affiliate_margins: number;
  orders_by_status: Record<string, number>;
}

// ============================================
// Build query helper
// ============================================

export const ORDER_SELECT = `
  id, order_number, linkme_display_number, created_at, updated_at, status,
  payment_status_v2, total_ht, total_ttc,
  shipping_cost_ht, handling_cost_ht, insurance_cost_ht,
  affiliate_total_ht, billing_address, shipping_address,
  pending_admin_validation, created_by_affiliate_id,
  linkme_selection_id, customer_id, customer_type,
  channel:sales_channels!left(id, name, code),
  items:sales_order_items(
    id, product_id, quantity, unit_price_ht, total_ht, tax_rate,
    retrocession_amount, retrocession_rate,
    base_price_ht_locked, selling_price_ht_locked,
    product:products!left(id, name, sku, created_by_affiliate, affiliate_commission_rate)
  ),
  linkme_details:sales_order_linkme_details!left(
    billing_name, billing_email, billing_phone,
    requester_name, requester_email, requester_phone, requester_position,
    delivery_contact_name, delivery_contact_email, delivery_contact_phone,
    delivery_address, delivery_postal_code, delivery_city,
    desired_delivery_date, confirmed_delivery_date,
    is_mall_delivery, delivery_notes, owner_type,
    reception_contact_name, reception_contact_email, reception_contact_phone
  ),
  affiliate:linkme_affiliates!sales_orders_created_by_affiliate_id_fkey(
    id, display_name, affiliate_type
  ),
  selection:linkme_selections!sales_orders_linkme_selection_id_fkey(id, name),
  organisation:organisations!sales_orders_customer_id_fkey(id, trade_name, legal_name, ownership_type, address_line1, city, postal_code, country),
  individual_customer:individual_customers!sales_orders_individual_customer_id_fkey(
    id, first_name, last_name
  )
` as const;
