import type { Json } from '@verone/types';

// Types
export interface SelectionItem {
  id: string;
  selection_id: string;
  product_id: string;
  base_price_ht: number;
  margin_rate: number;
  selling_price_ht: number | null;
  display_order: number | null;
  is_featured: boolean | null;
  is_hidden_by_staff: boolean;
  created_at: string | null;
  product?: {
    id: string;
    name: string;
    sku: string;
    cost_price: number | null;
    product_status: string;
    /** Stock reel (source de verite) */
    stock_real?: number | null;
    /** Description du produit (pour modal détail) */
    description?: string | null;
    /** Arguments de vente (pour modal détail) */
    selling_points?: Json;
    /** Poids en kg */
    weight_kg?: number | null;
    /** Dimensions en cm (jsonb) */
    dimensions_cm?: Record<string, number | string> | null;
    /** ID de la sous-catégorie (pour filtrage) */
    subcategory_id?: string | null;
    /** Nom de la sous-catégorie */
    category_name?: string | null;
    /** Fournisseur */
    supplier_name?: string | null;
    /**
     * PRODUITS AFFILIÉ (Revendeur) - champs pour modèle inversé
     * Si created_by_affiliate IS NOT NULL → produit créé par l'affilié
     * Le prix catalogue = prix de vente client
     * Verone DÉDUIT sa commission, l'affilié reçoit le reste
     */
    created_by_affiliate?: string | null;
    /** Taux commission Verone sur produits affilié (ex: 15%) */
    affiliate_commission_rate?: number | null;
    /** Payout affilié = prix vente - commission Verone */
    affiliate_payout_ht?: number | null;
  };
  product_image_url?: string | null;
  /** Commission LinkMe en décimal (0.05 = 5%) - depuis channel_pricing */
  commission_rate?: number | null;
  /** Prix client LinkMe calculé (custom_price_ht) - depuis channel_pricing du catalogue général */
  catalog_price_ht?: number | null;
  /** Prix public HT (pour comparaison) - depuis channel_pricing */
  public_price_ht?: number | null;
  /** Marge minimum autorisée (décimal) - depuis channel_pricing */
  min_margin_rate?: number | null;
  /** Marge maximum autorisée (décimal) - depuis channel_pricing */
  max_margin_rate?: number | null;
  /** Marge suggérée (décimal) - depuis channel_pricing */
  suggested_margin_rate?: number | null;
  /** Buffer rate sous prix public (décimal) - depuis channel_pricing */
  buffer_rate?: number | null;
  /** ID du channel_pricing pour lien vers catalogue LinkMe */
  channel_pricing_id?: string | null;
}

export interface SelectionDetail {
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
  total_revenue: number | null;
  archived_at: string | null; // NULL = active, timestamp = archivée
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  /** Mode d'affichage des prix: HT ou TTC (défaut: TTC) */
  price_display_mode?: 'HT' | 'TTC' | null;
  affiliate?: {
    id: string;
    display_name: string;
    slug: string;
    enseigne_id: string | null;
    /** Organisation liée (pour récupérer enseigne_id via organisation) */
    organisation?: {
      enseigne_id: string | null;
    } | null;
  };
  items?: SelectionItem[];
}

// Type pour les produits sourcés par une enseigne
export interface SourcedProduct {
  id: string;
  name: string;
  sku: string;
  /** Prix de vente HT (depuis channel_pricing ou calculé avec marge 30%) */
  selling_price_ht: number;
  primary_image_url: string | null;
  supplier_reference: string | null;
}

export interface UpdateSelectionData {
  name?: string;
  description?: string | null;
  archived_at?: string | null;
  price_display_mode?: 'HT' | 'TTC' | null;
}

export interface AddProductData {
  product_id: string;
  margin_rate: number;
  base_price_ht: number;
}

/**
 * Données pour mise à jour d'un item de sélection
 */
export interface UpdateSelectionItemData {
  base_price_ht?: number;
  margin_rate?: number;
  is_featured?: boolean;
}

/**
 * Type simplifié pour liste des sélections
 */
export interface SelectionSummary {
  id: string;
  name: string;
  slug: string;
  archived_at: string | null;
  products_count: number | null;
  affiliate_id: string;
  affiliate_name: string;
}
