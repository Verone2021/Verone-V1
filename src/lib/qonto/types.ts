// =====================================================================
// Qonto API Types
// Date: 2025-10-11
// Description: Types TypeScript pour intégration Qonto Banking API
// =====================================================================

// =====================================================================
// CONFIGURATION
// =====================================================================

export interface QontoConfig {
  organizationId: string;
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

// =====================================================================
// BANK ACCOUNTS
// =====================================================================

export interface QontoBankAccount {
  id: string;
  slug: string;
  iban: string;
  bic: string;
  currency: string;
  balance: number;
  authorized_balance: number;
  balance_cents: number;
  authorized_balance_cents: number;
  name: string;
  status: 'active' | 'closed';
  updated_at: string;
}

export interface QontoBalance {
  account_id: string;
  balance: number;
  currency: string;
  authorized_balance: number;
}

// =====================================================================
// TRANSACTIONS
// =====================================================================

export type QontoTransactionStatus =
  | 'pending'
  | 'declined'
  | 'reversed'
  | 'completed';
export type QontoTransactionSide = 'credit' | 'debit';
export type QontoOperationType =
  | 'transfer'
  | 'card'
  | 'direct_debit'
  | 'qonto_fee'
  | 'check'
  | 'income'
  | 'recall';

export interface QontoCounterparty {
  name: string;
  iban?: string;
  bic?: string;
}

export interface QontoAttachment {
  id: string;
  url: string;
  file_name: string;
  file_size: number;
  file_content_type: string;
  created_at: string;
}

export interface QontoTransaction {
  transaction_id: string;
  amount: number;
  amount_cents: number;
  currency: string;
  local_amount?: number;
  local_amount_cents?: number;
  local_currency?: string;
  side: QontoTransactionSide;
  operation_type: QontoOperationType;
  label: string;
  settled_at: string | null;
  emitted_at: string;
  updated_at: string;
  status: QontoTransactionStatus;
  note?: string;
  reference?: string;
  vat_amount?: number;
  vat_amount_cents?: number;
  vat_rate?: number;
  initiator_id?: string;
  label_ids?: string[];
  attachment_ids?: string[];
  attachments?: QontoAttachment[];
  card_last_digits?: string;
  category?: string;
  counterparty?: QontoCounterparty;
  bank_account_id?: string;
}

// =====================================================================
// API RESPONSES
// =====================================================================

export interface QontoApiResponse<T> {
  [key: string]: any;
}

export interface QontoTransactionsResponse {
  transactions: QontoTransaction[];
  meta: {
    current_page: number;
    next_page: number | null;
    prev_page: number | null;
    total_pages: number;
    total_count: number;
    per_page: number;
  };
}

// =====================================================================
// WEBHOOKS
// =====================================================================

export type QontoWebhookEvent =
  | 'transaction.created'
  | 'transaction.updated'
  | 'transaction.declined'
  | 'card.updated'
  | 'transfer.created'
  | 'transfer.updated';

export interface QontoWebhookPayload {
  event_name: QontoWebhookEvent;
  event_id: string;
  organization_slug: string;
  created_at: string;
  data: {
    transaction?: QontoTransaction;
    [key: string]: any;
  };
}

// =====================================================================
// REQUEST PARAMETERS
// =====================================================================

export interface GetTransactionsParams {
  bankAccountId?: string;
  status?: QontoTransactionStatus | QontoTransactionStatus[];
  updatedAtFrom?: string; // ISO 8601 format
  updatedAtTo?: string;
  settledAtFrom?: string;
  settledAtTo?: string;
  sortBy?: 'settled_at' | 'emitted_at' | 'updated_at';
  perPage?: number; // Default 20, max 100
  currentPage?: number;
}

// =====================================================================
// MATCHING & RECONCILIATION (Vérone internal)
// =====================================================================

export type MatchingStatus =
  | 'unmatched' // Transaction non rapprochée
  | 'auto_matched' // Rapprochement automatique (95%)
  | 'manual_matched' // Rapprochement manuel (5%)
  | 'partial_matched' // Paiement partiel
  | 'ignored'; // Transaction ignorée (frais, etc.)

export interface BankTransaction {
  id: string;
  transaction_id: string;
  bank_provider: 'qonto' | 'revolut';
  bank_account_id: string;
  amount: number;
  currency: string;
  side: QontoTransactionSide;
  operation_type: QontoOperationType;
  label: string;
  counterparty_name?: string;
  counterparty_iban?: string;
  settled_at: string | null;
  emitted_at: string;
  matching_status: MatchingStatus;
  matched_payment_id?: string;
  matched_invoice_id?: string;
  confidence_score?: number; // 0-100% pour auto-match
  raw_data: QontoTransaction; // JSONB original
  created_at: string;
  updated_at: string;
}

export interface AutoMatchResult {
  matched: boolean;
  confidence: number;
  payment_id?: string;
  invoice_id?: string;
  invoice_number?: string;
  amount_difference?: number;
  match_reason?: string;
}
