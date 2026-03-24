/**
 * Internal types for the QuoteFormModal and its sub-components.
 */

export type QuoteChannelType =
  | 'manual'
  | 'site-internet'
  | 'linkme'
  | 'service';

export type WizardStep =
  | 'channel-selection'
  | 'linkme-affiliate'
  | 'linkme-selection'
  | 'form';

export interface QuoteItemLocal {
  id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price_ht: number;
  tva_rate: number;
  discount_percentage: number;
  eco_tax: number;
  is_service: boolean; // true for free-form service lines
  product?: {
    name: string;
    sku: string;
    primary_image_url?: string;
  };
  // LinkMe metadata
  linkme_selection_item_id?: string | null;
  base_price_ht?: number | null;
  retrocession_rate?: number | null;
}

export interface QuoteFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export interface QuoteTotals {
  itemsTotalHt: number;
  itemsTva: number;
  feesTotalHt: number;
  feesTva: number;
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  tvaByRate: Record<number, { base: number; tva: number }>;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
