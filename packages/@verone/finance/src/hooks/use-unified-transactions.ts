// =====================================================================
// Hook: Unified Transactions (Finance v2)
// Date: 2025-12-27
// Description: Source unique pour les transactions bancaires
//              Utilise la vue v_transactions_unified
// =====================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';

import { createClient } from '@verone/utils/supabase/client';

// =====================================================================
// TYPES
// =====================================================================

export type UnifiedStatus =
  | 'to_process'
  | 'classified'
  | 'matched'
  | 'ignored'
  | 'cca'
  | 'partial';

export type TransactionSide = 'credit' | 'debit';

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

  // Statut unifie
  unified_status: UnifiedStatus;

  // Montants TVA
  vat_rate: number | null;
  amount_ht: number | null;
  amount_vat: number | null;
  payment_method: string | null;
  nature: string | null;

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
// HELPER: Build filters for query
// =====================================================================

function buildFilters(filters: UnifiedFilters) {
  const conditions: string[] = [];

  if (filters.status && filters.status !== 'all') {
    conditions.push(`unified_status.eq.${filters.status}`);
  }

  if (filters.side && filters.side !== 'all') {
    conditions.push(`side.eq.${filters.side}`);
  }

  if (filters.hasAttachment !== null && filters.hasAttachment !== undefined) {
    conditions.push(`has_attachment.eq.${filters.hasAttachment}`);
  }

  if (filters.year) {
    conditions.push(`year.eq.${filters.year}`);
  }

  if (filters.month) {
    conditions.push(`month.eq.${filters.month}`);
  }

  if (filters.organisationId) {
    conditions.push(
      `counterparty_organisation_id.eq.${filters.organisationId}`
    );
  }

  return conditions;
}

// =====================================================================
// HOOK: useUnifiedTransactions
// =====================================================================

