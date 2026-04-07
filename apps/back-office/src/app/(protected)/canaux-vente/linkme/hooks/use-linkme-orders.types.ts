import type { Database } from '@verone/types';

// Types Supabase internes
export type SalesOrderRow = Database['public']['Tables']['sales_orders']['Row'];
export type SalesOrderItemRow =
  Database['public']['Tables']['sales_order_items']['Row'];

export type SalesOrderWithCustomer = Pick<
  SalesOrderRow,
  | 'id'
  | 'order_number'
  | 'linkme_display_number'
  | 'channel_id'
  | 'customer_id'
  | 'customer_type'
  | 'status'
  | 'payment_status_v2'
  | 'total_ht'
  | 'total_ttc'
  | 'created_at'
  | 'updated_at'
>;

export type SalesOrderItemWithProduct = {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  retrocession_rate: number;
  retrocession_amount: number;
  base_price_ht_locked: number | null;
  selling_price_ht_locked: number | null;
  linkme_selection_item_id: string | null;
  linkme_selection_items: {
    base_price_ht: number;
    margin_rate: number;
    selling_price_ht: number;
  } | null;
  products: {
    id: string;
    name: string;
    sku: string;
  } | null;
};

export type SalesOrderWithItems = SalesOrderWithCustomer & {
  tax_rate: number;
  shipping_cost_ht: number;
  insurance_cost_ht: number;
  handling_cost_ht: number;
  notes: string | null;
  sales_order_items: SalesOrderItemWithProduct[];
};

// ID du canal LinkMe
export const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

export interface LinkMeOrderItemInput {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price_ht: number;
  /** Taux de TVA par ligne (0.20 = 20%) */
  tax_rate: number;
  /** Taux de rétrocession (commission affilié) en décimal */
  retrocession_rate: number;
  /** ID de l'item de sélection (pour traçabilité) */
  linkme_selection_item_id?: string;
  /** Prix de base HT pour calcul commission (avant majoration affilié) */
  base_price_ht: number;
  /** Produit créé par l'affilié (modèle inversé) */
  is_affiliate_product?: boolean;
}

export interface LinkMeDetailsInput {
  requester_phone?: string | null;
  billing_name?: string | null;
  billing_email?: string | null;
  billing_phone?: string | null;
  delivery_contact_name?: string | null;
  delivery_contact_email?: string | null;
  delivery_contact_phone?: string | null;
  delivery_address?: string | null;
  delivery_postal_code?: string | null;
  delivery_city?: string | null;
  is_mall_delivery?: boolean;
  semi_trailer_accessible?: boolean;
  desired_delivery_date?: string | null;
  delivery_notes?: string | null;
}

export interface CreateLinkMeOrderInput {
  /** Type de client: 'organization' ou 'individual' */
  customer_type: 'organization' | 'individual';
  customer_organisation_id?: string | null;
  individual_customer_id?: string | null;
  affiliate_id: string;
  items: LinkMeOrderItemInput[];
  internal_notes?: string;
  shipping_address?: {
    address_line1: string;
    address_line2?: string;
    city: string;
    postal_code: string;
    country: string;
  };
  shipping_cost_ht?: number;
  insurance_cost_ht?: number;
  handling_cost_ht?: number;
  frais_tax_rate?: number;
  order_date: string;
  expected_delivery_date?: string | null;
  is_shopping_center_delivery?: boolean;
  accepts_semi_truck?: boolean;
  linkme_selection_id?: string | null;
  responsable_contact_id?: string | null;
  billing_contact_id?: string | null;
  delivery_contact_id?: string | null;
  billing_address?: {
    address_line1: string;
    city: string;
    postal_code: string;
    country: string;
  };
  linkme_details?: LinkMeDetailsInput | null;
}

export interface LinkMeOrder {
  id: string;
  order_number: string;
  linkme_display_number: string | null;
  channel_id: string | null;
  customer_type: string;
  customer_organisation_id: string | null;
  individual_customer_id: string | null;
  status: string | null;
  payment_status_v2: string | null;
  total_ht: number;
  total_ttc: number;
  tax_rate: number;
  shipping_cost_ht: number;
  insurance_cost_ht: number;
  handling_cost_ht: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  organisation?: {
    id: string;
    trade_name: string | null;
    legal_name: string;
  } | null;
  individual_customer?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  items?: LinkMeOrderItem[];
}

export interface UpdateLinkMeOrderInput {
  id: string;
  tax_rate?: number;
  internal_notes?: string;
  shipping_cost_ht?: number;
  insurance_cost_ht?: number;
  handling_cost_ht?: number;
  items?: Array<{
    id?: string;
    product_id: string;
    quantity: number;
    unit_price_ht: number;
    retrocession_rate?: number;
  }>;
}

export interface LinkMeOrderItem {
  id: string;
  sales_order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  retrocession_rate: number | null;
  retrocession_amount: number | null;
  linkme_selection_item_id: string | null;
  base_price_ht: number;
  margin_rate: number;
  base_price_ht_locked: number | null;
  selling_price_ht_locked: number | null;
}
