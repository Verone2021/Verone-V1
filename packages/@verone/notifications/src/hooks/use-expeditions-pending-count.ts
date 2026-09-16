/**
 * Hook Expeditions Pending Count - Vérone Back Office
 * Commandes à expédier (validated + partially_shipped).
 *
 * Valeur lue dans l'appel unique du menu (`get_sidebar_counts`, champ
 * `expeditionsPending`) : aucune requête ni canal propre (le menu porte déjà le
 * Realtime sur `sales_orders`).
 */

'use client';

import type { MenuCountHook } from './use-menu-count';
import { useMenuCount } from './use-menu-count';

export type ExpeditionsPendingCountHook = MenuCountHook;

/**
 * Hook pour compter les expéditions en attente.
 *
 * @param options.enableRealtime  @deprecated ignoré — le menu porte le Realtime (sales_orders)
 * @param options.refetchInterval @deprecated ignoré — TanStack Query gère le cache
 */
export function useExpeditionsPendingCount(_options?: {
  /** @deprecated ignoré */
  enableRealtime?: boolean;
  /** @deprecated ignoré */
  refetchInterval?: number;
}): ExpeditionsPendingCountHook {
  return useMenuCount('expeditionsPending');
}
