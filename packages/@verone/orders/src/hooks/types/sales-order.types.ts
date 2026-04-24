/**
 * Types pour les commandes clients (sales orders)
 * Extracted from use-sales-orders.ts for modularity
 */

// Types pour les commandes clients
export type SalesOrderStatus =
  | 'pending_approval'
  | 'draft'
  | 'validated'
  | 'partially_shipped'
  | 'shipped'
  | 'delivered'
  | 'closed'
  | 'cancelled';

export type ManualPaymentType =
  | 'cash'
  | 'check'
  | 'transfer_other'
  | 'card'
  | 'compensation';

export interface OrderPayment {
  id: string;
  payment_type: ManualPaymentType;
  amount: number;
  payment_date: string;
  reference: string | null;
  note: string | null;
  created_at: string;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_type: 'organization' | 'individual';
  individual_customer_id?: string | null;
  status: SalesOrderStatus;
  payment_status_v2?: 'pending' | 'partially_paid' | 'paid' | 'overpaid' | null; // Statut calculé via rapprochement bancaire
  currency: string;
  tax_rate: number;
  eco_tax_total: number;
  eco_tax_vat_rate: number | null;
  total_ht: number;
  total_ttc: number;
  paid_amount?: number;
  order_date?: string | null;
  expected_delivery_date?: string;
  /** LinkMe : date de livraison souhaitée par le client (sales_order_linkme_details.desired_delivery_date). */
  desired_delivery_date?: string | null;
  /** LinkMe : date de livraison confirmée (sales_order_linkme_details.confirmed_delivery_date). */
  confirmed_delivery_date?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSONB from Supabase, shape varies per context
  shipping_address?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSONB from Supabase, shape varies per context
  billing_address?: any;
  payment_terms?: string;
  notes?: string;
  channel_id?: string | null; // 🆕 Canal vente (b2b, ecommerce, retail, wholesale) - Pour traçabilité stock
  // 🆕 Relation jointe pour affichage nom canal
  sales_channel?: {
    id: string;
    name: string;
    code?: string;
  } | null;

  // Workflow users et timestamps
  created_by: string;
  confirmed_by?: string;
  shipped_by?: string;
  delivered_by?: string;

  // 🆕 Info créateur (nom, prénom, email)
  creator?: {
    first_name: string;
    last_name: string;
    email: string | null;
  } | null;

  confirmed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  paid_at?: string;
  warehouse_exit_at?: string;
  warehouse_exit_by?: string;

  created_at: string;
  updated_at: string;

  // Facture associée (financial_documents)
  invoice_id?: string | null;
  invoice_qonto_id?: string | null;
  invoice_number?: string | null;
  invoice_status?: string | null;

  // Devis associé (stocké sur sales_orders)
  quote_qonto_id?: string | null;
  quote_number?: string | null;

  // 🆕 Rapprochement bancaire (jointure transaction_document_links)
  is_matched?: boolean;
  /** All linked transactions (N-N supported). Singleton fields below = first row. */
  matched_transactions?: Array<{
    transaction_id: string;
    label: string;
    amount: number;
    emitted_at: string | null;
    attachment_ids: string[] | null;
  }>;
  matched_transaction_id?: string | null;
  matched_transaction_label?: string | null;
  matched_transaction_amount?: number | null;
  matched_transaction_emitted_at?: string | null; // Date de paiement
  matched_transaction_attachment_ids?: string[] | null; // Pour lien Qonto

