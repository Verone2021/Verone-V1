/**
 * Hook LinkMe Pending Count - Vérone Back Office
 * Commandes LinkMe nécessitant une action (draft + validated).
 *
 * Valeur lue dans l'appel unique du menu (`get_sidebar_counts`, champ
 * `linkmePending`) : aucune requête ni canal propre. Le comptage direct sur
 * `linkme_orders_enriched` (166 ms de préparation à vide) a provoqué 164
 * dépassements de délai pendant la mise en ligne du 2026-09-15.
 */

'use client';

import type { MenuCountHook } from './use-menu-count';
import { useMenuCount } from './use-menu-count';

export type LinkmePendingCountHook = MenuCountHook;

/**
 * Compte les commandes LinkMe actionnables (draft : à valider, validated : à préparer).
 *
 * @param options.enableRealtime  @deprecated ignoré — le menu porte le Realtime (sales_orders)
 * @param options.refetchInterval @deprecated ignoré — TanStack Query gère le cache
 */
export function useLinkmePendingCount(_options?: {
  /** @deprecated ignoré */
  enableRealtime?: boolean;
  /** @deprecated ignoré */
  refetchInterval?: number;
}): LinkmePendingCountHook {
  return useMenuCount('linkmePending');
}
