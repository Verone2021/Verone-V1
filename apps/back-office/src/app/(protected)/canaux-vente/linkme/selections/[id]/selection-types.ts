// Types and constants for the selection detail page

export type ProductFormData = {
  name: string;
  description: string;
  archived_at: string | null;
  price_display_mode: 'HT' | 'TTC';
};

export type ProductTabValue = 'all' | 'catalog' | 'reseller';

export type ProductSourceValue = 'catalog' | 'sourced';

export type MarginIndicatorColor = 'green' | 'orange' | 'red';

export const MARGIN_INDICATOR_COLORS: Record<MarginIndicatorColor, string> = {
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
};

export const MARGIN_INDICATOR_TOOLTIPS: Record<MarginIndicatorColor, string> = {
  green: 'Marge compétitive (≤15%)',
  orange: 'Marge modérée (15-25%)',
  red: 'Marge élevée (>25%)',
};

export function getMarginIndicatorColor(
  marginRate: number
): MarginIndicatorColor {
  if (marginRate <= 15) return 'green';
  if (marginRate <= 25) return 'orange';
  return 'red';
}
