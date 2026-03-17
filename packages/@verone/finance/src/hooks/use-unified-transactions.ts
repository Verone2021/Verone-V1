// =====================================================================
// Hook: Unified Transactions (Finance v2)
// Date: 2025-12-27
// Description: Source unique pour les transactions bancaires
//              Utilise la vue v_transactions_unified
// =====================================================================

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */

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

  // SLICE 5: Règle appliquée (verrouillage UI)
  applied_rule_id: string | null;
  rule_match_value: string | null;
  rule_display_label: string | null;
  rule_allow_multiple_categories: boolean | null;

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
// HELPER: Build filters for query
// =====================================================================

function _buildFilters(filters: UnifiedFilters) {
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
  goToPage: (page: number) => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;

  // Actions
  refresh: () => Promise<void>;
  setFilters: (filters: UnifiedFilters) => void;
}

const DEFAULT_LIMIT = 50;

const _DEFAULT_STATS: UnifiedStats = {
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
    limit: _limit = DEFAULT_LIMIT,
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

  // Fetch transactions from v_transactions_unified (source de vérité enrichie)
  const fetchTransactions = useCallback(
    async (append = false, targetPage?: number) => {
      try {
        if (!append) {
          setIsLoading(true);
        }

        // Calculate offset based on page or current state
        const page = targetPage ?? currentPage;
        const currentOffset = append ? offset : (page - 1) * pageSize;

        // Utiliser la vue enrichie v_transactions_unified
        // Elle inclut: organisation_name, rule_display_label, unified_status, etc.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase as any)
          .from('v_transactions_unified')
          .select('*', { count: 'exact' })
          .order('settled_at', { ascending: false, nullsFirst: false })
          .order('emitted_at', { ascending: false })
          .range(currentOffset, currentOffset + pageSize - 1);

        // Apply filters - simplifiés grâce à la vue
        if (filters.side && filters.side !== 'all') {
          query = query.eq('side', filters.side);
        }

        if (filters.hasAttachment === true) {
          query = query.eq('has_attachment', true);
        } else if (filters.hasAttachment === false) {
          query = query.eq('has_attachment', false);
        }

        if (filters.organisationId) {
          query = query.eq(
            'counterparty_organisation_id',
            filters.organisationId
          );
        }

        // Recherche: inclut organisation_name et rule_display_label
        if (filters.search) {
          query = query.or(
            `label.ilike.%${filters.search}%,counterparty_name.ilike.%${filters.search}%,reference.ilike.%${filters.search}%,organisation_name.ilike.%${filters.search}%`
          );
        }

        // Filtre par année/mois
        if (filters.year) {
          query = query.eq('year', filters.year);
        }
        if (filters.month) {
          query = query.eq('month', filters.month);
        }

        // Filtre par statut (utilise unified_status de la vue)
        if (filters.status && filters.status !== 'all') {
          query = query.eq('unified_status', filters.status);
        }

        const { data, error: fetchError, count } = await query;

        if (fetchError) throw fetchError;

        // Mapping simplifié - la vue fournit déjà tous les champs enrichis

        type TxRow = Record<string, unknown>;
        const transformed: UnifiedTransaction[] = ((data ?? []) as TxRow[]).map(
          tx => ({
            id: tx.id as string,
            transaction_id: tx.transaction_id as string,
            emitted_at: tx.emitted_at as string,
            settled_at: tx.settled_at as string | null,
            label: (tx.label as string) ?? '',
            amount: tx.amount as number,
            side: tx.side as TransactionSide,
            operation_type: tx.operation_type as string | null,
            bank_status: 'completed' as const,
            counterparty_name: tx.counterparty_name as string | null,
            counterparty_iban: tx.counterparty_iban as string | null,
            reference: tx.reference as string | null,
            category_pcg: tx.category_pcg as string | null,
            category_pcg_label: null,
            category_pcg_group: null,
            // Enrichissements depuis la vue
            counterparty_organisation_id: tx.counterparty_organisation_id as
              | string
              | null,
            organisation_name: tx.organisation_name as string | null,
            organisation_roles: [] as string[],
            has_attachment: (tx.has_attachment as boolean) ?? false,
            attachment_count: (tx.attachment_count as number) ?? 0,
            attachment_ids: tx.attachment_ids as string[] | null,
            justification_optional: tx.justification_optional as boolean | null,
            matching_status: tx.matching_status as string,
            matched_document_id: tx.matched_document_id as string | null,
            matched_document_number: tx.matched_document_number as
              | string
              | null,
            matched_document_type: tx.matched_document_type as string | null,
            matched_at: null,
            confidence_score: tx.confidence_score as number | null,
            match_reason: tx.match_reason as string | null,
            matched_order_ids: null,
            // Règle appliquée (depuis la vue)
            applied_rule_id: tx.applied_rule_id as string | null,
            rule_match_value: tx.rule_match_value as string | null,
            rule_display_label: tx.rule_display_label as string | null,
            rule_allow_multiple_categories:
              tx.rule_allow_multiple_categories as boolean | null,
            // Statut unifié (calculé par la vue)
            unified_status: tx.unified_status as UnifiedStatus,
            // TVA
            vat_rate: tx.vat_rate as number | null,
            amount_ht: tx.amount_ht as number | null,
            amount_vat: tx.amount_vat as number | null,
            vat_breakdown:
              tx.vat_breakdown as UnifiedTransaction['vat_breakdown'],
            payment_method: tx.payment_method as string | null,
            nature: tx.nature as string | null,
            note: (tx.note as string | null) ?? null,
            vat_source: (tx.vat_source as string | null) ?? null,
            // Période (calculée par la vue)
            year: tx.year as number,
            month: tx.month as number,
            raw_data: (tx.raw_data as Record<string, unknown>) ?? {},
            created_at: tx.created_at as string,
            updated_at: tx.updated_at as string,
          })
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

  // Fetch stats depuis v_transactions_unified (avec filtres appliqués)
  const fetchStats = useCallback(async () => {
    try {
      // Helper pour créer une requête avec les filtres appliqués

      const createFilteredQuery = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase as any)
          .from('v_transactions_unified')
          .select('*', { count: 'exact', head: true });

        // Appliquer filtre année
        if (filters.year) {
          query = query.eq('year', filters.year);
        }

        // Appliquer filtre side (entrées/sorties)
        if (filters.side && filters.side !== 'all') {
          query = query.eq('side', filters.side);
        }

        // Appliquer filtre recherche
        if (filters.search) {
          query = query.ilike('label', `%${filters.search}%`);
        }

        return query;
      };

      // Compter par statut depuis la vue avec les filtres
      type CountResult = { count: number | null };
      const [
        { count: total },
        { count: toProcess },
        { count: classified },
        { count: matched },
        { count: ignored },
        { count: cca },
        { count: withAttachment },
      ] = (await Promise.all([
        createFilteredQuery(),
        createFilteredQuery().eq('unified_status', 'to_process'),
        createFilteredQuery().eq('unified_status', 'classified'),
        createFilteredQuery().eq('unified_status', 'matched'),
        createFilteredQuery().eq('unified_status', 'ignored'),
        createFilteredQuery().eq('unified_status', 'cca'),
        createFilteredQuery().eq('has_attachment', true),
      ])) as CountResult[];

      setStats({
        total_count: total ?? 0,
        to_process_count: toProcess ?? 0,
        classified_count: classified ?? 0,
        matched_count: matched ?? 0,
        ignored_count: ignored ?? 0,
        cca_count: cca ?? 0,
        partial_count: 0,
        with_attachment_count: withAttachment ?? 0,
        without_attachment_count: (total ?? 0) - (withAttachment ?? 0),
        total_amount: 0,
        to_process_amount: 0,
        debit_amount: 0,
        credit_amount: 0,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [supabase, filters]);

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

  const setPageSize = useCallback((size: 10 | 20) => {
    setPageSizeState(size);
    setCurrentPage(1);
    // Refetch will happen via useEffect dependency
  }, []);

  // Initial load and when filters/pageSize change
  useEffect(() => {
    setCurrentPage(1);
    void fetchTransactions(false, 1);
    void fetchStats();
  }, [filters, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      void refresh();
    }, refreshInterval);
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
            match_reason: reason ?? 'Ignore manuellement',
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
        // Use standard Supabase RPC call pattern with type assertion
        const { data, error } = (await (supabase.rpc as CallableFunction)(
          'toggle_ignore_transaction',
          {
            p_tx_id: transactionId,
            p_ignore: shouldIgnore,
            p_reason: reason ?? null,
          }
        )) as { data: unknown; error: { message: string } | null };

        if (error) {
          // Check for fiscal year lock error
          const errorMsg = error.message ?? String(error);
          if (errorMsg.includes('clôturée')) {
            return {
              success: false,
              error: errorMsg,
              isLocked: true,
            };
          }
          throw new Error(errorMsg);
        }

        const result = data as { success?: boolean } | null;
        return { success: result?.success ?? true };
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
