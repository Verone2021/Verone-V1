/** Types for useBankReconciliation hook */

export interface BankTransaction {
  id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  side: 'credit' | 'debit';
  label: string;
  note: string | null;
  reference: string | null;
  counterparty_name: string | null;
  counterparty_iban: string | null;
  operation_type: string | null;
  emitted_at: string;
  settled_at: string | null;
  matching_status: string;
  matched_document_id: string | null;
  confidence_score: number | null;
  raw_data: Record<string, unknown>;
  category_pcg: string | null;
  vat_rate: number | null;
  payment_method: string | null;
  amount_ht: number | null;
  amount_vat: number | null;
  nature: string | null;
  vat_source: string | null;
  attachment_ids: string[] | null;
  has_attachment: boolean | null;
  matched_document: {
    document_date: string | null;
    document_number: string | null;
  } | null;
}

export interface OrderWithoutInvoice {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string | null;
  billing_address: Record<string, unknown> | null;
  shipping_address: Record<string, unknown> | null;
  total_ht: number;
  total_ttc: number;
  status: string;
  payment_status_v2: 'pending' | 'paid' | null;
  created_at: string;
  shipped_at: string | null;
}

export interface MatchSuggestion {
  order_id: string;
  order_number: string;
  customer_name: string | null;
  customer_address: string | null;
  order_amount: number;
  confidence: number;
  match_reason: string;
}

export interface ReconciliationStats {
  total_unmatched_transactions: number;
  total_orders_without_invoice: number;
  total_amount_pending: number;
  transactions_with_attachments: number;
}
