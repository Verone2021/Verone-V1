/**
 * Hook Orders Pending Count - Vérone Back Office
 * Commandes clients en brouillon.
 *
 * Valeur lue dans l'appel unique du menu (`get_sidebar_counts`, champ
 * `ordersPending`) : aucune requête ni canal propre (le menu porte déjà le
 * Realtime sur `sales_orders`).
 */

'use client';

import type { MenuCountHook } from './use-menu-count';
import { useMenuCount } from './use-menu-count';

export type OrdersPendingCountHook = MenuCountHook;

/**
 * Hook pour compter les commandes en attente de traitement (status draft).
 *
 * @param options.enableRealtime  @deprecated ignoré — le menu porte le Realtime (sales_orders)
 * @param options.refetchInterval @deprecated ignoré — TanStack Query gère le cache
 */
export function useOrdersPendingCount(_options?: {
  /** @deprecated ignoré */
  enableRealtime?: boolean;
  /** @deprecated ignoré */
  refetchInterval?: number;
}): OrdersPendingCountHook {
  return useMenuCount('ordersPending');
}
