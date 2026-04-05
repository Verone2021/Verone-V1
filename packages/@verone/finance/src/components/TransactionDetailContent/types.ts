import type { UnifiedTransaction } from '../../hooks/use-unified-transactions';

// =====================================================================
// TYPES — TransactionDetailContent
// =====================================================================

export interface ApiErrorResponse {
  error?: string;
}

export interface TransactionDetailContentProps {
  transaction: UnifiedTransaction;
  onRefresh: () => Promise<void>;
  suggestionsMap?: Map<
    string,
    { matchedRule?: { id: string } | null } | undefined
  >;
  autoOpenRapprochement?: boolean;
  autoOpenUpload?: boolean;
  /** compact=true for Sheet (360px), compact=false for Dialog (672px) */
  compact?: boolean;
}
