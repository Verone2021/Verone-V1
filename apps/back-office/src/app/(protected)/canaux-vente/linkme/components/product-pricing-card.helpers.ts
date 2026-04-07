import type { LinkMePricingUpdate } from '../types';

export const TVA_RATE = 0.2;

export const ttcToHt = (ttc: number): number => ttc / (1 + TVA_RATE);
export const htToTtc = (ht: number): number => ht * (1 + TVA_RATE);

export function calculatePricingCompleteness(formData: LinkMePricingUpdate): {
  percentage: number;
  completedCount: number;
  totalCount: number;
} {
  const fields = [
    formData.public_price_ht !== null &&
      formData.public_price_ht !== undefined &&
      formData.public_price_ht > 0,
    formData.custom_price_ht !== null &&
      formData.custom_price_ht !== undefined &&
      formData.custom_price_ht > 0,
    formData.min_margin_rate !== null && formData.min_margin_rate !== undefined,
    formData.max_margin_rate !== null && formData.max_margin_rate !== undefined,
    formData.suggested_margin_rate !== null &&
      formData.suggested_margin_rate !== undefined,
    formData.channel_commission_rate !== null &&
      formData.channel_commission_rate !== undefined,
  ];

  const completedCount = fields.filter(Boolean).length;
  const totalCount = fields.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return { percentage, completedCount, totalCount };
}
