/**
 * Hook: useGoogleMerchantProducts
 *
 * Fetch VRAIES données Google Merchant depuis Supabase
 * RÈGLE ABSOLUE: Aucune donnée mock - Seulement données réelles ou vides
 *
 * Utilise:
 * - RPC get_google_merchant_products() pour table produits
 * - RPC get_google_merchant_stats() pour statistiques dashboard
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Produit Google Merchant (données RÉELLES uniquement)
 */
export interface GoogleMerchantProduct {
  id: string;
  product_id: string;
  sku: string;
  product_name: string;
  google_product_id: string;
  sync_status: 'success' | 'pending' | 'error' | 'skipped';
  google_status: 'approved' | 'pending' | 'rejected' | 'not_synced' | null;
  google_status_detail: any; // JSONB détails erreurs
  impressions: number;
  clicks: number;
  conversions: number;
  revenue_ht: number;
  synced_at: string;
  google_status_checked_at: string | null;
  error_message: string | null;
}

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
 * Hook: Fetch produits synchronisés Google Merchant
 *
 * @returns Query result avec array produits RÉELS
 */
export function useGoogleMerchantProducts() {
  const supabase = createClient();

  return useQuery<GoogleMerchantProduct[]>({
    queryKey: ['google-merchant-products'],
    queryFn: async () => {
      logger.info(
        '[useGoogleMerchantProducts] Fetching products from Supabase...'
      );

      // Type assertion temporaire en attendant régénération types Supabase
      const { data, error } = await supabase.rpc(
        'get_google_merchant_products' as any
      );

      if (error) {
        logger.error(
          `[useGoogleMerchantProducts] Failed to fetch products: ${error.message}`
        );
        throw new Error(
          `Failed to fetch Google Merchant products: ${error.message}`
        );
      }

      logger.info('[useGoogleMerchantProducts] Products fetched successfully', {
        count: (data as any)?.length || 0,
      });

      return (data as GoogleMerchantProduct[]) || [];
    },
    staleTime: 60000, // 1 minute (données changent peu)
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
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
      const statsData = data as any;
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

/**
 * Hook: Refresh materialized view google_merchant_stats
 *
 * À appeler après chaque synchronisation de produits
 */
export function useRefreshGoogleMerchantStats() {
  const supabase = createClient();

  return async () => {
    logger.info('[useRefreshGoogleMerchantStats] Refreshing stats...');

    // Type assertion temporaire en attendant régénération types Supabase
    const { error } = await supabase.rpc(
      'refresh_google_merchant_stats' as any
    );

    if (error) {
      logger.error(
        `[useRefreshGoogleMerchantStats] Failed to refresh stats: ${error.message}`
      );
      throw new Error(`Failed to refresh stats: ${error.message}`);
    }

    logger.info('[useRefreshGoogleMerchantStats] Stats refreshed successfully');
  };
}
