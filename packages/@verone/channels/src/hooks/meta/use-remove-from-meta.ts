'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { logger } from '@verone/utils/logger';

/**
 * Hook: useRemoveFromMeta
 *
 * Mutation pour retirer un produit de Meta Commerce (soft delete).
 * Appelle la route HTTP DELETE /api/meta-commerce/products/[id]
 * (créée dans BO-API-PUB-001) qui wrappe la RPC remove_from_meta_commerce.
 */
export function useRemoveFromMeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      logger.info('[useRemoveFromMeta] Removing...', { productId });

      const response = await fetch(`/api/meta-commerce/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        const message = errorData.error ?? `HTTP ${response.status}`;
        logger.error(`[useRemoveFromMeta] Failed: ${message}`);
        throw new Error(message);
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
