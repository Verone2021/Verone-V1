'use client';

import { useQuery } from '@tanstack/react-query';

import { logger } from '@verone/utils/logger';

import { callRpc } from './meta/rpc-helper';

export interface MetaCommerceProduct {
  id: string;
  product_id: string;
  sku: string;
  product_name: string;
  primary_image_url: string | null;
  cost_price: number;
  custom_price_ht: number | null;
  description: string | null;
  catalog_id: string;
  meta_product_id: string | null;
  sync_status: 'synced' | 'pending' | 'error' | 'deleted';
  meta_status: 'active' | 'pending' | 'rejected' | null;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue_ht: number;
  meta_status_detail: Record<string, unknown> | null;
  meta_status_checked_at: string | null;
  synced_at: string;
  error_message: string | null;
  image_count: number;
  is_channel_active: boolean;
}

export interface MetaCommerceStats {
  total_products: number;
  active_products: number;
  pending_products: number;
  rejected_products: number;
  error_products: number;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  conversion_rate: number;
  last_sync_at: string | null;
}

export function useMetaCommerceProducts() {
  return useQuery<MetaCommerceProduct[]>({
    queryKey: ['meta-commerce-products'],
    queryFn: async () => {
      logger.info('[useMetaCommerceProducts] Fetching from RPC...');

      const { data, error } = await callRpc<MetaCommerceProduct[]>(
        'get_meta_commerce_products'
      );

      if (error) {
        logger.error(`[useMetaCommerceProducts] Failed: ${error.message}`);
        throw new Error(
          `Failed to fetch Meta Commerce products: ${error.message}`
        );
      }

      const products = data ?? [];
      logger.info('[useMetaCommerceProducts] Fetched', {
        count: products.length,
      });
      return products;
    },
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

export function useMetaCommerceStats() {
  return useQuery<MetaCommerceStats | null>({
    queryKey: ['meta-commerce-stats'],
    queryFn: async () => {
      logger.info('[useMetaCommerceStats] Fetching from RPC...');

      const { data, error } = await callRpc<MetaCommerceStats[]>(
        'get_meta_commerce_stats'
      );

      if (error) {
        logger.error(`[useMetaCommerceStats] Failed: ${error.message}`);
        throw new Error(
          `Failed to fetch Meta Commerce stats: ${error.message}`
        );
      }

      const rows = data ?? [];
      if (rows.length === 0) return null;

      return rows[0];
    },
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}
