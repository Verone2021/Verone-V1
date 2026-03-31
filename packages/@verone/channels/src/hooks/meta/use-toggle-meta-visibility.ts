'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { logger } from '@verone/utils/logger';

import { callRpc } from './rpc-helper';

export function useToggleMetaVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      visible,
    }: {
      productId: string;
      visible: boolean;
    }) => {
      logger.info('[useToggleMetaVisibility] Toggling...', {
        productId,
        visible,
      });

      const { error } = await callRpc<void>('toggle_meta_commerce_visibility', {
        p_product_id: productId,
        p_visible: visible,
      });

      if (error) {
        logger.error(`[useToggleMetaVisibility] Failed: ${error.message}`);
        throw new Error(`Failed to toggle Meta visibility: ${error.message}`);
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
