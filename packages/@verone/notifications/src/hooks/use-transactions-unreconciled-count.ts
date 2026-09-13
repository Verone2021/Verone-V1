/**
 * Hook Transactions Unreconciled Count - Vérone Back Office
 * Compte les transactions bancaires non rapprochées (matching_status = 'unmatched').
 *
 * Implémentation : TanStack Query (staleTime 5 min, refetch au retour sur
 * l'onglet). bank_transactions n'est pas publiée dans Supabase Realtime
 * → pas d'abonnement, pas de polling.
 */

'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { MENU_COUNT_QUERY_KEYS } from '@verone/utils/query';
import { createClient } from '@verone/utils/supabase/client';

export interface TransactionsUnreconciledCountHook {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

const TRANSACTIONS_UNRECONCILED_QUERY_KEY =
  MENU_COUNT_QUERY_KEYS.bankTransactions;

/**
 * Hook pour compter les transactions bancaires non rapprochées.
 *
 * @param options.enableRealtime  @deprecated ignoré — bank_transactions non publiée
 * @param options.refetchInterval @deprecated ignoré — TanStack Query gère le cache
 */
export function useTransactionsUnreconciledCount(_options?: {
  /** @deprecated ignoré */
  enableRealtime?: boolean;
  /** @deprecated ignoré */
  refetchInterval?: number;
}): TransactionsUnreconciledCountHook {
  const queryClient = useQueryClient();

  const {
    data = 0,
    isPending,
    error,
    dataUpdatedAt,
  } = useQuery({
    queryKey: TRANSACTIONS_UNRECONCILED_QUERY_KEY,
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count: totalCount, error: countError } = await supabase
        .from('bank_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('matching_status', 'unmatched');

      if (countError) {
        console.error(
          '[useTransactionsUnreconciledCount] Count error:',
          countError
        );
        throw new Error(countError.message);
      }
      return totalCount ?? 0;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: false,
  });

  const refetch = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({
      queryKey: TRANSACTIONS_UNRECONCILED_QUERY_KEY,
    });
  }, [queryClient]);

  return {
    count: data,
    loading: isPending,
    error: error ?? null,
    refetch,
    lastUpdated: dataUpdatedAt > 0 ? new Date(dataUpdatedAt) : null,
  };
}
