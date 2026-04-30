// =============================================================================
// Types partagés — EditSiteInternetProductModal
// =============================================================================

import type { ProductFormData } from './schema';

export interface ProductDimensions {
  length?: number;
  width?: number;
  height?: number;
  unit?: string;
}

export interface SiteInternetProduct {
  product_id: string;
  sku: string;
  name: string;
  slug: string | null;
  status: string;
  seo_title: string;
  seo_meta_description: string;
  metadata: Record<string, unknown>;
  price_ht: number;
  price_ttc: number;
  price_source: string;
  primary_image_url: string | null;
  image_urls: string[];
  is_published: boolean;
  publication_date: string | null;
  has_variants: boolean;
  variants_count: number;
  is_eligible: boolean;
  ineligibility_reasons: string[];

  // Nouveaux champs (12) - Ajoutés 2025-11-17
  description: string | null;
  technical_description: string | null;
  manufacturer: string | null;
  selling_points: string[];
  dimensions: ProductDimensions | null;
  weight: number | null;
  suitable_rooms: string[];
  subcategory_id: string | null;
  subcategory_name: string | null;
  product_type: string | null;
  video_url: string | null;
  supplier_moq: number | null; // Quantité minimale de commande fournisseur
}

export interface EditSiteInternetProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: SiteInternetProduct;
  onSuccess?: () => void;
}

// Props communes aux composants d'onglets
export interface TabSharedProps {
  product: SiteInternetProduct;
  formData: Partial<ProductFormData>;
  setFormData: (data: Partial<ProductFormData>) => void;
  getError: (field: string) => { message: string } | undefined;
}
