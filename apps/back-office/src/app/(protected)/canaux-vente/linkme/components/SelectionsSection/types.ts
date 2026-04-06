export interface Selection {
  id: string;
  affiliate_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  share_token: string | null;
  products_count: number | null;
  views_count: number | null;
  orders_count: number | null;
  archived_at: string | null; // NULL = active, timestamp = archivée
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined
  affiliate?: {
    display_name: string;
    slug: string;
  } | null;
}

export interface CatalogProduct {
  id: string;
  product_id: string;
  product_name: string;
  product_reference: string;
  product_price_ht: number;
  product_image_url: string | null;
  max_margin_rate: number;
  min_margin_rate: number;
  suggested_margin_rate: number;
  /** Commission LinkMe (%) - depuis RPC get_linkme_catalog_products_for_affiliate */
  linkme_commission_rate: number | null;
}

export interface SelectedProduct {
  product_id: string;
  product_name: string;
  base_price_ht: number;
  margin_rate: number;
  /** Limites de marge depuis le catalogue */
  min_margin_rate: number;
  max_margin_rate: number;
  suggested_margin_rate: number;
  /** Commission LinkMe (%) */
  linkme_commission_rate: number;
}

// Types for Supabase query results
export interface CatalogDataItem {
  id: string;
  product_id: string;
  max_margin_rate: number | null;
  min_margin_rate: number | null;
  suggested_margin_rate: number | null;
  channel_commission_rate: number | null;
  public_price_ht: number | null;
  products: { name: string; sku: string } | null;
}

export interface ProductImageItem {
  product_id: string;
  public_url: string;
}

export interface SelectionFormData {
  affiliate_id: string;
  name: string;
  description: string;
}
