/**
 * Hook: useUpdateGoogleMerchantMetadata
 *
 * Mutation pour mettre à jour les métadonnées custom (titre, description) d'un produit Google Merchant
 * Appelle API PATCH /api/google-merchant/products/[id]/metadata
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface UpdateMetadataRequest {
  productId: string;
  customTitle?: string;
  customDescription?: string;
}

interface UpdateMetadataResponse {
  success: boolean;
  data?: {
    productId: string;
    customTitle?: string;
    customDescription?: string;
  };
  error?: string;
}

/**
 * Hook: Mettre à jour métadonnées custom Google Merchant
 */
export function useUpdateGoogleMerchantMetadata() {
  const queryClient = useQueryClient();

  return useMutation<UpdateMetadataResponse, Error, UpdateMetadataRequest>({
    mutationFn: async ({
      productId,
      customTitle,
      customDescription,
    }: UpdateMetadataRequest) => {
      logger.info('[useUpdateGoogleMerchantMetadata] Updating metadata', {
        productId,
        hasTitle: !!customTitle,
        hasDescription: !!customDescription,
      });

      const response = await fetch(
        `/api/google-merchant/products/${productId}/metadata`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ customTitle, customDescription }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: UpdateMetadataResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update metadata');
      }

      return data;
    },
    onSuccess: () => {
      logger.info('[useUpdateGoogleMerchantMetadata] Success');

      toast.success('Métadonnées mises à jour avec succès');

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['google-merchant-products'] });
    },
    onError: error => {
      logger.error(
        `[useUpdateGoogleMerchantMetadata] Failed: ${error.message}`
      );
      toast.error(`Échec mise à jour métadonnées: ${error.message}`);
    },
  });
}
