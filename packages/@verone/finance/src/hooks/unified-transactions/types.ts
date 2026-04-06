// =====================================================================
// Types: Unified Transactions
// =====================================================================

export type UnifiedStatus =
  | 'to_process'
  | 'classified'
  | 'matched'
  | 'ignored'
  | 'cca'
  | 'partial';

export type TransactionSide = 'credit' | 'debit';

export interface ReconciliationLinkDetail {
  id: string;
  link_type: 'document' | 'sales_order' | 'purchase_order';
  allocated_amount: number;
  label: string; // numéro de facture ou commande
  partner_name: string | null;
  total_ht: number;
  total_ttc: number;
  vat_rate: number; // calculé
}

export interface UnifiedTransaction {
  id: string;
  transaction_id: string;

  // Dates
  emitted_at: string;
  settled_at: string | null;

  // Infos transaction
  label: string;
  amount: number;
  side: TransactionSide;
  operation_type: string | null;
  bank_status: string;
  counterparty_name: string | null;
  counterparty_iban: string | null;
  reference: string | null;

  // Enrichissement: Classification
  category_pcg: string | null;
  category_pcg_label: string | null;
  category_pcg_group: string | null;

  // Enrichissement: Organisation
  counterparty_organisation_id: string | null;
  organisation_name: string | null;
  organisation_roles: string[];

  // Justificatif
  has_attachment: boolean;
  attachment_count: number;
  attachment_ids: string[] | null;
  justification_optional: boolean | null;

  // Rapprochement
  matching_status: string;
  matched_document_id: string | null;
  matched_document_number: string | null;
  matched_document_type: string | null;
  matched_at: string | null;
  confidence_score: number | null;
  match_reason: string | null;
  matched_order_ids: string[] | null;

  // SLICE 5: Règle appliquée (verrouillage UI)
  applied_rule_id: string | null;
  rule_match_value: string | null;
  rule_display_label: string | null;
  rule_allow_multiple_categories: boolean | null;

  // Rapprochement enrichi (depuis transaction_document_links)
  reconciliation_link_count: number;
  reconciliation_total_allocated: number;
  reconciliation_remaining: number;
  // TVA déduite des documents/commandes rapprochés (lecture seule)
  reconciliation_vat_rates: number[];
  // Détails des liens pour affichage dans le panneau de détail
  reconciliation_links: ReconciliationLinkDetail[];

  // Statut unifie
  unified_status: UnifiedStatus;

  // Montants TVA
  vat_rate: number | null;
  amount_ht: number | null;
  amount_vat: number | null;
  vat_breakdown: Array<{
    description: string;
    amount_ht: number;
    tva_rate: number;
    tva_amount: number;
  }> | null;
  vat_source: string | null;
  payment_method: string | null;
  nature: string | null;
  note: string | null;

  // Periode
  year: number;
  month: number;

  // Metadata
  raw_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UnifiedFilters {
  status?: UnifiedStatus | 'all';
  side?: TransactionSide | 'all';
  hasAttachment?: boolean | null;
  year?: number | null;
  month?: number | null;
  search?: string;
  organisationId?: string | null;
}

export interface UnifiedStats {
  total_count: number;
  to_process_count: number;
  classified_count: number;
  matched_count: number;
  ignored_count: number;
  cca_count: number;
  partial_count: number;
  with_attachment_count: number;
  without_attachment_count: number;
  total_amount: number;
  to_process_amount: number;
  debit_amount: number;
  credit_amount: number;
}

// =====================================================================
// Internal interfaces (exported for cross-file use)
// =====================================================================

export interface UseUnifiedTransactionsOptions {
  filters?: UnifiedFilters;
  limit?: number;
  pageSize?: 10 | 20;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseUnifiedTransactionsResult {
  // Data
  transactions: UnifiedTransaction[];
  stats: UnifiedStats | null;

  // State
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;

  // Pagination
  hasMore: boolean;
  loadMore: () => Promise<void>;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  setPageSize: (size: 10 | 20) => void;
  goToPage: (page: number) => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;

  // Actions
  refresh: () => Promise<void>;
  setFilters: (filters: UnifiedFilters) => void;
}

export interface TransactionActions {
  classify: (
    transactionId: string,
    categoryPcg: string
  ) => Promise<{ success: boolean; error?: string }>;
  linkOrganisation: (
    transactionId: string,
    organisationId: string
  ) => Promise<{ success: boolean; error?: string }>;
  ignore: (
    transactionId: string,
    reason?: string
  ) => Promise<{ success: boolean; error?: string }>;
  unignore: (
    transactionId: string
  ) => Promise<{ success: boolean; error?: string }>;
  toggleIgnore: (
    transactionId: string,
    shouldIgnore: boolean,
    reason?: string
  ) => Promise<{ success: boolean; error?: string; isLocked?: boolean }>;
  markCCA: (
    transactionId: string
  ) => Promise<{ success: boolean; error?: string }>;
}

// =====================================================================
// Constants
// =====================================================================

export const DEFAULT_LIMIT = 50;

export const _DEFAULT_STATS: UnifiedStats = {
  total_count: 0,
  to_process_count: 0,
  classified_count: 0,
  matched_count: 0,
  ignored_count: 0,
  cca_count: 0,
  partial_count: 0,
  with_attachment_count: 0,
  without_attachment_count: 0,
  total_amount: 0,
  to_process_amount: 0,
  debit_amount: 0,
  credit_amount: 0,
};
