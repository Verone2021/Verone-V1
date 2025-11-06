/**
 * Hook: useUpdateGoogleMerchantPrice
 *
 * Mutation pour mettre à jour le prix HT custom d'un produit Google Merchant
 * Appelle API PUT /api/google-merchant/products/[id]/price
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface UpdatePriceRequest {
  productId: string;
  priceHtCents: number;
  tvaRate?: number;
}

interface UpdatePriceResponse {
  success: boolean;
  data?: {
    productId: string;
    priceHtCents: number;
    priceTtcCents: number;
  };
  error?: string;
}

/**
 * Hook: Mettre à jour prix custom Google Merchant
 */
export function useUpdateGoogleMerchantPrice() {
  const queryClient = useQueryClient();

  return useMutation<UpdatePriceResponse, Error, UpdatePriceRequest>({
    mutationFn: async ({
      productId,
      priceHtCents,
      tvaRate,
    }: UpdatePriceRequest) => {
      logger.info('[useUpdateGoogleMerchantPrice] Updating price', {
        productId,
        priceHtCents,
        tvaRate,
      });

      const response = await fetch(
        `/api/google-merchant/products/${productId}/price`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ priceHtCents, tvaRate }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: UpdatePriceResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update price');
      }

      return data;
    },
    onSuccess: data => {
      const { priceHtCents, priceTtcCents } = data.data || {};

      logger.info('[useUpdateGoogleMerchantPrice] Success', {
        priceHtCents,
        priceTtcCents,
      });

      toast.success(
        `Prix mis à jour: ${(priceHtCents! / 100).toFixed(2)}€ HT → ${(priceTtcCents! / 100).toFixed(2)}€ TTC`
      );

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['google-merchant-products'] });
    },
    onError: error => {
      logger.error(`[useUpdateGoogleMerchantPrice] Failed: ${error.message}`);
      toast.error(`Échec mise à jour prix: ${error.message}`);
    },
  });
}
