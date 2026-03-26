export interface QuoteItem {
  title: string;
  description?: string;
  quantity: number | string;
  unit?: string;
  // Qonto returns unit_price as object { value: string, currency: string }
  unit_price: number | { value: string; currency: string };
  vat_rate: number | string;
  total_amount?: number | { value: string; currency: string };
}

// Qonto amount type - can be number or object
export type QontoAmount = number | { value: string; currency: string };

export interface Quote {
  id: string;
  quote_number: string;
  number?: string; // Qonto uses 'number' field
  // Qonto uses 'pending_approval' for drafts
  status:
    | 'draft'
    | 'pending_approval'
    | 'finalized'
    | 'accepted'
    | 'declined'
    | 'expired';
  currency: string;
  // Qonto may return amounts as objects { value, currency } or numbers
  total_amount: QontoAmount;
  total_amount_cents?: number;
  total_vat_amount: QontoAmount;
  total_vat_amount_cents?: number;
  subtotal_amount: QontoAmount;
  subtotal_amount_cents?: number;
  issue_date: string;
  expiry_date: string;
  pdf_url?: string;
  public_url?: string;
  converted_to_invoice_id?: string;
  client?: {
    name: string;
    email?: string;
    billing_address?: {
      street_address?: string;
      city?: string;
      zip_code?: string;
      country_code?: string;
    };
  };
  items?: QuoteItem[];
}

// API Response types
export interface QuoteApiResponse {
  success: boolean;
  quote: Quote;
  error?: string;
}

export interface DeleteApiResponse {
  success: boolean;
  error?: string;
}

export interface ConvertApiResponse {
  success: boolean;
  invoice?: { id: string };
  error?: string;
}

export interface ErrorResponse {
  error?: string;
}
