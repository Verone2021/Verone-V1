'use client';

import { useCallback, useRef } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import toast from 'react-hot-toast';

import type { CreditTransaction, ExistingLink, OrderForLink } from './types';

// =====================================================================
// FETCHERS HOOK — Supabase fetch callbacks isolated for readability
// =====================================================================

interface UseFetchersParams {
  order: OrderForLink | null;
  orderType: 'sales_order' | 'purchase_order' | 'avoir';
  onLinksChanged?: (links: ExistingLink[]) => void;
  onSuccess?: () => void;
  setTransactions: (txs: CreditTransaction[]) => void;
  setIsLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setLinkedTxIds: (fn: (prev: Set<string>) => Set<string>) => void;
  setExistingLinksLocal: (links: ExistingLink[]) => void;
  setUnlinkingId: (id: string | null) => void;
}

export function useRapprochementFetchers({
  order,
  orderType,
  onLinksChanged,
  onSuccess,
  setTransactions,
  setIsLoading,
  setError,
  setLinkedTxIds,
  setExistingLinksLocal,
  setUnlinkingId,
}: UseFetchersParams) {
  const supabase = createClient();

  // Stable ref for onLinksChanged to avoid re-triggering effects
  const onLinksChangedRef = useRef(onLinksChanged);
  onLinksChangedRef.current = onLinksChanged;

  const fetchTransactions = useCallback(async () => {
    if (!order) return;

    setIsLoading(true);
    setError(null);

    try {
      const isDebitOrder =
        orderType === 'purchase_order' || orderType === 'avoir';
      const transactionSide = isDebitOrder ? 'debit' : 'credit';
      const amountForRange =
        orderType === 'avoir' ? order.total_ttc : Math.abs(order.total_ttc);
      const fields =
        'id, transaction_id, label, amount, counterparty_name, emitted_at, settled_at, unified_status';

      const recentQuery = supabase
        .from('v_transactions_unified')
        .select(fields)
        .eq('side', transactionSide)
        .in('unified_status', ['to_process', 'classified'])
        .order('settled_at', { ascending: false, nullsFirst: false })
        .limit(100);

      const amountQuery = supabase
        .from('v_transactions_unified')
        .select(fields)
        .eq('side', transactionSide)
        .in('unified_status', ['to_process', 'classified'])
        .gte('amount', amountForRange - 1)
        .lte('amount', amountForRange + 1)
        .order('settled_at', { ascending: false, nullsFirst: false })
        .limit(30);

      const [recentResult, amountResult] = await Promise.all([
        recentQuery,
        amountQuery,
      ]);

      if (recentResult.error) throw recentResult.error;

      const recentTxs = (recentResult.data as CreditTransaction[]) ?? [];
      const amountTxs = (amountResult.data as CreditTransaction[]) ?? [];
      const recentIds = new Set(recentTxs.map(t => t.id));
      const extraAmountTxs = amountTxs.filter(t => !recentIds.has(t.id));

      setTransactions([...recentTxs, ...extraAmountTxs]);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Erreur lors du chargement des transactions');
    } finally {
      setIsLoading(false);
    }
  }, [order, supabase, orderType, setTransactions, setIsLoading, setError]);

  const fetchLinkedIds = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('transaction_document_links')
        .select('transaction_id');

      if (data) {
        setLinkedTxIds(() => new Set(data.map(row => row.transaction_id)));
      }
    } catch (err) {
      console.error('Error fetching linked transaction IDs:', err);
    }
  }, [supabase, setLinkedTxIds]);

  const fetchExistingLinks = useCallback(async () => {
    if (!order) return;
    try {
      const orderIdField =
        orderType === 'purchase_order' ? 'purchase_order_id' : 'sales_order_id';
      const { data } = await supabase
        .from('v_transactions_unified')
        .select(
          'id, transaction_id, label, amount, counterparty_name, emitted_at, settled_at, bank_provider, transaction_document_links!inner(id, allocated_amount)'
        )
        .eq(`transaction_document_links.${orderIdField}`, order.id);

      if (data) {
        const links: ExistingLink[] = data.map(row => {
          const linkData = Array.isArray(row.transaction_document_links)
            ? row.transaction_document_links[0]
            : row.transaction_document_links;
          const ld = linkData as Record<string, unknown> | undefined;
          return {
            id: (ld?.id as string) ?? row.id,
            transaction_id: row.transaction_id ?? '',
            transaction_label: row.label ?? '',
            counterparty_name: row.counterparty_name,
            transaction_date: row.settled_at ?? row.emitted_at ?? '',
            allocated_amount:
              (ld?.allocated_amount as number | null) ??
              Math.abs(row.amount ?? 0),
            bank_provider:
              ((row as Record<string, unknown>).bank_provider as
                | string
                | null) ?? null,
          };
        });
        setExistingLinksLocal(links);
        onLinksChangedRef.current?.(links);
      }
    } catch (err) {
      console.error('Error fetching existing links:', err);
    }
  }, [order, orderType, supabase, setExistingLinksLocal]);

  const handleUnlink = useCallback(
    async (linkId: string) => {
      if (!order) return;
      setUnlinkingId(linkId);
      try {
        const { error: unlinkError } = await supabase.rpc(
          'unlink_transaction_document',
          { p_link_id: linkId }
        );

        if (unlinkError) throw unlinkError;

        toast.success('Transaction déliée');
        await fetchExistingLinks();
        await fetchLinkedIds();
        onSuccess?.();
      } catch (err) {
        console.error('Error unlinking transaction:', err);
        toast.error('Erreur lors du déliage');
      } finally {
        setUnlinkingId(null);
      }
    },
    [
      order,
      supabase,
      fetchExistingLinks,
      fetchLinkedIds,
      onSuccess,
      setUnlinkingId,
    ]
  );

  return {
    fetchTransactions,
    fetchLinkedIds,
    fetchExistingLinks,
    handleUnlink,
  };
}
