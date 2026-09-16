/**
 * Hook Transactions Unreconciled Count - Vérone Back Office
 * Transactions bancaires non rapprochées.
 *
 * Valeur lue dans l'appel unique du menu (`get_sidebar_counts`, champ
 * `transactionsUnreconciled`) : aucune requête propre. `bank_transactions` n'est
 * pas publiée en temps réel — les écritures passent par `invalidateMenuCounts`.
 */

'use client';

import type { MenuCountHook } from './use-menu-count';
import { useMenuCount } from './use-menu-count';

export type TransactionsUnreconciledCountHook = MenuCountHook;

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
  return useMenuCount('transactionsUnreconciled');
}
