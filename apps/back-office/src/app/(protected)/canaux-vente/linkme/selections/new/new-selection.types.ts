export interface SelectedProduct {
  product_id: string;
  name: string;
  sku: string;
  image_url: string | null;
  base_price_ht: number;
  linkme_price_ht: number;
  public_price_ht: number | null;
  commission_rate: number;
  margin_rate: number;
  max_margin_rate: number;
  suggested_margin_rate: number;
}

export const DEFAULT_COMMISSION_RATE = 0.05; // 5%
export const MIN_MARGIN_RATE = 0.01; // 1%
export const DEFAULT_MARGIN_RATE = 0.15; // 15%