  // Relations jointes (polymorphiques selon customer_type)
  organisations?: {
    id: string;
    name?: string; // Nom d'affichage (calculé côté client)
    legal_name: string;
    trade_name: string | null;
    email?: string;
    phone?: string;
    website?: string;
    address_line1?: string;
    address_line2?: string;
    postal_code?: string;
    city?: string;
    country?: string | null;
    region?: string;
    enseigne_id?: string | null;
    siret?: string | null;
    vat_number?: string | null;
    billing_address_line1?: string | null;
    billing_address_line2?: string | null;
    billing_city?: string | null;
    billing_postal_code?: string | null;
    billing_country?: string | null;
    // Shipping address (distinct from billing)
    shipping_address_line1?: string | null;
    shipping_address_line2?: string | null;
    shipping_city?: string | null;
    shipping_postal_code?: string | null;
    shipping_country?: string | null;
    has_different_shipping_address?: boolean | null;
  };
  individual_customers?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    address_line1?: string;
    address_line2?: string;
    postal_code?: string;
    city?: string;
  };
  sales_order_items?: SalesOrderItem[];

  // Contact IDs (FK vers table contacts)
  billing_contact_id?: string | null;
  delivery_contact_id?: string | null;
  responsable_contact_id?: string | null;

  // Relations contacts (jointes)
  billing_contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  delivery_contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  responsable_contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string | null;
    phone?: string | null;
  } | null;

  // LinkMe specific fields
  created_by_affiliate_id?: string | null;
  linkme_selection_id?: string | null;
  pending_admin_validation?: boolean;

  // Frais additionnels (HT)
  shipping_cost_ht?: number;
  insurance_cost_ht?: number;
  handling_cost_ht?: number;
  // TVA appliquée aux frais (différente de la TVA produits)
  fees_vat_rate?: number; // Ex: 0.20 = 20%

  // Packlink pending shipment flag (enriched in fetchOrders)
  has_pending_packlink?: boolean;
}

export interface SalesOrderItem {
  id: string;
  sales_order_id: string;
  product_id: string;
  quantity: number;
  unit_price_ht: number;
  tax_rate: number; // Taux de TVA par ligne (ex: 0.2000 = 20%)
  discount_percentage: number;
  total_ht: number;
  quantity_shipped: number;
  expected_delivery_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Échantillon
  is_sample: boolean; // Indique si cette ligne est un échantillon envoyé au client

  // LinkMe retrocession
  retrocession_amount?: number | null;
  retrocession_rate?: number | null;

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

export interface CreateSalesOrderData {
  customer_id: string;
  customer_type: 'organization' | 'individual';
  individual_customer_id?: string | null;
  order_date?: string | null;
  channel_id?: string | null; // 🆕 Canal vente (optional - si null, pas de traçabilité stock)
  eco_tax_vat_rate?: number | null;
  expected_delivery_date?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSONB from Supabase, shape varies per context
  shipping_address?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSONB from Supabase, shape varies per context
  billing_address?: any;
  payment_terms?: string;
  payment_terms_type?: string | null;
  payment_terms_notes?: string;
  notes?: string;
  // Frais additionnels clients
  shipping_cost_ht?: number;
  insurance_cost_ht?: number;
  handling_cost_ht?: number;
  // TVA appliquée aux frais (différente de la TVA produits)
  fees_vat_rate?: number; // Ex: 0.20 = 20%
  // Link to consultation that generated this order
  consultation_id?: string | null;
  items: CreateSalesOrderItemData[];
}

export interface CreateSalesOrderItemData {
  product_id: string;
  quantity: number;
  unit_price_ht: number;
  tax_rate?: number; // Taux de TVA (défaut: 0.20 = 20%)
  discount_percentage?: number;
  eco_tax?: number; // Éco-taxe par ligne (défaut: 0)
  expected_delivery_date?: string;
  notes?: string;
  is_sample?: boolean; // Marquer comme échantillon envoyé au client
}

export interface UpdateSalesOrderData {
  expected_delivery_date?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSONB from Supabase, shape varies per context
  shipping_address?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSONB from Supabase, shape varies per context
  billing_address?: any;
  payment_terms?: string;
  notes?: string;
}

export interface ShipItemData {
  item_id: string;
  quantity_shipped: number;
  notes?: string;
}

export interface SalesOrderFilters {
  customer_id?: string;
  status?: SalesOrderStatus;
  channel_id?: string; // Filtre par canal de vente (LinkMe, Site Internet, etc.)
  date_from?: string;
  date_to?: string;
  order_number?: string;
}

export interface SalesOrderStats {
  total_orders: number;
  total_value: number; // Maintenu pour compatibilité (alias de total_ttc)
  total_ht: number; // Total HT
  total_tva: number; // Total TVA
  total_ttc: number; // Total TTC
  average_basket: number; // Panier moyen (total_ttc / total_orders)
  pending_orders: number; // draft + validated
  shipped_orders: number;
  cancelled_orders: number;
  orders_by_status: {
    draft: number;
    validated: number;
    partially_shipped: number;
    shipped: number;
    cancelled: number;
  };
}
