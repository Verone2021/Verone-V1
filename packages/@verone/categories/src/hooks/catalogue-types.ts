interface ProductGroup {
  id: string;
  name: string;
  description?: string;
  slug: string;
  category_id: string;
  brand?: string;
  status: 'draft' | 'active' | 'inactive' | 'discontinued';
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  cost_price: number;
  cost_price_count: number;
  tax_rate: number;
  stock_status: 'in_stock' | 'out_of_stock' | 'coming_soon';
  product_status: 'active' | 'preorder' | 'discontinued' | 'draft';
  condition: 'new' | 'refurbished' | 'used';
  variant_attributes: Record<string, unknown>;
  dimensions?: Record<string, unknown>;
  weight?: number;
  primary_image_url: string;
  gallery_images: string[];
  video_url?: string;
  supplier_reference?: string;
  gtin?: string;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
  subcategory_id?: string;
  brand?: string;
  supplier_id?: string;
  product_type?: 'standard' | 'custom';
  supplier?: {
    id: string;
    legal_name: string;
    trade_name: string | null;
  };
  subcategories?: {
    id: string;
    name: string;
  };
  has_images?: boolean;
  stock_real?: number;
  min_stock?: number;
  stock_quantity?: number;
  stock_forecasted_in?: number;
  stock_forecasted_out?: number;
  cost_net_avg?: number | null;
  cost_net_last?: number | null;
  cost_net_min?: number | null;
  cost_net_max?: number | null;
  margin_percentage?: number | null;
  completion_percentage?: number | null;
  completion_status?: string | null;
  target_margin_percentage?: number | null;
  target_price?: number | null;
}

export interface Category {
  id: string;
  parent_id?: string;
  name: string;
  slug: string;
  level: number;
  google_category_id?: number;
  facebook_category?: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CatalogueFilters {
  search?: string;
  families?: string[];
  categories?: string[];
  subcategories?: string[];
  statuses?: string[];
  suppliers?: string[];
  missingFields?: string[];
  stockLevels?: string[];
  conditions?: string[];
  completionLevels?: string[];
  priceMin?: number;
  priceMax?: number;
  marginMin?: number;
  marginMax?: number;
  brands?: string[];
  /** Filtre publication en ligne (site internet) */
  publishedOnline?: 'all' | 'published' | 'unpublished';
  limit?: number;
  offset?: number;
  page?: number;
}

export interface CatalogueState {
  productGroups: ProductGroup[];
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  total: number;
}

export const ITEMS_PER_PAGE = 24;
