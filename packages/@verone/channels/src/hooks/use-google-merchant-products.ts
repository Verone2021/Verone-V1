/**
 * Hook: useGoogleMerchantProducts
 *
 * Fetch VRAIES données Google Merchant depuis Supabase
 * RÈGLE ABSOLUE: Aucune donnée mock - Seulement données réelles ou vides
 *
 * Utilise des requêtes directes sur google_merchant_syncs + products
 */

'use client';

import { useQuery } from '@tanstack/react-query';

import { logger } from '@verone/utils/logger';
import { createClient } from '@verone/utils/supabase/client';

/**
 * Produit Google Merchant (données RÉELLES uniquement)
 */
export interface GoogleMerchantProduct {
  id: string;
  product_id: string;
  sku: string;
  product_name: string;
  primary_image_url: string | null;
  google_product_id: string;
  sync_status: 'success' | 'pending' | 'error' | 'skipped';
  google_status: 'approved' | 'pending' | 'rejected' | 'not_synced' | null;
  google_status_detail: unknown;
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
  conversion_rate: number;
  last_sync_at: string | null;
  refreshed_at: string;
}

/**
 * Hook: Fetch produits synchronisés Google Merchant
 */
export function useGoogleMerchantProducts() {
  const supabase = createClient();

  return useQuery<GoogleMerchantProduct[]>({
    queryKey: ['google-merchant-products'],
    queryFn: async () => {
      logger.info(
        '[useGoogleMerchantProducts] Fetching products from Supabase...'
      );

      const { data, error } = await supabase
        .from('google_merchant_syncs')
        .select(
          `
          id, product_id, google_product_id, sync_status, google_status,
          google_status_detail, impressions, clicks, conversions, revenue_ht,
          synced_at, google_status_checked_at, error_message,
          products!inner(sku, name, product_images(public_url, is_primary))
        `
        )
        .neq('sync_status', 'deleted')
        .order('synced_at', { ascending: false });

      if (error) {
        logger.error(
          `[useGoogleMerchantProducts] Failed to fetch: ${error.message}`
        );
        throw new Error(
          `Failed to fetch Google Merchant products: ${error.message}`
        );
      }

      const mapped: GoogleMerchantProduct[] = (data ?? []).map(row => {
        const product = row.products as unknown as {
          sku: string;
          name: string;
          product_images?: Array<{
            public_url: string;
            is_primary: boolean | null;
          }>;
        };
        const primaryImg = product.product_images?.find(img => img.is_primary);
        const imageUrl =
          primaryImg?.public_url ??
          product.product_images?.[0]?.public_url ??
          null;
        return {
          id: row.id,
          product_id: row.product_id,
          sku: product.sku,
          product_name: product.name,
          primary_image_url: imageUrl,
          google_product_id: row.google_product_id ?? '',
          sync_status: row.sync_status as GoogleMerchantProduct['sync_status'],
          google_status:
            row.google_status as GoogleMerchantProduct['google_status'],
          google_status_detail: row.google_status_detail,
          impressions: row.impressions ?? 0,
          clicks: row.clicks ?? 0,
          conversions: row.conversions ?? 0,
          revenue_ht: Number(row.revenue_ht ?? 0),
          synced_at: row.synced_at ?? '',
          google_status_checked_at: row.google_status_checked_at,
          error_message: row.error_message,
        };
      });

      logger.info('[useGoogleMerchantProducts] Products fetched', {
        count: mapped.length,
      });

      return mapped;
    },
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook: Fetch statistiques Google Merchant pour dashboard
 */
export function useGoogleMerchantStats() {
  const supabase = createClient();

  return useQuery<GoogleMerchantStats | null>({
    queryKey: ['google-merchant-stats'],
    queryFn: async () => {
      logger.info('[useGoogleMerchantStats] Fetching stats from Supabase...');

      const { data, error } = await supabase
        .from('google_merchant_syncs')
        .select(
          'sync_status, google_status, impressions, clicks, conversions, revenue_ht, synced_at'
        )
        .neq('sync_status', 'deleted');

      if (error) {
        logger.error(`[useGoogleMerchantStats] Failed: ${error.message}`);
        throw new Error(
          `Failed to fetch Google Merchant stats: ${error.message}`
        );
      }

      const rows = data ?? [];
      if (rows.length === 0) {
        logger.info(
          '[useGoogleMerchantStats] No stats available (empty table)'
        );
        return null;
      }

      const totalImpressions = rows.reduce(
        (s, r) => s + (r.impressions ?? 0),
        0
      );
      const totalClicks = rows.reduce((s, r) => s + (r.clicks ?? 0), 0);
      const totalConversions = rows.reduce(
        (s, r) => s + (r.conversions ?? 0),
        0
      );
      const totalRevenue = rows.reduce(
        (s, r) => s + Number(r.revenue_ht ?? 0),
        0
      );

      const stats: GoogleMerchantStats = {
        total_products: rows.length,
        approved_products: rows.filter(r => r.google_status === 'approved')
          .length,
        pending_products: rows.filter(r => r.google_status === 'pending')
          .length,
        rejected_products: rows.filter(r => r.google_status === 'rejected')
          .length,
        error_products: rows.filter(r => r.sync_status === 'error').length,
        total_impressions: totalImpressions,
        total_clicks: totalClicks,
        total_conversions: totalConversions,
        total_revenue_ht: totalRevenue,
        conversion_rate:
          totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
        last_sync_at: rows.reduce(
          (latest, r) => {
            if (!r.synced_at) return latest;
            return !latest || r.synced_at > latest ? r.synced_at : latest;
          },
          null as string | null
        ),
        refreshed_at: new Date().toISOString(),
      };

      logger.info('[useGoogleMerchantStats] Stats computed', {
        total_products: stats.total_products,
        approved: stats.approved_products,
      });

      return stats;
    },
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook: Refresh stats (no-op since we compute client-side now)
 */
export function useRefreshGoogleMerchantStats() {
  return async () => {
    logger.info(
      '[useRefreshGoogleMerchantStats] Stats auto-refresh on next query'
    );
  };
}
