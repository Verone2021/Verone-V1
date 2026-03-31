'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { logger } from '@verone/utils/logger';

import { callRpc } from './rpc-helper';

interface BatchAddResult {
  total_processed: number;
  success_count: number;
  error_count: number;
}

export function useAddProductsToMeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productIds: string[]): Promise<BatchAddResult> => {
      logger.info('[useAddProductsToMeta] Adding products...', {
        count: productIds.length,
      });

      const { data, error } = await callRpc<BatchAddResult[]>(
        'batch_add_meta_commerce_products',
        { p_product_ids: productIds }
      );

      if (error) {
        logger.error(`[useAddProductsToMeta] Failed: ${error.message}`);
        throw new Error(`Failed to add products to Meta: ${error.message}`);
      }

      const result = (data ?? [])[0] ?? {
        total_processed: productIds.length,
        success_count: 0,
        error_count: productIds.length,
      };

      logger.info('[useAddProductsToMeta] Done', { ...result });
      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['meta-commerce-products'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['meta-commerce-stats'],
      });
    },
  });
}
