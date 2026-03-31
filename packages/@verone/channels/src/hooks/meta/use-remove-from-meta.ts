'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { logger } from '@verone/utils/logger';

import { callRpc } from './rpc-helper';

export function useRemoveFromMeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      logger.info('[useRemoveFromMeta] Removing...', { productId });

      const { error } = await callRpc<void>('remove_from_meta_commerce', {
        p_product_id: productId,
      });

      if (error) {
        logger.error(`[useRemoveFromMeta] Failed: ${error.message}`);
        throw new Error(`Failed to remove from Meta: ${error.message}`);
      }
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
