/**
 * Hook: useAddProductsToGoogleMerchant
 *
 * Mutation pour ajouter batch de produits à Google Merchant
 * Appelle API POST /api/google-merchant/products/batch-add
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface AddProductsRequest {
  productIds: string[];
  merchantId: string;
}

interface AddProductsResponse {
  success: boolean;
  data?: {
    totalProcessed: number;
    successCount: number;
    errorCount: number;
    errors?: Array<{
      productId: string;
      error: string;
    }>;
  };
  error?: string;
}

/**
 * Hook: Ajouter produits à Google Merchant
 */
export function useAddProductsToGoogleMerchant() {
  const queryClient = useQueryClient();

  return useMutation<AddProductsResponse, Error, AddProductsRequest>({
    mutationFn: async ({ productIds, merchantId }: AddProductsRequest) => {
      logger.info('[useAddProductsToGoogleMerchant] Adding products', {
        count: productIds.length,
        merchantId,
      });

      const response = await fetch('/api/google-merchant/products/batch-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds, merchantId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: AddProductsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to add products');
      }

      return data;
    },
    onSuccess: data => {
      const { successCount, errorCount } = data.data || {};

      logger.info('[useAddProductsToGoogleMerchant] Success', {
        successCount,
        errorCount,
      });

      toast.success(
        `${successCount} produit(s) ajouté(s) à Google Merchant${errorCount ? ` (${errorCount} échec(s))` : ''}`
      );

      // Invalidate queries pour refresh
      queryClient.invalidateQueries({ queryKey: ['google-merchant-products'] });
      queryClient.invalidateQueries({
        queryKey: ['google-merchant-eligible-products'],
      });
      queryClient.invalidateQueries({ queryKey: ['google-merchant-stats'] });
    },
    onError: error => {
      logger.error(`[useAddProductsToGoogleMerchant] Failed: ${error.message}`);
      toast.error(`Échec ajout produits: ${error.message}`);
    },
  });
}
