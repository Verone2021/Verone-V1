'use client';

import { useQuery } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';
import { logger } from '@verone/utils/logger';

export interface TopImageRow {
  asset_id: string;
  product_id: string | null;
  public_url: string;
  filename: string;
  alt_text: string | null;
  total_impressions: number;
  total_clicks: number;
  total_saves: number;
  total_conversions: number;
  ctr: number;
}

export interface UseTopImagesOptions {
  channelCode: string;
  startDate: string;
  endDate: string;
  limit?: number;
  enabled?: boolean;
}

export function useTopImages({
  channelCode,
  startDate,
  endDate,
  limit = 20,
  enabled = true,
}: UseTopImagesOptions) {
  return useQuery<TopImageRow[]>({
    queryKey: ['top-images', channelCode, startDate, endDate, limit],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc(
        'get_top_images' as never,
        {
          p_channel_code: channelCode,
          p_start_date: startDate,
          p_end_date: endDate,
          p_limit: limit,
        } as never
      );

      if (error) {
        logger.error(`[useTopImages] Failed: ${error.message}`);
        throw new Error(error.message);
      }

      return (data ?? []) as TopImageRow[];
    },
    enabled,
    staleTime: 60_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}
