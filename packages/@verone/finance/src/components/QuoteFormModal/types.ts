// =====================================================================
// Types locaux — QuoteFormModal (Service-only)
// =====================================================================

export interface QuoteItemLocal {
  id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price_ht: number;
  tva_rate: number;
  discount_percentage: number;
  eco_tax: number;
  is_service: boolean;
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
