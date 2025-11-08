/**
 * Hook: useRemoveFromGoogleMerchant
 *
 * Mutation pour retirer un produit de Google Merchant (soft delete)
 * Appelle API DELETE /api/google-merchant/products/[id]
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import { logger } from '@/lib/logger';

interface RemoveProductRequest {
  productId: string;
}

interface RemoveProductResponse {
  success: boolean;
  data?: {
    productId: string;
    removed: boolean;
  };
  error?: string;
}

/**
 * Hook: Retirer produit de Google Merchant
 */
export function useRemoveFromGoogleMerchant() {
  const queryClient = useQueryClient();

  return useMutation<RemoveProductResponse, Error, RemoveProductRequest>({
    mutationFn: async ({ productId }: RemoveProductRequest) => {
      logger.info('[useRemoveFromGoogleMerchant] Removing product', {
        productId,
      });

      const response = await fetch(
        `/api/google-merchant/products/${productId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: RemoveProductResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to remove product');
      }

      return data;
    },
    onSuccess: () => {
      logger.info('[useRemoveFromGoogleMerchant] Success');

      toast.success('Produit retiré de Google Merchant');

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['google-merchant-products'] });
      queryClient.invalidateQueries({
        queryKey: ['google-merchant-eligible-products'],
      });
      queryClient.invalidateQueries({ queryKey: ['google-merchant-stats'] });
    },
    onError: error => {
      logger.error(`[useRemoveFromGoogleMerchant] Failed: ${error.message}`);
      toast.error(`Échec retrait produit: ${error.message}`);
    },
  });
}
