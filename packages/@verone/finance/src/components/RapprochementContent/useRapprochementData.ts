'use client';

import { useState, useEffect, useMemo, useRef } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import toast from 'react-hot-toast';

import { extractSearchKeyword } from './helpers';
import { calculateMatch } from './scoring';
import type {
  CreditTransaction,
  ExistingLink,
  OrderForLink,
  TransactionSuggestion,
} from './types';
import { useRapprochementFetchers } from './useRapprochementFetchers';

// =====================================================================
// HOOK — State, effects, memos, and handleLink for RapprochementContent
// Fetch callbacks are delegated to useRapprochementFetchers
// =====================================================================

export interface UseRapprochementDataReturn {
  isLoading: boolean;
  isSearching: boolean;
  isLinking: boolean;
  linkSuccess: { transactionLabel: string; transactionAmount: number } | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  error: string | null;
  existingLinksLocal: ExistingLink[];
  unlinkingId: string | null;
  allTransactions: CreditTransaction[];
  suggestions: TransactionSuggestion[];
  filteredSuggestions: TransactionSuggestion[];
  otherTransactions: CreditTransaction[];
  handleLink: (transactionId: string) => Promise<void>;
  handleUnlink: (linkId: string) => Promise<void>;
}

export function useRapprochementData(
  order: OrderForLink | null,
  orderType: 'sales_order' | 'purchase_order' | 'avoir',
  onSuccess?: () => void,
  onLinksChanged?: (links: ExistingLink[]) => void
): UseRapprochementDataReturn {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [searchResults, setSearchResults] = useState<CreditTransaction[]>([]);
  const [linkedTxIds, setLinkedTxIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState<{
    transactionLabel: string;
    transactionAmount: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [existingLinksLocal, setExistingLinksLocal] = useState<ExistingLink[]>(
    []
  );
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supabase = createClient();

  const {
    fetchTransactions,
    fetchLinkedIds,
    fetchExistingLinks,
    handleUnlink,
  } = useRapprochementFetchers({
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
  });

  useEffect(() => {
    if (order) {
      void fetchTransactions();
      void fetchLinkedIds();
      void fetchExistingLinks();
    }
  }, [order, fetchTransactions, fetchLinkedIds, fetchExistingLinks]);

  // Server-side search: when user types >= 3 chars, search ALL transactions in DB
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (searchQuery.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const transactionSide =
      orderType === 'purchase_order' || orderType === 'avoir'
        ? 'debit'
        : 'credit';

    searchTimerRef.current = setTimeout(() => {
      const runSearch = async () => {
        try {
          const pattern = `%${searchQuery}%`;

          let orFilter = `label.ilike.${pattern},counterparty_name.ilike.${pattern}`;

          if (order?.customer_name_alt) {
            const altKeyword = extractSearchKeyword(
              '',
              order.customer_name_alt
            );
            if (altKeyword && altKeyword !== searchQuery.toLowerCase()) {
              const altPattern = `%${altKeyword}%`;
              orFilter += `,label.ilike.${altPattern},counterparty_name.ilike.${altPattern}`;
            }
          }

          const { data, error: searchError } = await supabase
            .from('v_transactions_unified')
            .select(
              'id, transaction_id, label, amount, counterparty_name, emitted_at, settled_at, unified_status'
            )
            .eq('side', transactionSide)
            .in('unified_status', ['to_process', 'classified'])
            .or(orFilter)
            .order('settled_at', { ascending: false, nullsFirst: false })
            .limit(50);

          if (searchError) throw searchError;
          setSearchResults((data as CreditTransaction[]) ?? []);
        } catch (err) {
          console.error('[RapprochementContent] Server search failed:', err);
        } finally {
          setIsSearching(false);
        }
      };

      void runSearch();
    }, 300);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchQuery, orderType, supabase, order]);

  // Merge recent transactions + search results, deduplicate by id,
  // and EXCLUDE transactions already linked to another order
  const allTransactions = useMemo(() => {
    let merged: CreditTransaction[];
    if (searchResults.length === 0) {
      merged = transactions;
    } else {
      const recentIds = new Set(transactions.map(t => t.id));
      const extras = searchResults.filter(t => !recentIds.has(t.id));
      merged = [...transactions, ...extras];
    }

    if (linkedTxIds.size > 0) {
      return merged.filter(t => !linkedTxIds.has(t.id));
    }
    return merged;
  }, [transactions, searchResults, linkedTxIds]);

  const suggestions = useMemo(() => {
    if (!order || allTransactions.length === 0) return [];

    const withScores: TransactionSuggestion[] = allTransactions
      .map(tx => {
        const { priority, score, reasons, sortOrder } = calculateMatch(
          order,
          tx,
          allTransactions,
          orderType
        );
        return {
          ...tx,
          matchPriority: priority,
          matchScore: score,
          matchReasons: reasons,
          sortOrder,
        };
      })
      .filter(
        tx => tx.matchPriority !== 'none' && tx.matchPriority !== 'excluded'
      );

    return withScores.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [order, allTransactions, orderType]);

  const filteredSuggestions = useMemo(() => {
    if (!searchQuery) return suggestions;

    const query = searchQuery.toLowerCase();
    return suggestions.filter(
      tx =>
        (tx.label?.toLowerCase().includes(query) ?? false) ||
        (tx.counterparty_name?.toLowerCase().includes(query) ?? false) ||
        (tx.transaction_id?.toLowerCase().includes(query) ?? false)
    );
  }, [suggestions, searchQuery]);

  const otherTransactions = useMemo(() => {
    const suggestionIds = new Set(suggestions.map(s => s.id));
    let others = allTransactions.filter(tx => !suggestionIds.has(tx.id));

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      others = others.filter(
        tx =>
          (tx.label?.toLowerCase().includes(query) ?? false) ||
          (tx.counterparty_name?.toLowerCase().includes(query) ?? false) ||
          (tx.transaction_id?.toLowerCase().includes(query) ?? false)
      );
    }
    return others;
  }, [allTransactions, suggestions, searchQuery]);

  const handleLink = async (transactionId: string) => {
    if (!order) return;

    setIsLinking(true);

    try {
      const linkedTx = allTransactions.find(t => t.id === transactionId);
      const transactionAmount = linkedTx ? Math.abs(linkedTx.amount) : 0;

      if (transactionAmount <= 0) {
        toast.error('Montant de transaction invalide');
        setIsLinking(false);
        return;
      }

      const rpcParams =
        orderType === 'purchase_order'
          ? {
              p_transaction_id: transactionId,
              p_purchase_order_id: order.id,
              p_allocated_amount: transactionAmount,
            }
          : {
              p_transaction_id: transactionId,
              p_sales_order_id: order.id,
              p_allocated_amount: transactionAmount,
            };

      const { error: linkError } = await supabase.rpc(
        'link_transaction_to_document',
        rpcParams
      );

      if (linkError) throw linkError;

      setLinkedTxIds(prev => new Set([...prev, transactionId]));
      void fetchExistingLinks();

      setLinkSuccess({
        transactionLabel: linkedTx?.label ?? 'Transaction',
        transactionAmount: transactionAmount,
      });
    } catch (err) {
      console.error('Error linking transaction:', err);
      toast.error('Erreur lors du rapprochement');
    } finally {
      setIsLinking(false);
    }
  };

  return {
    isLoading,
    isSearching,
    isLinking,
    linkSuccess,
    searchQuery,
    setSearchQuery,
    error,
    existingLinksLocal,
    unlinkingId,
    allTransactions,
    suggestions,
    filteredSuggestions,
    otherTransactions,
    handleLink,
    handleUnlink,
  };
}
