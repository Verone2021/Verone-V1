export interface QontoInvoice {
  id: string;
  number: string;
  status: string;
  total_amount: { value: string; currency: string };
  total_amount_cents: number;
  issue_date: string;
  due_date: string;
  pdf_url?: string;
  client?: {
    name: string;
    email?: string;
  };
}

export interface QontoQuote {
  id: string;
  quote_number: string;
  status: string;
  total_amount: number;
  currency: string;
  issue_date: string;
  expiry_date: string;
  pdf_url?: string;
  client?: {
    name: string;
    email?: string;
  };
}

export interface QontoCreditNote {
  id: string;
  number: string;
  credit_note_number?: string;
  status: string;
  total_amount?: { value: string; currency: string };
  total_amount_cents?: number;
  issue_date: string;
  pdf_url?: string;
  client?: {
    name: string;
    email?: string;
  };
  invoice_id?: string;
}

export type DocumentType = 'invoice' | 'quote' | 'credit_note';

export interface QontoInvoicesResponse {
  success: boolean;
  invoices?: QontoInvoice[];
  error?: string;
}

export interface QontoQuotesResponse {
  success: boolean;
  quotes?: QontoQuote[];
  error?: string;
}

export interface QontoCreditNotesResponse {
  success: boolean;
  credit_notes?: QontoCreditNote[];
  error?: string;
}
