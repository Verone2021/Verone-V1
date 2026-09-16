/**
 * Hook LinkMe Approvals Count - Vérone Back Office
 * Commandes LinkMe en attente de validation back-office (canal LinkMe, draft).
 *
 * Valeur lue dans l'appel unique du menu (`get_sidebar_counts`, champ
 * `linkmeApprovals`) : aucune requête ni canal propre (le menu porte déjà le
 * Realtime sur `sales_orders`).
 */

'use client';

import type { MenuCountHook } from './use-menu-count';
import { useMenuCount } from './use-menu-count';

export type LinkmeApprovalsCountHook = MenuCountHook;

/**
 * Hook pour compter les commandes LinkMe à approuver.
 *
 * @param options.enableRealtime  @deprecated ignoré — le menu porte le Realtime (sales_orders)
 * @param options.refetchInterval @deprecated ignoré — TanStack Query gère le cache
 */
export function useLinkmeApprovalsCount(_options?: {
  /** @deprecated ignoré */
  enableRealtime?: boolean;
  /** @deprecated ignoré */
  refetchInterval?: number;
}): LinkmeApprovalsCountHook {
  return useMenuCount('linkmeApprovals');
}
