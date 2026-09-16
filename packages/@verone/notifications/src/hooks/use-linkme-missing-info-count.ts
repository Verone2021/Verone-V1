/**
 * Hook LinkMe Missing Info Count - Vérone Back Office
 * Demandes d'informations LinkMe envoyées, non complétées et non expirées.
 *
 * Valeur lue dans l'appel unique du menu (`get_sidebar_counts`, champ
 * `linkmeMissingInfo`) : aucune requête propre. `linkme_info_requests` n'est pas
 * publiée en temps réel — les écritures passent par `invalidateMenuCounts`.
 */

'use client';

import type { MenuCountHook } from './use-menu-count';
import { useMenuCount } from './use-menu-count';

export type LinkmeMissingInfoCountHook = MenuCountHook;

/**
 * Hook pour compter les demandes d'informations LinkMe en attente.
 *
 * @param options.enableRealtime  @deprecated ignoré — linkme_info_requests non publiée
 * @param options.refetchInterval @deprecated ignoré — TanStack Query gère le cache
 */
export function useLinkmeMissingInfoCount(_options?: {
  /** @deprecated ignoré */
  enableRealtime?: boolean;
  /** @deprecated ignoré */
  refetchInterval?: number;
}): LinkmeMissingInfoCountHook {
  return useMenuCount('linkmeMissingInfo');
}
