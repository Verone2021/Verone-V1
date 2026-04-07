/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
// =====================================================================
// Fetch functions: Unified Transactions
// Pure async functions receiving supabase client + params
// =====================================================================

import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  UnifiedFilters,
  UnifiedStats,
  UnifiedTransaction,
  TransactionSide,
  UnifiedStatus,
} from './types';
import { enrichWithReconciliationLinks } from './use-transaction-enrichment';

// =====================================================================
// fetchTransactions
// =====================================================================

export interface FetchTransactionsParams {
  supabase: SupabaseClient;
  filters: UnifiedFilters;
  pageSize: number;
  currentPage: number;
  offset: number;
  append: boolean;
  targetPage?: number;
}

export interface FetchTransactionsResult {
  transactions: UnifiedTransaction[];
  count: number | null;
  newOffset: number;
  hasMore: boolean;
}

export async function fetchTransactions(
  params: FetchTransactionsParams
): Promise<FetchTransactionsResult> {
  const {
    supabase,
    filters,
    pageSize,
    currentPage,
    offset,
    append,
    targetPage,
  } = params;

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
    query = query.eq('counterparty_organisation_id', filters.organisationId);
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
      matched_document_number: tx.matched_document_number as string | null,
      matched_document_type: tx.matched_document_type as string | null,
      matched_at: null,
      confidence_score: tx.confidence_score as number | null,
      match_reason: tx.match_reason as string | null,
      matched_order_ids: null,
      // Règle appliquée (depuis la vue)
      applied_rule_id: tx.applied_rule_id as string | null,
      rule_match_value: tx.rule_match_value as string | null,
      rule_display_label: tx.rule_display_label as string | null,
      rule_allow_multiple_categories: tx.rule_allow_multiple_categories as
        | boolean
        | null,
      // Rapprochement enrichi (rempli après par enrichWithReconciliationLinks)
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
      vat_breakdown: tx.vat_breakdown as UnifiedTransaction['vat_breakdown'],
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

  // Enrichir avec rapprochement + auto-attach Qonto
  await enrichWithReconciliationLinks(supabase, transformed);

  const newOffset = currentOffset + transformed.length;
  const hasMore = count ? newOffset < count : false;

  return { transactions: transformed, count, newOffset, hasMore };
}

// =====================================================================
// fetchStats
// =====================================================================

export interface FetchStatsParams {
  supabase: SupabaseClient;
  filters: UnifiedFilters;
}

export async function fetchStats(
  params: FetchStatsParams
): Promise<UnifiedStats | null> {
  const { supabase, filters } = params;

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

    return {
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
    };
  } catch (err) {
    console.error('Failed to fetch stats:', err);
    return null;
  }
}
