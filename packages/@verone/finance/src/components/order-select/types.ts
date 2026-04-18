export interface IDocumentAddress {
  address_line1: string;
  address_line2?: string;
  postal_code: string;
  city: string;
  country: string;
}

export interface IOrderForDocument {
  id: string;
  order_number: string;
  total_ht: number;
  total_ttc: number;
  tax_rate: number;
  currency: string;
  payment_terms?: string;
  customer_id?: string | null;
  customer_type?: string | null;
  billing_address?: IDocumentAddress | null;
  shipping_address?: IDocumentAddress | null;
  shipping_cost_ht?: number | null;
  handling_cost_ht?: number | null;
  insurance_cost_ht?: number | null;
  fees_vat_rate?: number | null;
  organisations?: {
    name?: string;
    trade_name?: string | null;
    legal_name?: string | null;
    email?: string | null;
    address_line1?: string | null;
    city?: string | null;
    postal_code?: string | null;
    country?: string | null;
    billing_address_line1?: string | null;
    billing_city?: string | null;
    billing_postal_code?: string | null;
    billing_country?: string | null;
    shipping_address_line1?: string | null;
    shipping_city?: string | null;
    shipping_postal_code?: string | null;
    shipping_country?: string | null;
    has_different_shipping_address?: boolean | null;
    siret?: string | null;
    vat_number?: string | null;
    enseigne_id?: string | null;
  } | null;
  individual_customers?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
  sales_order_items?: Array<{
    id: string;
    quantity: number;
    unit_price_ht: number;
    tax_rate: number;
    products?: {
      name: string;
    } | null;
  }>;
}

export interface ICustomLine {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  unit_price_ht: number;
  vat_rate: number;
}

// Alias pour rétrocompatibilité
export type IOrderForInvoice = IOrderForDocument;
export type IOrderForQuote = IOrderForDocument;

export type SalesOrderStatus =
  | 'pending_approval'
  | 'draft'
  | 'validated'
  | 'partially_shipped'
  | 'shipped'
  | 'delivered'
  | 'closed'
  | 'cancelled';

export interface OrderSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOrder: (order: IOrderForDocument) => void;
  statuses?: SalesOrderStatus[];
}

export interface OrderListItem {
  id: string;
  order_number: string;
  total_ht: number;
  total_ttc: number;
  tax_rate: number;
  currency: string;
  payment_terms: string;
  status: string;
  created_at: string;
  customer_id: string | null;
  customer_type: string;
  customer_name: string;
  customer_email: string | null;
  payment_status_v2: string | null;
}
