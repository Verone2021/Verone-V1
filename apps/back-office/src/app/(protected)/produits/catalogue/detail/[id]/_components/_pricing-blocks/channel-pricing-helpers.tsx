'use client';

/**
 * channel-pricing-helpers — calculs de marge et composant MarginBadge
 * pour ChannelPricingDetailed.
 *
 * Sprint : BO-UI-PROD-PRICING-001
 */

import { cn } from '@verone/utils';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface OverrideConfirm {
  channelId: string;
  channelName: string;
  price: number;
}

export interface ComputedChannelRow {
  channel_id: string;
  channel_code: string;
  channel_name: string;
  public_price_ht: number | null | undefined;
  custom_price_ht: number | null | undefined;
  discount_rate: number | null | undefined;
  is_active: boolean;
  channel_commission_rate: number | null | undefined;
  effectivePrice: number | undefined;
  belowMin: boolean;
  gapVsMin: number | null;
  grossMargin: number | null;
  commissionRate: number | null;
  netMargin: number | null;
  commissionAmount: number | null;
  netPrice: number | null;
  netMarginEur: number | null;
}

// ---------------------------------------------------------------------------
// Pure calculation helpers
// ---------------------------------------------------------------------------

export function calcGrossMarginPct(
  priceHt: number,
  minSelling: number
): number | null {
  if (minSelling <= 0) return null;
  return ((priceHt - minSelling) / minSelling) * 100;
}

export function calcNetMarginPct(
  priceHt: number,
  commissionRate: number | null,
  landedCost: number
): number | null {
  if (priceHt <= 0 || landedCost <= 0) return null;
  const rate = commissionRate ?? 0;
  const netPrice = priceHt * (1 - rate / 100);
  if (netPrice <= 0) return null;
  return ((netPrice - landedCost) / netPrice) * 100;
}

// ---------------------------------------------------------------------------
// MarginBadge — affiche un % de marge coloré
// ---------------------------------------------------------------------------

export function MarginBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-neutral-300">—</span>;
  const isNeg = value < 0;
  return (
    <span
      className={cn(
        'tabular-nums font-medium',
        isNeg ? 'text-red-600' : 'text-green-700'
      )}
    >
      {value >= 0 ? '+' : ''}
      {value.toFixed(0)} %
    </span>
  );
}
