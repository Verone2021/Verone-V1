/**
 * Hook: useProductDetail
 * Récupère les détails complets d'un produit Site Internet via RPC
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import type { SiteInternetProduct } from '../types';

const supabase = createClient();

export function useProductDetail(productId: string | null) {
  return useQuery({
    queryKey: ['site-internet-product-detail', productId],
    queryFn: async (): Promise<SiteInternetProduct | null> => {
      if (!productId) return null;

      const { data, error } = await supabase
        .rpc('get_site_internet_products')
        .eq('product_id', productId)
        .single();

      if (error) {
        console.error('❌ Erreur fetch product detail:', error);
        throw error;
      }

      return data as SiteInternetProduct;
    },
    enabled: !!productId,
    staleTime: 30000, // 30s
  });
}
