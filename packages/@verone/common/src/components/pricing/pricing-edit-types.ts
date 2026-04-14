export interface PricingProduct {
  id: string;
  variant_group_id?: string;
  cost_price?: number;
  eco_tax_default?: number;
  margin_percentage?: number;
  tax_rate?: number;
  selling_price?: number;
  cost_price_avg?: number | null;
  cost_price_min?: number | null;
  cost_price_max?: number | null;
  cost_price_last?: number | null;
  cost_price_count?: number;
  target_margin_percentage?: number | null;
  cost_net_avg?: number | null;
  cost_net_min?: number | null;
  cost_net_max?: number | null;
  cost_net_last?: number | null;
}

export interface PricingVariantGroup {
  id: string;
  name: string;
  has_common_cost_price?: boolean | null;
  common_cost_price?: number | null;
  common_eco_tax?: number | null;
}

export interface ChannelPricingRow {
  channel_id: string;
  channel_name: string;
  channel_code: string;
  public_price_ht: number | null;
  custom_price_ht: number | null;
  discount_rate: number | null;
  is_active: boolean;
}

export interface PricingEditData {
  cost_price?: number;
  eco_tax_default?: number;
  margin_percentage?: number;
  selling_price?: number;
}
