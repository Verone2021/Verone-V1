export type QuoteStatus =
  | 'draft'
  | 'validated'
  | 'sent'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'converted'
  | 'superseded';

export interface QuoteItemProduct {
  id: string;
  name: string;
  sku: string | null;
  product_images: Array<{
    public_url: string;
    is_primary: boolean;
    display_order: number | null;
  }>;
}

export interface QuoteItem {
  id: string;
  document_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  tva_rate: number;
  tva_amount: number;
  total_ttc: number;
  discount_percentage: number;
  eco_tax: number;
  sort_order: number;
  // LinkMe metadata
  linkme_selection_item_id: string | null;
  base_price_ht: number | null;
  retrocession_rate: number | null;
  // Joined product data (from enriched query)
  product: QuoteItemProduct | null;
}

export interface Quote {
  id: string;
  document_number: string;
  document_date: string;
  due_date: string | null;
  validity_date: string | null;
  quote_status: QuoteStatus;
  customer_type: 'organization' | 'individual' | null;

  // Partner (organisation)
  partner_id: string;
  partner_type: string;
  individual_customer_id: string | null;

  // Channel
  channel_id: string | null;

  // Totals
  total_ht: number;
  total_ttc: number;
  tva_amount: number;

  // Fees
  shipping_cost_ht: number;
  handling_cost_ht: number;
  insurance_cost_ht: number;
  fees_vat_rate: number;

  // Addresses
  billing_address: Record<string, unknown> | null;
  shipping_address: Record<string, unknown> | null;

  // Qonto sync
  qonto_invoice_id: string | null;
  qonto_pdf_url: string | null;
  qonto_public_url: string | null;

  // Conversion
  converted_to_invoice_id: string | null;
  sales_order_id: string | null;

  // LinkMe
  linkme_selection_id: string | null;
  linkme_affiliate_id: string | null;

  // Metadata
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;

  // Joined data
  items?: QuoteItem[];
  partner?: {
    id: string;
    legal_name: string;
    trade_name: string | null;
  };
  individual_customer?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
  } | null;
  channel?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface QuoteFilters {
  quote_status?: QuoteStatus | 'all';
  channel_id?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface QuoteStats {
  total: number;
  draft: number;
  validated: number;
  sent: number;
  accepted: number;
  declined: number;
  expired: number;
  converted: number;
  total_ht: number;
}

export interface CreateQuoteItemData {
  product_id?: string | null;
  description: string;
  quantity: number;
  unit_price_ht: number;
  tva_rate: number;
  discount_percentage?: number;
  eco_tax?: number;
  // LinkMe metadata
  linkme_selection_item_id?: string | null;
  base_price_ht?: number | null;
  retrocession_rate?: number | null;
}

export interface CreateQuoteData {
  channel_id: string | null;
  customer_id: string;
  customer_type: 'organization' | 'individual';
  individual_customer_id?: string | null;
  items: CreateQuoteItemData[];
  validity_days: number; // 15/30/60/90
  notes?: string;
  reference?: string;
  billing_address?: Record<string, unknown>;
  shipping_address?: Record<string, unknown>;
  shipping_cost_ht?: number;
  handling_cost_ht?: number;
  insurance_cost_ht?: number;
  fees_vat_rate?: number;
  sales_order_id?: string | null;
  // LinkMe metadata
  linkme_selection_id?: string | null;
  linkme_affiliate_id?: string | null;
  // Consultation link
  consultation_id?: string | null;
}

export interface UpdateQuoteData
  extends Partial<Omit<CreateQuoteData, 'items'>> {
  items?: CreateQuoteItemData[];
}
