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
            // Rapprochement enrichi (rempli après)
            reconciliation_link_count: 0,
            reconciliation_total_allocated: 0,
            reconciliation_remaining: Math.abs(tx.amount as number),
            reconciliation_vat_rates: [],
            reconciliation_links: [],
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

        // Enrichir avec les données de rapprochement (transaction_document_links)
        const txIds = transformed.map(t => t.id);
        if (txIds.length > 0) {
          const { data: linksAgg } = await supabase
            .from('transaction_document_links')
            .select(
              'id, transaction_id, allocated_amount, document_id, sales_order_id, purchase_order_id, link_type'
            )
            .in('transaction_id', txIds);

          if (linksAgg && linksAgg.length > 0) {
            // Récupérer les détails des entités liées (documents, commandes, PO)
            const allDocIds = [
              ...new Set(
                linksAgg
                  .filter(l => l.document_id)
                  .map(l => l.document_id as string)
              ),
            ];
            const allSoIds = [
              ...new Set(
                linksAgg
                  .filter(l => l.sales_order_id)
                  .map(l => l.sales_order_id as string)
              ),
            ];
            const allPoIds = [
              ...new Set(
                linksAgg
                  .filter(l => l.purchase_order_id)
                  .map(l => l.purchase_order_id as string)
              ),
            ];

            type EntityDetail = {
              label: string;
              partner_name: string | null;
              total_ht: number;
              total_ttc: number;
              vat_rate: number;
            };
            const entityDetails = new Map<string, EntityDetail>();

            if (allDocIds.length > 0) {
              const { data: docs } = await supabase
                .from('financial_documents')
                .select(
                  'id, document_number, total_ht, total_ttc, partner_id, organisations!partner_id(legal_name, trade_name)'
                )
                .in('id', allDocIds);
              docs?.forEach(d => {
                const ht = Number(d.total_ht) || 0;
                const ttc = Number(d.total_ttc) || 0;
                const org = d.organisations as {
                  legal_name: string;
                  trade_name: string | null;
                } | null;
                entityDetails.set(d.id, {
                  label: d.document_number ?? 'Document',
                  partner_name: org?.trade_name ?? org?.legal_name ?? null,
                  total_ht: ht,
                  total_ttc: ttc,
                  vat_rate: ht > 0 ? Math.round(((ttc - ht) / ht) * 100) : 0,
                });
              });
            }
            if (allSoIds.length > 0) {
              const { data: sos } = await supabase
                .from('sales_orders')
                .select(
                  'id, order_number, total_ht, total_ttc, customer_id, customer_type'
                )
                .in('id', allSoIds);
              if (sos) {
                const orgCustIds = sos
                  .filter(s => s.customer_type === 'organization')
                  .map(s => s.customer_id)
                  .filter(Boolean) as string[];
                const orgNames = new Map<string, string>();
                if (orgCustIds.length > 0) {
                  const { data: orgs } = await supabase
                    .from('organisations')
                    .select('id, legal_name, trade_name')
                    .in('id', orgCustIds);
                  orgs?.forEach(o =>
                    orgNames.set(o.id, o.trade_name ?? o.legal_name)
                  );
                }
                sos.forEach(s => {
                  const ht = Number(s.total_ht) || 0;
                  const ttc = Number(s.total_ttc) || 0;
                  entityDetails.set(s.id, {
                    label: `SO-${s.order_number}`,
                    partner_name:
                      s.customer_type === 'organization'
                        ? (orgNames.get(s.customer_id as string) ?? null)
                        : null,
                    total_ht: ht,
                    total_ttc: ttc,
                    vat_rate: ht > 0 ? Math.round(((ttc - ht) / ht) * 100) : 0,
                  });
                });
              }
            }
            if (allPoIds.length > 0) {
              const { data: pos } = await supabase
                .from('purchase_orders')
                .select(
                  'id, po_number, total_ht, total_ttc, supplier_id, organisations!supplier_id(legal_name, trade_name)'
                )
                .in('id', allPoIds);
              pos?.forEach(p => {
                const ht = Number(p.total_ht) || 0;
                const ttc = Number(p.total_ttc) || 0;
                const org = p.organisations as {
                  legal_name: string;
                  trade_name: string | null;
                } | null;
                entityDetails.set(p.id, {
                  label: `PO-${p.po_number}`,
                  partner_name: org?.trade_name ?? org?.legal_name ?? null,
                  total_ht: ht,
                  total_ttc: ttc,
                  vat_rate: ht > 0 ? Math.round(((ttc - ht) / ht) * 100) : 0,
                });
              });
            }

            // Grouper par transaction et construire les détails
            const linksByTx = new Map<
              string,
              {
                count: number;
                total: number;
                details: ReconciliationLinkDetail[];
              }
            >();
            for (const link of linksAgg) {
              const txId = link.transaction_id;
              const existing = linksByTx.get(txId) ?? {
                count: 0,
                total: 0,
                details: [],
              };
              existing.count += 1;
              const allocAmt = Math.abs(Number(link.allocated_amount) || 0);
              existing.total += allocAmt;

              // Résoudre l'entité liée
              const entityId = (link.document_id ??
                link.sales_order_id ??
                link.purchase_order_id) as string;
              const detail = entityDetails.get(entityId);
              existing.details.push({
                id: link.id,
                link_type:
                  link.link_type as ReconciliationLinkDetail['link_type'],
                allocated_amount: allocAmt,
                label: detail?.label ?? 'Inconnu',
                partner_name: detail?.partner_name ?? null,
                total_ht: detail?.total_ht ?? 0,
                total_ttc: detail?.total_ttc ?? 0,
                vat_rate: detail?.vat_rate ?? 0,
              });

              linksByTx.set(txId, existing);
            }

            // Appliquer sur les transactions
            for (const tx of transformed) {
              const info = linksByTx.get(tx.id);
              if (info) {
                tx.reconciliation_link_count = info.count;
                tx.reconciliation_total_allocated = info.total;
                tx.reconciliation_remaining = Math.abs(tx.amount) - info.total;
                tx.reconciliation_links = info.details;

                const vatRates = new Set<number>();
                for (const d of info.details) {
                  if (d.vat_rate !== undefined) vatRates.add(d.vat_rate);
                }
                tx.reconciliation_vat_rates = [...vatRates].sort(
                  (a, b) => a - b
                );
              }
            }
          }
        }

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
