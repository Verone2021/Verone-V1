// Types pour l'API
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  tva_rate: number;
  tva_amount: number;
  total_ttc: number;
  product_id: string | null;
  product?: {
    name: string;
  } | null;
}

export interface InvoicePartner {
  id: string;
  legal_name: string | null;
  trade_name: string | null;
  email: string | null;
  phone: string | null;
  siret: string | null;
  vat_number: string | null;
  billing_address: {
    street?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  } | null;
}

export interface AddressData {
  street?: string;
  city?: string;
  postal_code?: string;
  country?: string;
}

// Document lie (avoir ou devis)
export interface RelatedCreditNote {
  id: string;
  credit_note_number: string;
  status: string;
  total_ttc: number;
}

export interface RelatedQuote {
  id: string;
  quote_number: string;
  status: string;
}

export interface InvoiceDetail {
  id: string;
  document_number: string;
  document_type: string;
  document_date: string;
  due_date: string | null;
  status: string;
  total_ht: number;
  total_ttc: number;
  tva_amount: number;
  amount_paid: number;
  description: string | null;
  notes: string | null;
  payment_terms: string | null;
  qonto_invoice_id: string | null;
  qonto_pdf_url: string | null;
  qonto_public_url: string | null;
  synchronized_at: string | null;
  validated_to_draft_at: string | null;
  finalized_at: string | null;
  sent_at: string | null;
  partner: InvoicePartner | null;
  items: InvoiceItem[];
  sales_order_id: string | null;
  billing_address?: AddressData | null;
  shipping_address?: AddressData | null;
  shipping_cost_ht?: number;
  handling_cost_ht?: number;
  insurance_cost_ht?: number;
  fees_vat_rate?: number;
  sales_order?: {
    order_number: string;
    shipping_address: AddressData | null;
  } | null;
  // Documents lies
  related_credit_notes?: RelatedCreditNote[];
  source_quote?: RelatedQuote | null;
}

export interface InvoiceDetailsResponse {
  success: boolean;
  invoice?: InvoiceDetail;
  error?: string;
}

export interface IInvoiceDetailModalProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinalize?: (invoiceId: string) => void;
  isActionLoading?: boolean;
}

// Type pour les items editables
export interface EditableItem {
  id: string;
  description: string;
  quantity: number;
  unit_price_ht: number;
  tva_rate: number;
  product_id: string | null;
}

// Type pour l'etat d'edition
export interface EditState {
  due_date: string;
  notes: string;
  billing_address: AddressData;
  shipping_address: AddressData;
  shipping_cost_ht: number;
  handling_cost_ht: number;
  insurance_cost_ht: number;
  fees_vat_rate: number;
  items: EditableItem[];
}
