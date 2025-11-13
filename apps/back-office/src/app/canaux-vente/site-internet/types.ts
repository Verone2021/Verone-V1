/**
 * Types TypeScript pour Canal Site Internet
 * Generated: 2025-11-13
 */

import type { Database } from '@/types/supabase';

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

// =====================================================
// Types Vercel Analytics
// =====================================================

/**
 * Métriques Vercel Analytics
 */
export interface VercelAnalyticsMetrics {
  // Overview
  pageviews: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;

  // Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  fcp: number; // First Contentful Paint

  // Top Pages
  topPages: Array<{
    path: string;
    pageviews: number;
    uniqueVisitors: number;
  }>;

  // Devices
  devices: {
    mobile: number;
    desktop: number;
    tablet: number;
  };

  // Time series (30 derniers jours)
  timeSeries: Array<{
    date: string;
    pageviews: number;
    uniqueVisitors: number;
  }>;
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

  // Analytics Vercel
  analytics: VercelAnalyticsMetrics | null;
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
