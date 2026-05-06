/**
 * Shared types and helpers for the Factures page
 *
 * @module factures/components/types
 */

// =====================================================================
// TYPES
// =====================================================================

export type TabType = 'factures' | 'devis' | 'avoirs' | 'manquantes';
export const VALID_TABS: TabType[] = [
  'factures',
  'devis',
  'avoirs',
  'manquantes',
];

export interface ConsolidateReport {
  success: boolean;
  synced: number;
  skipped_existing: number;
  skipped_no_order_ref: number;
  skipped_no_match: number;
  skipped_no_partner: number;
  skipped_individual_customer: number;
  errors: string[];
}

// Types pour reponses API
export interface ApiResponse<T> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
}

export interface InvoicesResponse extends ApiResponse<{ invoices: Invoice[] }> {
  invoices?: Invoice[];
}

export interface CreditNotesResponse
  extends ApiResponse<{ credit_notes: CreditNote[] }> {
  credit_notes?: CreditNote[];
}

export interface CreditNote {
  id: string;
  credit_note_number: string;
  status: 'draft' | 'finalized' | 'canceled';
  currency: string;
  total_amount_cents: number; // Qonto API uses cents
  issue_date: string;
  client?: {
    id: string;
    name: string;
  };
  invoice_id?: string;
  invoice?: {
    id: string;
    invoice_number: string;
  };
  pdf_url?: string;
  attachment_id?: string;
}

export interface QontoQuote {
  id: string;
  quote_number: string;
  status: string;
  currency: string;
  total_amount: number;
  issue_date: string;
  expiry_date: string;
  client?: {
    id: string;
    name: string;
  };
  converted_to_invoice_id?: string | null;
  purchase_order_number?: string | null;
  order_number?: string | null;
}

export interface QontoQuotesResponse
  extends ApiResponse<{ quotes: QontoQuote[] }> {
  quotes?: QontoQuote[];
  count?: number;
}

export interface Invoice {
  id: string;
  number: string; // Qonto uses 'number' not 'invoice_number'
  status:
    | 'draft'
    | 'pending'
    | 'paid'
    | 'unpaid'
    | 'overdue'
    | 'canceled'
    | 'partially_paid';
  currency: string;
  total_amount: {
    value: string;
    currency: string;
  };
  total_amount_cents: number;
  issue_date: string;
  due_date: string;
  client?: {
    name: string;
  };
  purchase_order?: string;
  // Donnees locales enrichies depuis financial_documents
  local_pdf_path?: string | null;
  local_document_id?: string | null;
  has_local_pdf?: boolean;
  deleted_at?: string | null;
  sales_order_id?: string | null;
  order_number?: string | null;
  local_amount_paid?: number | null;
  local_total_ttc?: number | null;
  partner_id?: string | null;
  partner_legal_name?: string | null;
  partner_trade_name?: string | null;
  /** [BO-FIN-046 Étape 6] Timestamp création document (financial_documents.created_at) */
  document_created_at?: string | null;
  /** [BO-FIN-046 Étape 6] Timestamp dernière modification commande (sales_orders.updated_at) */
  order_updated_at?: string | null;
}

// =====================================================================
// HELPERS
// =====================================================================

export function formatAmount(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('fr-FR').format(new Date(dateString));
}
