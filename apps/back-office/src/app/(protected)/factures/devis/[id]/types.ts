export interface QontoQuoteItem {
  id?: string;
  title: string;
  description?: string;
  quantity: string;
  unit?: string;
  unit_price: { value: string; currency: string };
  vat_rate: string;
  total_amount?: { value: string; currency: string };
}

export interface QontoQuoteDetail {
  id: string;
  number?: string;
  quote_number?: string;
  status: string;
  currency: string;
  client_id: string;
  client?: {
    id: string;
    name: string;
    type?: string;
    email?: string;
    address?: {
      street_address?: string;
      city?: string;
      zip_code?: string;
      country_code?: string;
    };
  };
  issue_date: string;
  expiry_date: string;
  accepted_at?: string;
  declined_at?: string;
  total_amount_cents?: number;
  total_vat_amount_cents?: number;
  subtotal_amount_cents?: number;
  items: QontoQuoteItem[];
  purchase_order_number?: string;
  header?: string;
  footer?: string;
  terms_and_conditions?: string;
  attachment_id?: string;
  pdf_url?: string;
  public_url?: string;
  converted_to_invoice_id?: string;
  created_at: string;
  updated_at: string;
  finalized_at?: string;
}

export interface ApiResponse {
  success: boolean;
  quote?: QontoQuoteDetail;
  error?: string;
}

export interface StatusAction {
  label: string;
  action: string;
  variant: 'default' | 'destructive' | 'outline';
  icon: React.ReactNode;
  confirmTitle: string;
  confirmDescription: string;
}
