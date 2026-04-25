'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { logger } from '@verone/utils/logger';

/**
 * Hook: useToggleMetaVisibility
 *
 * Mutation pour masquer/afficher un produit sur Meta Commerce.
 * Appelle la route HTTP PATCH /api/meta-commerce/products/[id]/visibility
 * (créée dans BO-API-PUB-001) qui applique le guard cascade : si le
 * produit n'est pas publié sur Site Internet (is_published_online=false),
 * la route renvoie 422 et la mutation échoue.
 *
 * Voir docs/current/canaux-vente-publication-rules.md
 */
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

      const response = await fetch(
        `/api/meta-commerce/products/${productId}/visibility`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visible }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        const message = errorData.error ?? `HTTP ${response.status}`;
        logger.error(`[useToggleMetaVisibility] Failed: ${message}`);
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
