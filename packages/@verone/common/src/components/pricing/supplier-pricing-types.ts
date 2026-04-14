export interface Product {
  id: string;
  variant_group_id?: string;
  // Tarification simplifiée
  cost_price?: number;
  eco_tax_default?: number;
  margin_percentage?: number;
  tax_rate?: number;
  selling_price?: number;
  // Prix d'achat enrichis (historique fournisseur)
  cost_price_avg?: number | null;
  cost_price_min?: number | null;
  cost_price_max?: number | null;
  cost_price_last?: number | null;
  cost_price_count?: number; // NOT NULL integer in DB, defaults to 0
  target_margin_percentage?: number | null;
  // Prix nets (achat + shipping + insurance par unité)
  cost_net_avg?: number | null;
  cost_net_min?: number | null;
  cost_net_max?: number | null;
  cost_net_last?: number | null;
}

export interface VariantGroup {
  id: string;
  name: string;
  has_common_cost_price?: boolean | null;
  common_cost_price?: number | null;
  common_eco_tax?: number | null;
}

/** Channel pricing data joined with sales channel info */
export interface ChannelPricingRow {
  channel_id: string;
  channel_name: string;
  channel_code: string;
  public_price_ht: number | null;
  custom_price_ht: number | null;
  discount_rate: number | null;
  is_active: boolean;
}

/** Typed shape for pricing edit data (avoids unsafe `any` from useInlineEdit) */
export interface PricingEditData {
  cost_price?: number;
  eco_tax_default?: number;
  margin_percentage?: number;
  selling_price?: number;
}

export interface SupplierVsPricingEditSectionProps {
  product: Product;
  variantGroup?: VariantGroup | null;
  onUpdate: (updatedProduct: Partial<Product>) => void;
  className?: string;
  /** Channel pricing data for this product (from channel_pricing + sales_channels) */
  channelPricing?: ChannelPricingRow[];
}
