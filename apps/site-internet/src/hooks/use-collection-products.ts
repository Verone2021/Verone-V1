import { useQuery } from '@tanstack/react-query';

import type { CatalogueProduct } from './use-catalogue-products';
import { createClient } from '@/lib/supabase/client';

/**
 * Hook to fetch products belonging to a specific collection
 * Queries collection_products join table then fetches product details via RPC
 */
export function useCollectionProducts(collectionId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['collection-products', collectionId],
    queryFn: async (): Promise<CatalogueProduct[]> => {
      if (!collectionId) return [];

      // Get product IDs in this collection
      const { data: collectionProducts, error: cpError } = await supabase
        .from('collection_products')
        .select('product_id')
        .eq('collection_id', collectionId)
        .order('position', { ascending: true });

      if (cpError) {
        console.error(
          '[useCollectionProducts] collection_products error:',
          cpError
        );
        throw new Error(
          `Failed to fetch collection products: ${cpError.message}`
        );
      }

      if (!collectionProducts || collectionProducts.length === 0) return [];

      // Get full product details via RPC (already filtered to published)
      const { data: allProducts, error: rpcError } = await supabase.rpc(
        'get_site_internet_products'
      );

      if (rpcError) {
        console.error('[useCollectionProducts] RPC error:', rpcError);
        throw new Error(`Failed to fetch products: ${rpcError.message}`);
      }

      // Filter to only products in this collection, preserve collection order
      const productsMap = new Map(
        ((allProducts || []) as CatalogueProduct[]).map(p => [p.product_id, p])
      );

      const ordered: CatalogueProduct[] = [];
      for (const cp of collectionProducts) {
        const product = productsMap.get(String(cp.product_id));
        if (product) ordered.push(product);
      }

      return ordered;
    },
    enabled: !!collectionId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