interface UseUnifiedTransactionsOptions {
  filters?: UnifiedFilters;
  limit?: number;
  pageSize?: 10 | 20;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseUnifiedTransactionsResult {
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
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;

  // Actions
  refresh: () => Promise<void>;
  setFilters: (filters: UnifiedFilters) => void;
}

const DEFAULT_LIMIT = 50;

const DEFAULT_STATS: UnifiedStats = {
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

export function useUnifiedTransactions(
  options: UseUnifiedTransactionsOptions = {}
): UseUnifiedTransactionsResult {
  const {
    filters: initialFilters = {},
    limit = DEFAULT_LIMIT,
    pageSize: initialPageSize = 20,
    autoRefresh = false,
    refreshInterval = 30000,
  } = options;

  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [stats, setStats] = useState<UnifiedStats | null>(null);
  const [filters, setFilters] = useState<UnifiedFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSizeState] = useState<10 | 20>(initialPageSize);
  const [currentPage, setCurrentPage] = useState(1);

  const supabase = useMemo(() => createClient(), []);

  // Calculated values
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Fetch transactions
  const fetchTransactions = useCallback(
    async (append = false, targetPage?: number) => {
      try {
        if (!append) {
          setIsLoading(true);
        }

        // Calculate offset based on page or current state
        const page = targetPage ?? currentPage;
        const currentOffset = append ? offset : (page - 1) * pageSize;

        // Build query - utilise bank_transactions directement
        // Note: Les types Supabase ne sont pas à jour, on utilise any pour les champs manquants
        let query = supabase
          .from('bank_transactions')
          .select(
            `
            id,
            transaction_id,
            emitted_at,
            settled_at,
            label,
            amount,
            side,
            operation_type,
            counterparty_name,
            counterparty_iban,
            reference,
            category_pcg,
            has_attachment,
            attachment_ids,
            matching_status,
            matched_document_id,
            confidence_score,
            match_reason,
            vat_rate,
            amount_ht,
            amount_vat,
            payment_method,
            nature,
            raw_data,
            created_at,
            updated_at
          `,
            { count: 'exact' }
          )
          .order('settled_at', { ascending: false, nullsFirst: false })
          .order('emitted_at', { ascending: false })
          .range(currentOffset, currentOffset + pageSize - 1);

        // Apply filters
        if (filters.side && filters.side !== 'all') {
          query = query.eq('side', filters.side);
        }

        if (filters.hasAttachment === true) {
          query = query.eq('has_attachment', true);
        } else if (filters.hasAttachment === false) {
          query = query.or('has_attachment.is.null,has_attachment.eq.false');
        }

        if (filters.organisationId) {
          query = query.eq(
            'counterparty_organisation_id',
            filters.organisationId
          );
        }

        if (filters.search) {
          query = query.or(
            `label.ilike.%${filters.search}%,counterparty_name.ilike.%${filters.search}%,reference.ilike.%${filters.search}%`
          );
        }

        // Apply status filter (computed unified_status)
        if (filters.status && filters.status !== 'all') {
          switch (filters.status) {
            case 'to_process':
              query = query
                .is('category_pcg', null)
                .is('counterparty_organisation_id', null)
                .neq('matching_status', 'ignored')
                .is('matched_document_id', null);
              break;
            case 'classified':
              query = query
                .or(
                  'category_pcg.not.is.null,counterparty_organisation_id.not.is.null'
                )
                .is('matched_document_id', null)
                .neq('category_pcg', '455');
              break;
            case 'matched':
              query = query.not('matched_document_id', 'is', null);
              break;
            case 'ignored':
              query = query.eq('matching_status', 'ignored');
              break;
            case 'cca':
              query = query.eq('category_pcg', '455');
              break;
          }
        }

        const { data, error: fetchError, count } = await query;

        if (fetchError) throw fetchError;

        // Transform data to UnifiedTransaction format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transformed: UnifiedTransaction[] = (data || []).map(
          (tx: any) => {
            const date = tx.settled_at || tx.emitted_at;

            // Compute unified_status
            let unified_status: UnifiedStatus = 'to_process';
            if (tx.category_pcg === '455') {
              unified_status = 'cca';
            } else if (tx.matching_status === 'ignored') {
              unified_status = 'ignored';
            } else if (tx.matched_document_id) {
              unified_status = 'matched';
            } else if (tx.matching_status === 'partial_matched') {
              unified_status = 'partial';
            } else if (tx.category_pcg) {
              unified_status = 'classified';
            }

            return {
              id: tx.id,
              transaction_id: tx.transaction_id,
              emitted_at: tx.emitted_at,
              settled_at: tx.settled_at,
              label: tx.label || '',
              amount: tx.amount,
              side: tx.side as TransactionSide,
              operation_type: tx.operation_type,
              bank_status: 'completed',
              counterparty_name: tx.counterparty_name,
              counterparty_iban: tx.counterparty_iban,
              reference: tx.reference,
              category_pcg: tx.category_pcg,
              category_pcg_label: null,
              category_pcg_group: null,
              counterparty_organisation_id: null, // TODO: add when column exists
              organisation_name: null,
              organisation_roles: [],
              // has_attachment: true if has_attachment flag OR attachment_ids not empty
              has_attachment:
                tx.has_attachment === true ||
                (tx.attachment_ids?.length ?? 0) > 0,
              attachment_count: tx.attachment_ids?.length || 0,
              attachment_ids: tx.attachment_ids,
              justification_optional: null,
              matching_status: tx.matching_status,
              matched_document_id: tx.matched_document_id,
              matched_document_number: null,
              matched_document_type: null,
              matched_at: null,
              confidence_score: tx.confidence_score,
              match_reason: tx.match_reason,
              matched_order_ids: null,
              unified_status,
              vat_rate: tx.vat_rate,
              amount_ht: tx.amount_ht,
              amount_vat: tx.amount_vat,
              payment_method: tx.payment_method,
              nature: tx.nature,
              year: new Date(date).getFullYear(),
              month: new Date(date).getMonth() + 1,
              raw_data: tx.raw_data || {},
              created_at: tx.created_at,
              updated_at: tx.updated_at,
            };
          }
        );

        if (append) {
          setTransactions(prev => [...prev, ...transformed]);
        } else {
          setTransactions(transformed);
        }

        // Store total count for pagination
        if (count !== null) {
          setTotalCount(count);
        }

        setOffset(currentOffset + transformed.length);
        setHasMore(count ? currentOffset + transformed.length < count : false);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [supabase, filters, pageSize, offset, currentPage]
  );

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      // Count stats (no 'status' column - all synced transactions are settled)
      const { count: total } = await supabase
        .from('bank_transactions')
        .select('*', { count: 'exact', head: true });

      const { count: toProcess } = await supabase
        .from('bank_transactions')
        .select('*', { count: 'exact', head: true })
        .is('category_pcg', null)
        .is('counterparty_organisation_id', null)
        .neq('matching_status', 'ignored')
        .is('matched_document_id', null);

      const { count: classified } = await supabase
        .from('bank_transactions')
        .select('*', { count: 'exact', head: true })
        .or('category_pcg.not.is.null,counterparty_organisation_id.not.is.null')
        .is('matched_document_id', null)
        .neq('category_pcg', '455');

      const { count: matched } = await supabase
        .from('bank_transactions')
        .select('*', { count: 'exact', head: true })
        .not('matched_document_id', 'is', null);

      const { count: ignored } = await supabase
        .from('bank_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('matching_status', 'ignored');

      const { count: cca } = await supabase
        .from('bank_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('category_pcg', '455');

      // Count transactions with attachments: fetch has_attachment and attachment_ids, count client-side
      // PostgREST doesn't support array length checks, so we count after fetching
      const { data: attachmentData } = await supabase
        .from('bank_transactions')
        .select('id, has_attachment, attachment_ids');

      const withAttachmentCount = (attachmentData || []).filter(
        tx =>
          tx.has_attachment === true ||
          (tx.attachment_ids && tx.attachment_ids.length > 0)
      ).length;

      setStats({
        total_count: total || 0,
        to_process_count: toProcess || 0,
        classified_count: classified || 0,
        matched_count: matched || 0,
        ignored_count: ignored || 0,
        cca_count: cca || 0,
        partial_count: 0, // TODO
        with_attachment_count: withAttachmentCount,
        without_attachment_count: (total || 0) - withAttachmentCount,
        total_amount: 0, // TODO: sum
        to_process_amount: 0,
        debit_amount: 0,
        credit_amount: 0,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [supabase]);

  // Refresh
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchTransactions(false), fetchStats()]);
  }, [fetchTransactions, fetchStats]);

  // Load more (for infinite scroll - legacy)
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchTransactions(true);
  }, [fetchTransactions, hasMore, isLoading]);

  // Pagination functions
  const goToPage = useCallback(
    async (page: number) => {
      if (page < 1 || page > totalPages || isLoading) return;
      setCurrentPage(page);
      await fetchTransactions(false, page);
    },
    [fetchTransactions, totalPages, isLoading]
  );

  const nextPage = useCallback(async () => {
    if (currentPage < totalPages) {
      await goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  const prevPage = useCallback(async () => {
    if (currentPage > 1) {
      await goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  const setPageSize = useCallback(async (size: 10 | 20) => {
    setPageSizeState(size);
    setCurrentPage(1);
    // Refetch will happen via useEffect dependency
  }, []);

  // Initial load and when filters/pageSize change
  useEffect(() => {
    setCurrentPage(1);
    fetchTransactions(false, 1);
    fetchStats();
  }, [filters, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  return {
    transactions,
    stats,
    isLoading,
    isRefreshing,
    error,
    hasMore,
    loadMore,
    totalCount,
    currentPage,
    totalPages,
    pageSize,
    setPageSize,
    goToPage,
    nextPage,
    prevPage,
    refresh,
    setFilters,
  };
}

// =====================================================================
// HOOK: useTransactionActions
// =====================================================================

interface TransactionActions {
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

export function useTransactionActions(): TransactionActions {
  const supabase = useMemo(() => createClient(), []);

  const classify = useCallback(
    async (transactionId: string, categoryPcg: string) => {
      try {
        const { error } = await supabase
          .from('bank_transactions')
          .update({
            category_pcg: categoryPcg,
            updated_at: new Date().toISOString(),
          })
          .eq('id', transactionId);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    },
    [supabase]
  );

  const linkOrganisation = useCallback(
    async (transactionId: string, organisationId: string) => {
      try {
        const { error } = await supabase
          .from('bank_transactions')
          .update({
            counterparty_organisation_id: organisationId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', transactionId);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    },
    [supabase]
  );

  const ignore = useCallback(
    async (transactionId: string, reason?: string) => {
      try {
        const { error } = await supabase
          .from('bank_transactions')
          .update({
            matching_status: 'ignored',
            match_reason: reason || 'Ignore manuellement',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transactionId);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    },
    [supabase]
  );

  const unignore = useCallback(
    async (transactionId: string) => {
      try {
        const { error } = await supabase
          .from('bank_transactions')
          .update({
            matching_status: 'unmatched',
            match_reason: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', transactionId);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    },
    [supabase]
  );

  // Toggle ignore using RPC (with fiscal year lock check)
  // Uses RPC to ensure fiscal lock is enforced server-side
  const toggleIgnore = useCallback(
    async (transactionId: string, shouldIgnore: boolean, reason?: string) => {
      try {
        // Cast to bypass TypeScript strict typing for RPC not yet in generated types
        const rpc = supabase.rpc as unknown as (
          fn: string,
          args?: Record<string, unknown>
        ) => Promise<{ data: unknown; error: { message: string } | null }>;

        const args: Record<string, unknown> = {
          p_tx_id: transactionId,
          p_ignore: shouldIgnore,
          p_reason: reason || null,
        };

        const response = await rpc('toggle_ignore_transaction', args);
        const data = response.data as { success?: boolean } | null;
        const error = response.error;

        if (error) {
          // Check for fiscal year lock error
          if (error.message?.includes('clôturée')) {
            return {
              success: false,
              error: error.message,
              isLocked: true,
            };
          }
          throw new Error(error.message);
        }

        return { success: data?.success ?? true };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        // Check for fiscal year lock error
        if (errorMessage.includes('clôturée')) {
          return {
            success: false,
            error: errorMessage,
            isLocked: true,
          };
        }
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [supabase]
  );

  const markCCA = useCallback(
    async (transactionId: string) => {
      try {
        const { error } = await supabase
          .from('bank_transactions')
          .update({
            category_pcg: '455',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transactionId);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    },
    [supabase]
  );

  return {
    classify,
    linkOrganisation,
    ignore,
    unignore,
    toggleIgnore,
    markCCA,
  };
}

// =====================================================================
// EXPORTS
// =====================================================================

export type {
  UseUnifiedTransactionsOptions,
  UseUnifiedTransactionsResult,
  TransactionActions,
};
