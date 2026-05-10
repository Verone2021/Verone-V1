'use client';

import { useState, useCallback, useEffect } from 'react';

import { createClient } from '@verone/utils/supabase/client';

export interface ChannelPerformance {
  impressions: number;
  clicks: number;
  conversions: number;
  revenue_ht: number;
  synced_at: string | null;
}

export interface ProductPerformanceState {
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  total_revenue_ht: number;
  meta: ChannelPerformance | null;
  google: ChannelPerformance | null;
  last_synced_at: string | null;
  hasData: boolean;
  loading: boolean;
  error: string | null;
}

export interface UseProductPerformanceReturn extends ProductPerformanceState {
  refresh: () => Promise<void>;
}

const EMPTY_STATE: ProductPerformanceState = {
  total_impressions: 0,
  total_clicks: 0,
  total_conversions: 0,
  total_revenue_ht: 0,
  meta: null,
  google: null,
  last_synced_at: null,
  hasData: false,
  loading: true,
  error: null,
};

export function useProductPerformance(
  productId: string
): UseProductPerformanceReturn {
  const supabase = createClient();
  const [state, setState] = useState<ProductPerformanceState>(EMPTY_STATE);

  const refresh = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));

    const [metaResult, googleResult] = await Promise.all([
      supabase
        .from('meta_commerce_syncs')
        .select('impressions, clicks, conversions, revenue_ht, synced_at')
        .eq('product_id', productId)
        .neq('sync_status', 'deleted')
        .maybeSingle(),
      supabase
        .from('google_merchant_syncs')
        .select('impressions, clicks, conversions, revenue_ht, synced_at')
        .eq('product_id', productId)
        .maybeSingle(),
    ]);

    if (metaResult.error && metaResult.error.code !== 'PGRST116') {
      setState(s => ({
        ...s,
        loading: false,
        error: metaResult.error?.message ?? 'Erreur Meta',
      }));
      return;
    }

    if (googleResult.error && googleResult.error.code !== 'PGRST116') {
      setState(s => ({
        ...s,
        loading: false,
        error: googleResult.error?.message ?? 'Erreur Google',
      }));
      return;
    }

    const meta: ChannelPerformance | null = metaResult.data
      ? {
          impressions: metaResult.data.impressions ?? 0,
          clicks: metaResult.data.clicks ?? 0,
          conversions: metaResult.data.conversions ?? 0,
          revenue_ht: Number(metaResult.data.revenue_ht ?? 0),
          synced_at: metaResult.data.synced_at,
        }
      : null;

    const google: ChannelPerformance | null = googleResult.data
      ? {
          impressions: googleResult.data.impressions ?? 0,
          clicks: googleResult.data.clicks ?? 0,
          conversions: googleResult.data.conversions ?? 0,
          revenue_ht: Number(googleResult.data.revenue_ht ?? 0),
          synced_at: googleResult.data.synced_at,
        }
      : null;

    const total_impressions =
      (meta?.impressions ?? 0) + (google?.impressions ?? 0);
    const total_clicks = (meta?.clicks ?? 0) + (google?.clicks ?? 0);
    const total_conversions =
      (meta?.conversions ?? 0) + (google?.conversions ?? 0);
    const total_revenue_ht =
      (meta?.revenue_ht ?? 0) + (google?.revenue_ht ?? 0);

    const syncedDates = [meta?.synced_at, google?.synced_at]
      .filter((d): d is string => Boolean(d))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    setState({
      total_impressions,
      total_clicks,
      total_conversions,
      total_revenue_ht,
      meta,
      google,
      last_synced_at: syncedDates[0] ?? null,
      hasData: meta !== null || google !== null,
      loading: false,
      error: null,
    });
  }, [productId, supabase]);

  useEffect(() => {
    void refresh().catch(err =>
      console.error('[useProductPerformance] refresh failed:', err)
    );
  }, [refresh]);

  return { ...state, refresh };
}
