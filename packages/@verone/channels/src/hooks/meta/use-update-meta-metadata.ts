'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { logger } from '@verone/utils/logger';

import { callRpc } from './rpc-helper';

export function useUpdateMetaMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      customTitle,
      customDescription,
    }: {
      productId: string;
      customTitle?: string;
      customDescription?: string;
    }) => {
      logger.info('[useUpdateMetaMetadata] Updating...', { productId });

      const { error } = await callRpc<void>('update_meta_commerce_metadata', {
        p_product_id: productId,
        p_custom_title: customTitle ?? null,
        p_custom_description: customDescription ?? null,
      });

      if (error) {
        logger.error(`[useUpdateMetaMetadata] Failed: ${error.message}`);
        throw new Error(`Failed to update Meta metadata: ${error.message}`);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['meta-commerce-products'],
      });
    },
  });
}
