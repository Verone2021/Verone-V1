'use client';

import { useQuery } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';
import { logger } from '@verone/utils/logger';

export interface ChannelStatsProductRow {
  snapshot_date: string;
  product_id: string;
  product_name: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue_ht: number;
}

export interface UseChannelStatsProductHistoryOptions {
  channelCode: string;
  startDate: string;
  endDate: string;
  productId?: string;
  enabled?: boolean;
}

export function useChannelStatsProductHistory({
  channelCode,
  startDate,
  endDate,
  productId,
  enabled = true,
}: UseChannelStatsProductHistoryOptions) {
  return useQuery<ChannelStatsProductRow[]>({
    queryKey: [
      'channel-stats-product-history',
      channelCode,
      startDate,
      endDate,
      productId ?? null,
    ],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc(
        'get_channel_stats_history' as never,
        {
          p_channel_code: channelCode,
          p_start_date: startDate,
          p_end_date: endDate,
          p_product_id: productId ?? null,
        } as never
      );

      if (error) {
        logger.error(
          `[useChannelStatsProductHistory] Failed: ${error.message}`
        );
        throw new Error(error.message);
      }

      return (data ?? []) as ChannelStatsProductRow[];
    },
    enabled,
    staleTime: 60_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}
