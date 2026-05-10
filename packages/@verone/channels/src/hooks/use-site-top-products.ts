'use client';

import { useQuery } from '@tanstack/react-query';

import { logger } from '@verone/utils/logger';

import { callRpc } from './meta/rpc-helper';

export interface SiteTopProduct {
  product_id: string;
  product_name: string;
  sku: string;
  primary_image_url: string | null;
  total_quantity: number;
  total_revenue_ht: number;
  order_count: number;
}

export interface UseSiteTopProductsOptions {
  channelCode: string;
  periodDays?: number;
  limit?: number;
  enabled?: boolean;
}

export function useSiteTopProducts({
  channelCode,
  periodDays = 90,
  limit = 20,
  enabled = true,
}: UseSiteTopProductsOptions) {
  return useQuery<SiteTopProduct[]>({
    queryKey: ['site-top-products', channelCode, periodDays, limit],
    queryFn: async () => {
      logger.info('[useSiteTopProducts] Fetching from RPC', {
        channelCode,
        periodDays,
        limit,
      });

      const { data, error } = await callRpc<SiteTopProduct[]>(
        'get_site_top_products',
        {
          p_channel_code: channelCode,
          p_period_days: periodDays,
          p_limit: limit,
        }
      );

      if (error) {
        logger.error(`[useSiteTopProducts] Failed: ${error.message}`);
        throw new Error(`Failed to fetch site top products: ${error.message}`);
      }

      return data ?? [];
    },
    enabled,
    staleTime: 60_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}
