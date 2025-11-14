/**
 * Types CMS - Synchronisés avec Canal Site Internet Back-Office
 * Source: apps/back-office/src/app/canaux-vente/site-internet/types.ts
 * Generated: 2025-11-14
 */

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
  slug: string;
  status: string;

  // SEO
  seo_title: string;
  seo_meta_description: string;
  metadata: Record<string, any>;

  // Prix
  price_ht: number;
  price_ttc: number;
  price_source: 'channel_pricing' | 'base_price';

  // Images
  primary_image_url: string | null;
  image_urls: string[];

  // Publication
  is_published: boolean;
  publication_date: string | null;

  // Variantes
  has_variants: boolean;
  variants_count: number;

  // Éligibilité
  is_eligible: boolean;
  ineligibility_reasons: string[];
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
      vercel_enabled?: boolean;
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
      free_shipping_threshold?: number;
      regions?: string[];
    };
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Résultat fonction RPC get_site_internet_collections()
 */
export interface SiteInternetCollection {
  collection_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  seo_title: string;
  seo_meta_description: string;
  is_visible: boolean;
  display_order: number;
  products_count: number;
}

/**
 * Résultat fonction RPC get_site_internet_categories()
 */
export interface SiteInternetCategory {
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  seo_title: string;
  seo_meta_description: string;
  is_visible_menu: boolean;
  display_order: number;
  products_count: number;
  parent_id: string | null;
  parent_name: string | null;
}
