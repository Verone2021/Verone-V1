/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { logger } from '@verone/utils/logger';
import { createClient } from '@verone/utils/supabase/client';

import type {
  BatchPricingRequest,
  BatchPricingResult,
  PricingParams,
  PricingResult,
  PricingResultV2,
} from './types';

export function useProductPrice(params: PricingParams) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['pricing-v2', params],
    queryFn: async (): Promise<PricingResult> => {
      try {
        const { data, error } = await (supabase.rpc as CallableFunction)(
          'calculate_product_price_v2',
          {
            p_product_id: params.productId,
            p_quantity: params.quantity ?? 1,
            p_channel_id: params.channelId ?? null,
            p_customer_id: params.customerId ?? null,
            p_customer_type: params.customerType ?? null,
            p_date: params.date ?? new Date().toISOString().split('T')[0],
          }
        );

        if (error) {
          logger.error('Failed to calculate product price', undefined, {
            operation: 'useProductPrice',
            error: error.message,
            params,
          });
          throw new Error(`Pricing calculation failed: ${error.message}`);
        }

        if (!data || (data as unknown[]).length === 0) {
          throw new Error('No pricing data returned');
        }

        const resultV2 = (data as unknown[])[0] as PricingResultV2;
        const result: PricingResult = {
          final_cost_price: resultV2.cost_price,
          pricing_source: resultV2.price_source,
          discount_applied: resultV2.discount_rate ?? 0,
          original_cost_price: resultV2.original_price,
        };

        logger.info('Product price calculated successfully (V2)', {
          operation: 'useProductPrice',
          productId: params.productId,
          finalPrice: result.final_cost_price,
          source: result.pricing_source,
          priceList: resultV2.price_list_name,
        });
        return result;
      } catch (error) {
        logger.error('Exception in useProductPrice', undefined, {
          operation: 'useProductPrice',
          error: error instanceof Error ? error.message : String(error),
          params,
        });
        throw error;
      }
    },
    enabled: params.enabled !== false && !!params.productId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useBatchPricing() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      request: BatchPricingRequest
    ): Promise<BatchPricingResult[]> => {
      try {
        logger.info('Batch pricing calculation started (V2)', {
          operation: 'useBatchPricing',
          itemsCount: request.items.length,
        });

        const results = await Promise.all(
          request.items.map(async (params): Promise<BatchPricingResult> => {
            try {
              const { data, error } = await (supabase.rpc as CallableFunction)(
                'calculate_product_price_v2',
                {
                  p_product_id: params.productId,
                  p_quantity: params.quantity ?? 1,
                  p_channel_id: params.channelId ?? null,
                  p_customer_id: params.customerId ?? null,
                  p_customer_type: params.customerType ?? null,
                  p_date: params.date ?? new Date().toISOString().split('T')[0],
                }
              );

              if (error)
                return {
                  productId: params.productId,
                  pricing: null,
                  error: error.message,
                };

              const resultV2 = ((data as unknown[])?.[0] ??
                null) as PricingResultV2 | null;
              if (resultV2) {
                const pricing: PricingResult = {
                  final_cost_price: resultV2.cost_price,
                  pricing_source: resultV2.price_source,
                  discount_applied: resultV2.discount_rate ?? 0,
                  original_cost_price: resultV2.original_price,
                };
                return { productId: params.productId, pricing };
              }

              return { productId: params.productId, pricing: null };
            } catch (err) {
              return {
                productId: params.productId,
                pricing: null,
                error: err instanceof Error ? err.message : String(err),
              };
            }
          })
        );

        const successCount = results.filter(r => r.pricing !== null).length;
        const failureCount = results.filter(r => r.error).length;
        logger.info('Batch pricing calculation completed (V2)', {
          operation: 'useBatchPricing',
          total: results.length,
          success: successCount,
          failed: failureCount,
        });
        return results;
      } catch (error) {
        logger.error('Exception in useBatchPricing', undefined, {
          operation: 'useBatchPricing',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: async results => {
      await Promise.all(
        results.map(result =>
          queryClient.invalidateQueries({
            queryKey: ['pricing-v2', { productId: result.productId }],
          })
        )
      );
    },
  });
}
