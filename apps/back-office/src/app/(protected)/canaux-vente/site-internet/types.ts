/**
 * Types TypeScript pour Canal Site Internet
 * Generated: 2025-11-13
 */

import type { Database } from '@verone/types';

// =====================================================
// Types Database Supabase
// =====================================================

export type SalesChannel =
  Database['public']['Tables']['sales_channels']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type ProductImage =
  Database['public']['Tables']['product_images']['Row'];
export type Collection = Database['public']['Tables']['collections']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type ChannelProductMetadata =
  Database['public']['Tables']['channel_product_metadata']['Row'];
export type ChannelPricing =
  Database['public']['Tables']['channel_pricing']['Row'];
export type VariantGroup =
  Database['public']['Tables']['variant_groups']['Row'];
// Note: product_variants table not yet in schema - will be available after migrations
// export type ProductVariant = Database['public']['Tables']['product_variants']['Row'];

// =====================================================
// Shared Types
// =====================================================

export interface ProductDimensions {
  length?: number;
  width?: number;
  height?: number;
  unit?: string;
}

// =====================================================
// Types RPC Functions
// =====================================================

/**
 * Résultat fonction RPC get_site_internet_products()
 */
export interface SiteInternetProduct {
  // Identifiant
  product_id: string;
  sku: string;
  name: string;
  slug: string | null;
  status: string;

  // SEO
  seo_title: string;
  seo_meta_description: string;
  metadata: Record<string, unknown>;

  // Prix
  price_ht: number;
  price_ttc: number;
  price_source: 'channel_pricing' | 'base_price';
  discount_rate: number | null; // Taux de réduction (0.30 = 30%)

  // Images
  primary_image_url: string | null;
  image_urls: string[];

  // Publication
  is_published: boolean;
  publication_date: string | null;

  // Cout
  cost_price: number;

  // Variantes
  has_variants: boolean;
  variants_count: number; // Total variantes (toutes)
  variant_group_id: string | null;
  eligible_variants_count: number; // ✨ Ajouté 2025-11-19 - Uniquement variantes éligibles

  // Éligibilité
  is_eligible: boolean;
  ineligibility_reasons: string[];

  // ===== NOUVEAUX CHAMPS (11) - Ajoutés 2025-11-17 =====

  // Descriptions et marketing (editable avec waterfall canal → produit)
  description: string | null;
  technical_description: string | null;
  manufacturer: string | null;
  selling_points: string[];

  // Informations produit (READ-ONLY - catalogue uniquement)
  dimensions: ProductDimensions | null;
  weight: number | null;
  suitable_rooms: string[];
  subcategory_id: string | null;
  subcategory_name: string | null;
  product_type: string | null;
  video_url: string | null;
  supplier_moq: number | null; // Quantité minimale de commande fournisseur
}

/**
 * Résultat fonction RPC get_site_internet_product_detail()
 */
export interface SiteInternetProductDetail {
  product: {
    id: string;
    sku: string;
    name: string;
    slug: string;
    description: string;
    status: string;
    is_published_online: boolean;
    publication_date: string | null;

    // SEO
    seo_title: string;
    seo_meta_description: string;

    // Prix
    price_ht: number;
    price_ttc: number;

    // Images
    images: Array<{
      id: string;
      url: string;
      is_primary: boolean;
      display_order: number;
    }>;
  };

  variants: Array<{
    variant_group_id: string;
    group_name: string;
    group_type: string;
    variants: Array<{
      id: string;
      sku: string;
      option_value: string;
      price_ht: number | null;
      stock_quantity: number;
      is_active: boolean;
      display_order: number;
    }>;
  }> | null;
}

/**
 * Résultat fonction RPC get_site_internet_config()
 */
export interface SiteInternetConfig {
  id: string;
  code: string;
  name: string;
  description: string;
  domain_url: string;
  site_name: string;
  site_logo_url: string | null;
  default_meta_title: string;
  default_meta_description: string;
  meta_keywords: string[];
  contact_email: string;
  contact_phone: string;
  config: {
    analytics?: {
      google_analytics_id?: string | null;
      google_tag_manager_id?: string | null;
    };
    social_links?: {
      instagram?: string | null;
      facebook?: string | null;
      tiktok?: string | null;
    };
    features?: {
      enable_wishlist?: boolean;
      enable_reviews?: boolean;
      enable_live_chat?: boolean;
    };
    shipping?: {
      // Livraison standard
      standard_enabled: boolean;
      standard_label: string;
      standard_price_cents: number;
      standard_min_days: number;
      standard_max_days: number;

      // Livraison express
      express_enabled: boolean;
      express_label: string;
      express_price_cents: number;
      express_min_days: number;
      express_max_days: number;

      // Seuil livraison gratuite
      free_shipping_enabled: boolean;
      free_shipping_threshold_cents: number;
      free_shipping_applies_to: 'standard' | 'all';

      // Zones autorisées
      allowed_countries: string[];

      // Message informatif
      shipping_info_message?: string;
    };
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// Types UI Components
// =====================================================

/**
 * Props ProductCard
 */
export interface ProductCardProps {
  product: SiteInternetProduct;
  onEdit: (productId: string) => void;
  onDelete: (productId: string) => void;
  onTogglePublish: (productId: string, isPublished: boolean) => void;
  onPreview: (productId: string) => void;
}

/**
 * Props ProductSEOEditor
 */
export interface ProductSEOEditorProps {
  productId: string;
  currentMetadata?: ChannelProductMetadata;
  onSave: (metadata: Partial<ChannelProductMetadata>) => Promise<void>;
  onClose: () => void;
}

/**
 * Props ProductVariantsDisplay
 */
export interface ProductVariantsDisplayProps {
  productId: string;
  variants: SiteInternetProductDetail['variants'];
  onToggleVariant: (variantId: string, isActive: boolean) => Promise<void>;
}

/**
 * Props ChannelConfigEditor
 */
export interface ChannelConfigEditorProps {
  config: SiteInternetConfig;
  onSave: (config: Partial<SiteInternetConfig>) => Promise<void>;
}

/**
 * Stats Dashboard Canal
 */
export interface SiteInternetStats {
  productsPublished: number;
  productsTotal: number;
  collectionsVisible: number;
  collectionsTotal: number;
  categoriesVisible: number;
  categoriesTotal: number;
}

// =====================================================
// Types Filters & Search
// =====================================================

/**
 * Filtres liste produits
 */
export interface ProductFilters {
  search?: string;
  status?: 'all' | 'published' | 'draft';
  hasVariants?: boolean;
  isEligible?: boolean;
}

/**
 * Tri liste produits
 */
export type ProductSortOption =
  | 'name_asc'
  | 'name_desc'
  | 'created_desc'
  | 'created_asc'
  | 'price_asc'
  | 'price_desc';

// =====================================================
// Types Forms
// =====================================================

/**
 * Formulaire édition métadonnées SEO
 */
export interface SEOMetadataForm {
  seo_title: string;
  seo_meta_description: string;
  slug: string;
  is_featured: boolean;
  display_order: number;
}

/**
 * Formulaire configuration canal
 */
export interface ChannelConfigForm {
  domain_url: string;
  site_name: string;
  site_logo_url: string | null;
  default_meta_title: string;
  default_meta_description: string;
  meta_keywords: string[];
  contact_email: string;
  contact_phone: string;
}
