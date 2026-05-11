'use client';

import { useQuery } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';
import { logger } from '@verone/utils/logger';

export interface ChannelStatsAggregatedRow {
  snapshot_date: string;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  total_revenue_ht: number;
  conversion_rate: number;
}

export interface UseChannelStatsAggregatedOptions {
  channelCode: 'meta_commerce' | 'google_merchant' | string;
  startDate: string;
  endDate: string;
  enabled?: boolean;
}

export function useChannelStatsAggregated({
  channelCode,
  startDate,
  endDate,
  enabled = true,
}: UseChannelStatsAggregatedOptions) {
  return useQuery<ChannelStatsAggregatedRow[]>({
    queryKey: ['channel-stats-aggregated', channelCode, startDate, endDate],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc(
        'get_channel_stats_aggregated' as never,
        {
          p_channel_code: channelCode,
          p_start_date: startDate,
          p_end_date: endDate,
        } as never
      );

      if (error) {
        logger.error(`[useChannelStatsAggregated] Failed: ${error.message}`);
        throw new Error(error.message);
      }

      return (data ?? []) as ChannelStatsAggregatedRow[];
    },
    enabled,
    staleTime: 60_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}
