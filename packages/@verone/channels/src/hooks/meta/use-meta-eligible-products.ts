'use client';

import { useQuery } from '@tanstack/react-query';

import { logger } from '@verone/utils/logger';

import { callRpc } from './rpc-helper';

export interface MetaEligibleProduct {
  id: string;
  name: string;
  sku: string;
  slug: string;
  cost_price: number;
  site_price_ht: number | null;
  stock_status: string;
  stock_quantity: number;
  primary_image_url: string | null;
  image_count: number;
  is_published_online: boolean;
}

export function useMetaEligibleProducts() {
  return useQuery<MetaEligibleProduct[]>({
    queryKey: ['meta-eligible-products'],
    queryFn: async () => {
      logger.info('[useMetaEligibleProducts] Fetching...');

      const { data, error } = await callRpc<MetaEligibleProduct[]>(
        'get_meta_eligible_products'
      );

      if (error) {
        logger.error(`[useMetaEligibleProducts] Failed: ${error.message}`);
        throw new Error(
          `Failed to fetch Meta eligible products: ${error.message}`
        );
      }

      return data ?? [];
    },
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
  });
}
