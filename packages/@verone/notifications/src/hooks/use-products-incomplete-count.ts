/**
 * Hook Products Incomplete Count - Vérone Back Office
 * Produits actifs sans description.
 *
 * Valeur lue dans l'appel unique du menu (`get_sidebar_counts`, champ
 * `productsIncomplete`) : aucune requête ni canal propre (le menu porte déjà le
 * Realtime sur `products`).
 */

'use client';

import type { MenuCountHook } from './use-menu-count';
import { useMenuCount } from './use-menu-count';

export type ProductsIncompleteCountHook = MenuCountHook;

/**
 * Hook pour compter les produits incomplets (actifs, sans description).
 *
 * @param options.enableRealtime  @deprecated ignoré — le menu porte le Realtime (products)
 * @param options.refetchInterval @deprecated ignoré — TanStack Query gère le cache
 */
export function useProductsIncompleteCount(_options?: {
  /** @deprecated ignoré */
  enableRealtime?: boolean;
  /** @deprecated ignoré */
  refetchInterval?: number;
}): ProductsIncompleteCountHook {
  return useMenuCount('productsIncomplete');
}
