import type { Database } from '@verone/types';

export type SalesOrder = Database['public']['Tables']['sales_orders']['Row'];
export type Organisation = Database['public']['Tables']['organisations']['Row'];
export type IndividualCustomer =
  Database['public']['Tables']['individual_customers']['Row'];

// Interface pour la commande avec items (relations polymorphiques gérées manuellement)
export interface ISalesOrderWithItems extends SalesOrder {
  sales_order_items: Array<{
    id: string;
    quantity: number;
    unit_price_ht: number;
    tax_rate: number | null;
    notes: string | null;
    products: { id: string; name: string; sku: string | null } | null;
  }>;
}

// Interface enrichie avec customer (après fetch manuel)
export interface ISalesOrderWithCustomer extends ISalesOrderWithItems {
  customer: Organisation | IndividualCustomer | null;
}

/**
 * Interface pour les frais de service
 */
export interface IFeesData {
  shipping_cost_ht?: number;
  handling_cost_ht?: number;
  insurance_cost_ht?: number;
  fees_vat_rate?: number;
}

/**
 * Interface pour les lignes personnalisées
 */
export interface ICustomLine {
  title: string;
  description?: string;
  quantity: number;
  unit_price_ht: number;
  vat_rate: number;
}

/**
 * Interface pour les adresses envoyées depuis le modal
 */
export interface IAddressData {
  address_line1?: string;
  address_line2?: string;
  postal_code: string;
  city: string;
  country?: string;
}

export interface IPostRequestBody {
  salesOrderId: string;
  autoFinalize?: boolean;
  issueDate?: string;
  label?: string;
  billingAddress?: IAddressData;
  shippingAddress?: IAddressData;
  fees?: IFeesData;
  customLines?: ICustomLine[];
}

export interface IInvoiceItem {
  title: string;
  description?: string;
  quantity: string;
  unit: string;
  unitPrice: { value: string; currency: string };
  vatRate: string;
  // Pour stockage local
  product_id?: string;
  unit_price_ht: number;
  quantity_num: number;
  vat_rate_num: number;
}

export interface ILocalDocData {
  local_pdf_path: string | null;
  local_document_id: string;
  deleted_at: string | null;
  sales_order_id: string | null;
  order_number: string | null;
  local_status: string | null;
  local_amount_paid: number | null;
  local_total_ttc: number | null;
  partner_id: string | null;
  partner_legal_name: string | null;
  partner_trade_name: string | null;
}
