'use client';

/**
 * useChannelPricingEditor — état et callbacks d'édition du tableau canal.
 * Isole toute la logique interactive de ChannelPricingDetailed.
 *
 * Sprint : BO-UI-PROD-PRICING-001
 */

import { useState, useMemo, useCallback } from 'react';

import { useChannelPricing, useUpdateChannelPrice } from '@verone/common';

import {
  calcGrossMarginPct,
  calcNetMarginPct,
} from './channel-pricing-helpers';
import type {
  ComputedChannelRow,
  OverrideConfirm,
} from './channel-pricing-helpers';

interface UseChannelPricingEditorArgs {
  productId: string;
  minimumSellingPrice: number;
  landedCost: number | null;
}

export function useChannelPricingEditor({
  productId,
  minimumSellingPrice,
  landedCost,
}: UseChannelPricingEditorArgs) {
  const { data: channels, isLoading } = useChannelPricing(productId);
  const update = useUpdateChannelPrice();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftPrice, setDraftPrice] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [overrideConfirm, setOverrideConfirm] =
    useState<OverrideConfirm | null>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  }, []);

  const rows = useMemo(
    () =>
      (channels ?? []).map(c => {
        const effectivePrice = c.custom_price_ht ?? c.public_price_ht;
        const belowMin =
          effectivePrice != null &&
          minimumSellingPrice > 0 &&
          effectivePrice < minimumSellingPrice;
        const gapVsMin =
          effectivePrice != null && minimumSellingPrice > 0
            ? effectivePrice - minimumSellingPrice
            : null;
        const grossMargin =
          effectivePrice != null
            ? calcGrossMarginPct(effectivePrice, minimumSellingPrice)
            : null;
        const commissionRate = c.channel_commission_rate ?? null;
        const netMargin =
          effectivePrice != null && landedCost != null && landedCost > 0
            ? calcNetMarginPct(effectivePrice, commissionRate, landedCost)
            : null;
        const commissionAmount =
          effectivePrice != null && commissionRate != null
            ? effectivePrice * (commissionRate / 100)
            : null;
        const netPrice =
          effectivePrice != null && commissionRate != null
            ? effectivePrice * (1 - commissionRate / 100)
            : null;
        const netMarginEur =
          netPrice != null && landedCost != null ? netPrice - landedCost : null;
        return {
          ...c,
          effectivePrice,
          belowMin,
          gapVsMin,
          grossMargin,
          commissionRate,
          netMargin,
          commissionAmount,
          netPrice,
          netMarginEur,
        } as ComputedChannelRow;
      }),
    [channels, minimumSellingPrice, landedCost]
  );

  const persist = useCallback(
    async (channelId: string, price: number | null, override = false) => {
      try {
        await update.mutateAsync({
          product_id: productId,
          channel_id: channelId,
          custom_price_ht: price,
          discount_rate: null,
          is_active: true,
          override_minimum: override,
        });
        setEditingId(null);
        setOverrideConfirm(null);
      } catch {
        // toast géré par le hook useUpdateChannelPrice
      }
    },
    [update, productId]
  );

  const save = useCallback(
    async (channelId: string, channelName: string) => {
      const parsed = draftPrice ? parseFloat(draftPrice) : null;
      if (parsed != null && (Number.isNaN(parsed) || parsed < 0)) return;
      // Si le prix est sous le minimum, demander confirmation explicite
      // pour activer override_minimum (la route /api/channel-pricing/upsert
      // renverrait sinon 422). Voir docs/current/canaux-vente-publication-rules.md
      if (
        parsed != null &&
        minimumSellingPrice > 0 &&
        parsed < minimumSellingPrice
      ) {
        setOverrideConfirm({ channelId, channelName, price: parsed });
        return;
      }
      await persist(channelId, parsed, false);
    },
    [draftPrice, minimumSellingPrice, persist]
  );

  const fillWithMinimum = useCallback(() => {
    if (minimumSellingPrice > 0) {
      setDraftPrice(minimumSellingPrice.toFixed(2));
    }
  }, [minimumSellingPrice]);

  const startEdit = useCallback(
    (channelId: string, currentPrice: number | null | undefined) => {
      setEditingId(channelId);
      setDraftPrice(currentPrice != null ? String(currentPrice) : '');
    },
    []
  );

  return {
    isLoading,
    editingId,
    draftPrice,
    expandedId,
    overrideConfirm,
    rows,
    isPending: update.isPending,
    startEdit,
    setEditingId,
    setDraftPrice,
    setOverrideConfirm,
    toggleExpand,
    persist,
    save,
    fillWithMinimum,
  };
}
