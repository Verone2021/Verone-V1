/**
 * Hook: useGoogleMerchantStats
 *
 * Fetch statistiques Google Merchant pour dashboard
 * RÈGLE ABSOLUE: Aucune donnée mock - Seulement données réelles ou vides
 *
 * Utilise: RPC get_google_merchant_stats() pour statistiques dashboard
 */

'use client';

import { useQuery } from '@tanstack/react-query';

import { logger } from '@verone/utils/logger';
import { createClient } from '@verone/utils/supabase/client';

/**
 * Statistiques Google Merchant (données RÉELLES uniquement)
 */
export interface GoogleMerchantStats {
  total_products: number;
  approved_products: number;
  pending_products: number;
  rejected_products: number;
  error_products: number;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  total_revenue_ht: number;
  conversion_rate: number; // Calculé RÉELLEMENT (conversions / clicks * 100)
  last_sync_at: string | null;
  refreshed_at: string;
}

/**
 * Hook: Fetch statistiques Google Merchant pour dashboard
 *
 * @returns Query result avec stats RÉELLES (jamais de mock)
 */
export function useGoogleMerchantStats() {
  const supabase = createClient();

  return useQuery<GoogleMerchantStats | null>({
    queryKey: ['google-merchant-stats'],
    queryFn: async () => {
      logger.info('[useGoogleMerchantStats] Fetching stats from Supabase...');

      // Type assertion temporaire en attendant régénération types Supabase
      const { data, error } = await supabase.rpc(
        'get_google_merchant_stats' as any
      );

      if (error) {
        logger.error(
          `[useGoogleMerchantStats] Failed to fetch stats: ${error.message}`
        );
        throw new Error(
          `Failed to fetch Google Merchant stats: ${error.message}`
        );
      }

      // Si aucune donnée (table vide), retourner null pour afficher UI vide
      const statsData = data;
      if (!statsData || statsData.length === 0) {
        logger.info(
          '[useGoogleMerchantStats] No stats available (empty table)'
        );
        return null;
      }

      logger.info('[useGoogleMerchantStats] Stats fetched successfully', {
        total_products: statsData[0].total_products,
        approved: statsData[0].approved_products,
        conversion_rate: statsData[0].conversion_rate,
      });

      return statsData[0] as GoogleMerchantStats; // Vue materialized retourne array avec 1 row
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}
