/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

import { useQuery } from '@tanstack/react-query';

import { logger } from '@verone/utils/logger';
import { createClient } from '@verone/utils/supabase/client';

import type { ChannelPricing, SalesChannel } from './types';

export function useSalesChannels() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['sales-channels'],
    queryFn: async (): Promise<SalesChannel[]> => {
      try {
        // [BO-PERF-QUICKWINS-001] select explicite (colonnes de SalesChannel)
        const { data, error } = await (supabase as { from: CallableFunction })
          .from('sales_channels')
          .select(
            'id, code, name, description, default_discount_rate, is_active, requires_approval, min_order_value, display_order, icon_name'
          )
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) {
          logger.error('Failed to fetch sales channels', undefined, {
            operation: 'useSalesChannels',
            error: error.message,
          });
          throw error;
        }

        logger.info('Sales channels fetched successfully', {
          operation: 'useSalesChannels',
          count: data?.length ?? 0,
        });
        return (data as unknown as SalesChannel[]) ?? [];
      } catch (error) {
        logger.error('Exception in useSalesChannels', undefined, {
          operation: 'useSalesChannels',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useChannelPricing(productId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['channel-pricing', productId],
    queryFn: async (): Promise<ChannelPricing[]> => {
      try {
        // [BO-PERF-QUICKWINS-001] select explicite (colonnes de ChannelPricing)
        const { data, error } = await (supabase as { from: CallableFunction })
          .from('channel_pricing')
          .select(
            `id, product_id, channel_id, custom_price_ht, public_price_ht, discount_rate, markup_rate, min_quantity, valid_from, valid_until, is_active, notes, sales_channels (code, name)`
          )
          .eq('product_id', productId)
          .eq('is_active', true)
          .order('min_quantity', { ascending: true });

        if (error) {
          logger.error('Failed to fetch channel pricing', undefined, {
            operation: 'useChannelPricing',
            productId,
            error: error.message,
          });
          throw error;
        }

        logger.info('Channel pricing fetched successfully', {
          operation: 'useChannelPricing',
          productId,
          count: data?.length ?? 0,
        });
        return (data as unknown as ChannelPricing[]) ?? [];
      } catch (error) {
        logger.error('Exception in useChannelPricing', undefined, {
          operation: 'useChannelPricing',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
