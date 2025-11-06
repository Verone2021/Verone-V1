/**
 * Hook: useGoogleMerchantEligibleProducts
 *
 * Récupère les produits éligibles pour Google Merchant (non encore synchronisés)
 * Critères: product_status = 'active', avec images, sans sync Google
 *
 * Utilise RPC get_google_merchant_eligible_products()
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Produit éligible Google Merchant
 */
export interface GoogleMerchantEligibleProduct {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price_ht_cents: number;
  price_ttc_cents: number;
  tva_rate: number;
  image_url: string | null;
  stock_status: string | null;
  product_status: string;
  gtin: string | null;
  brand: string | null;
}

/**
 * Hook: Fetch produits éligibles Google Merchant
 */
export function useGoogleMerchantEligibleProducts() {
  const supabase = createClient();

  return useQuery<GoogleMerchantEligibleProduct[]>({
    queryKey: ['google-merchant-eligible-products'],
    queryFn: async () => {
      logger.info(
        '[useGoogleMerchantEligibleProducts] Fetching eligible products...'
      );

      const { data, error } = await supabase.rpc(
        'get_google_merchant_eligible_products' as any
      );

      if (error) {
        logger.error(
          `[useGoogleMerchantEligibleProducts] Failed: ${error.message}`
        );
        throw new Error(`Failed to fetch eligible products: ${error.message}`);
      }

      logger.info('[useGoogleMerchantEligibleProducts] Success', {
        count: (data as any)?.length || 0,
      });

      return (data as GoogleMerchantEligibleProduct[]) || [];
    },
    staleTime: 30000, // 30s (données changent souvent)
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 2,
  });
}
