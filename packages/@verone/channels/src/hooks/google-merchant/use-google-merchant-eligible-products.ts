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

import { logger } from '@verone/utils/logger';
import { createClient } from '@verone/utils/supabase/client';

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
        'get_google_merchant_eligible_products' as 'get_google_merchant_eligible_products' &
          string
      );

      if (error) {
        logger.error(
          `[useGoogleMerchantEligibleProducts] Failed: ${error.message}`
        );
        throw new Error(`Failed to fetch eligible products: ${error.message}`);
      }

      const typedData = data as unknown as
        | GoogleMerchantEligibleProduct[]
        | null;
      logger.info('[useGoogleMerchantEligibleProducts] Success', {
        count: typedData?.length ?? 0,
      });

      return typedData ?? [];
    },
    staleTime: 300_000, // 5 minutes
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 2,
  });
}
