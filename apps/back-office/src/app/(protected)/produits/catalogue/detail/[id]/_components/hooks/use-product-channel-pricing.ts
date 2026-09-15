'use client';

/**
 * useProductChannelPricing — charge et merge les données canal/pricing
 * pour la fiche produit.
 */

import { useState, useEffect } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import type { ChannelPricingRow } from '../types';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useProductChannelPricing(
  productId: string
): ChannelPricingRow[] {
  const [channelPricing, setChannelPricing] = useState<ChannelPricingRow[]>([]);

  useEffect(() => {
    if (!productId || !UUID_RE.test(productId)) return;

    const fetchChannelPricing = async () => {
      const supabase = createClient();
      const { data: channels } = await supabase
        .from('sales_channels')
        .select('id, name, code')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(50);

      if (!channels) return;

      const { data: pricing } = await supabase
        .from('channel_pricing')
        .select(
          'channel_id, public_price_ht, custom_price_ht, discount_rate, is_active'
        )
        .eq('product_id', productId);

      const pricingMap = new Map((pricing ?? []).map(p => [p.channel_id, p]));

      const merged = channels.map(ch => {
        const p = pricingMap.get(ch.id);
        return {
          channel_id: ch.id,
          channel_name: ch.name,
          channel_code: ch.code,
          public_price_ht: p?.public_price_ht ?? null,
          custom_price_ht: p?.custom_price_ht ?? null,
          discount_rate: p?.discount_rate ?? null,
          is_active: p?.is_active ?? false,
        };
      });

      setChannelPricing(merged);
    };

    void fetchChannelPricing().catch(err => {
      console.error('[useProductChannelPricing] fetch failed:', err);
    });
  }, [productId]);

  return channelPricing;
}
