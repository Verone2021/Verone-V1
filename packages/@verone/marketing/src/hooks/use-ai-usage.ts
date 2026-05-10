'use client';

import { useQuery } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

export interface AiUsageStats {
  total_calls: number;
  total_cost_cents: number;
  total_tokens_input: number;
  total_tokens_output: number;
  avg_latency_ms: number;
  error_count: number;
  error_rate: number;
  unique_users: number;
}

export interface AiUsageByEndpoint {
  endpoint: string;
  total_calls: number;
  total_cost_cents: number;
  avg_latency_ms: number;
  error_count: number;
}

export function useAiUsageStats(periodDays = 30) {
  return useQuery<AiUsageStats | null>({
    queryKey: ['ai-usage-stats', periodDays],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc(
        'get_ai_usage_stats' as never,
        { p_period_days: periodDays } as never
      );
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as AiUsageStats[];
      return rows[0] ?? null;
    },
    staleTime: 60_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
  });
}

export function useAiUsageByEndpoint(periodDays = 30) {
  return useQuery<AiUsageByEndpoint[]>({
    queryKey: ['ai-usage-by-endpoint', periodDays],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc(
        'get_ai_usage_by_endpoint' as never,
        { p_period_days: periodDays } as never
      );
      if (error) throw new Error(error.message);
      return (data ?? []) as AiUsageByEndpoint[];
    },
    staleTime: 60_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
  });
}
