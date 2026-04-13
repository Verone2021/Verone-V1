'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { logger } from '@verone/utils/logger';

import { callRpc } from './rpc-helper';

export function useUpdateMetaPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      priceHt,
    }: {
      productId: string;
      priceHt: number;
    }) => {
      logger.info('[useUpdateMetaPrice] Updating...', { productId, priceHt });

      const { error } = await callRpc<void>('update_meta_commerce_price', {
        p_product_id: productId,
        p_custom_price_ht: priceHt,
      });

      if (error) {
        logger.error(`[useUpdateMetaPrice] Failed: ${error.message}`);
        throw new Error(`Failed to update Meta price: ${error.message}`);
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
