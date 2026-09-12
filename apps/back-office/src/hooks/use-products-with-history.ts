'use client';

import { useCallback, useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

import { productIdsWithHistory } from './product-history';

const STALE_TIME_MS = 60 * 1000;

async function fetchProductIdsWithHistory(
  productIds: string[]
): Promise<Set<string>> {
  const supabase = createClient();
  // Une seule requête : comptes imbriqués des 4 tables d'historique.
  const { data, error } = await supabase
    .from('products')
    .select(
      'id, consultation_products(count), purchase_order_items(count), sales_order_items(count), stock_movements(count)'
    )
    .in('id', productIds);

  if (error) {
    throw new Error(`Failed to check product history: ${error.message}`);
  }
  return productIdsWithHistory(data ?? []);
}

/**
 * Indique quels produits peuvent être supprimés (aucun historique).
 * Tant que la réponse n'est pas arrivée, ou en cas d'erreur, `canDelete`
 * renvoie false : on ne propose jamais « Supprimer » par défaut.
 */
export function useProductsWithHistory(productIds: readonly string[]) {
  const idsKey = useMemo(() => [...productIds].sort().join(','), [productIds]);

  const { data } = useQuery({
    queryKey: ['products', 'with_history', idsKey],
    queryFn: () => fetchProductIdsWithHistory(idsKey.split(',')),
    enabled: idsKey.length > 0,
    staleTime: STALE_TIME_MS,
  });

  const canDelete = useCallback(
    (productId: string) => data !== undefined && !data.has(productId),
    [data]
  );

  return { canDelete };
}
