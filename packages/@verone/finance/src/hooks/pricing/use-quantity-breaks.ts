/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

import { useQuery } from '@tanstack/react-query';

import { logger } from '@verone/utils/logger';
import { createClient } from '@verone/utils/supabase/client';

import type { QuantityBreak, QuantityBreaksParams } from './types';

export function useQuantityBreaks(params: QuantityBreaksParams) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['quantity-breaks', params],
    queryFn: async (): Promise<QuantityBreak[]> => {
      try {
        const { data, error } = await (supabase.rpc as CallableFunction)(
          'get_quantity_breaks',
          {
            p_product_id: params.productId,
            p_channel_id: params.channelId ?? null,
            p_customer_id: params.customerId ?? null,
            p_customer_type: params.customerType ?? null,
            p_date: params.date ?? new Date().toISOString().split('T')[0],
          }
        );

        if (error) {
          logger.error('Failed to fetch quantity breaks', undefined, {
            operation: 'useQuantityBreaks',
            error: error.message,
            params,
          });
          throw new Error(`Quantity breaks fetch failed: ${error.message}`);
        }

        if (!data) return [];

        logger.info('Quantity breaks fetched successfully', {
          operation: 'useQuantityBreaks',
          productId: params.productId,
          breaksCount: (data as unknown[]).length,
        });
        return data as unknown as QuantityBreak[];
      } catch (error) {
        logger.error('Exception in useQuantityBreaks', undefined, {
          operation: 'useQuantityBreaks',
          error: error instanceof Error ? error.message : String(error),
          params,
        });
        throw error;
      }
    },
    enabled: params.enabled !== false && !!params.productId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
