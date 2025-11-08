/**
 * Hook: useToggleGoogleMerchantVisibility
 *
 * Mutation pour masquer/afficher un produit sur Google Merchant
 * Appelle API PATCH /api/google-merchant/products/[id]/visibility
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import { logger } from '@/lib/logger';

interface ToggleVisibilityRequest {
  productId: string;
  visible: boolean;
}

interface ToggleVisibilityResponse {
  success: boolean;
  data?: {
    productId: string;
    visible: boolean;
  };
  error?: string;
}

/**
 * Hook: Toggle visibilité produit Google Merchant
 */
export function useToggleGoogleMerchantVisibility() {
  const queryClient = useQueryClient();

  return useMutation<ToggleVisibilityResponse, Error, ToggleVisibilityRequest>({
    mutationFn: async ({ productId, visible }: ToggleVisibilityRequest) => {
      logger.info('[useToggleGoogleMerchantVisibility] Toggling visibility', {
        productId,
        visible,
      });

      const response = await fetch(
        `/api/google-merchant/products/${productId}/visibility`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ visible }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: ToggleVisibilityResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to toggle visibility');
      }

      return data;
    },
    onSuccess: data => {
      const { visible } = data.data || {};

      logger.info('[useToggleGoogleMerchantVisibility] Success', {
        visible,
      });

      toast.success(
        visible
          ? 'Produit affiché sur Google Merchant'
          : 'Produit masqué sur Google Merchant'
      );

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['google-merchant-products'] });
      queryClient.invalidateQueries({ queryKey: ['google-merchant-stats'] });
    },
    onError: error => {
      logger.error(
        `[useToggleGoogleMerchantVisibility] Failed: ${error.message}`
      );
      toast.error(`Échec toggle visibilité: ${error.message}`);
    },
  });
}
