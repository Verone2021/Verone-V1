/**
 * Hook Stock Alerts Count - Vérone Back Office
 * Alertes stock actives.
 *
 * Valeur lue dans l'appel unique du menu (`get_sidebar_counts`, champ
 * `stockAlerts`, qui appelle `get_stock_alerts_count()` côté base) : aucune
 * requête propre. `stock_alerts_unified_view` n'est pas publiée en temps réel.
 */

'use client';

import type { MenuCountHook } from './use-menu-count';
import { useMenuCount } from './use-menu-count';

export type StockAlertsCountHook = MenuCountHook;

/**
 * Hook pour compter les alertes stock actives.
 *
 * @param options.enableRealtime  @deprecated ignoré — stock_alerts_unified_view non publiée
 * @param options.refetchInterval @deprecated ignoré — TanStack Query gère le cache
 */
export function useStockAlertsCount(_options?: {
  /** @deprecated ignoré */
  enableRealtime?: boolean;
  /** @deprecated ignoré */
  refetchInterval?: number;
}): StockAlertsCountHook {
  return useMenuCount('stockAlerts');
}
