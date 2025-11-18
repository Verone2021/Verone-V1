/**
 * Hook: useProductDetail
 * Récupère les détails complets d'un produit Site Internet via RPC get_site_internet_products()
 * Compatible avec page produit publique (/produit/[slug])
 */

import { useQuery } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';

import type { CatalogueProduct } from './use-catalogue-products';

export function useProductDetail(slug: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['product-detail', slug],
    queryFn: async (): Promise<CatalogueProduct | null> => {
      if (!slug) return null;

      // Récupérer produit par slug via RPC
      const { data, error } = await supabase.rpc('get_site_internet_products');

      if (error) {
        console.error('❌ Erreur fetch product detail:', error);
        throw error;
      }

      // Filtrer par slug côté client
      const product = ((data as CatalogueProduct[]) || []).find(
        (p: CatalogueProduct) => p.slug === slug
      );

      if (!product) {
        throw new Error(`Produit non trouvé: ${slug}`);
      }

      return product;
    },
    enabled: !!slug,
    staleTime: 60000, // 1 minute
    retry: 1,
  });
}
