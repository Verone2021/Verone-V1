/**
 * Types pour le catalogue LinkMe
 * Extraits de use-linkme-catalog.ts
 */

import type { Database } from '@verone/types';

// Types Supabase pour ce hook
export type ChannelPricing =
  Database['public']['Tables']['channel_pricing']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];

// Type pour jointure channel_pricing + products
export type ChannelPricingWithProduct = ChannelPricing & {
  products: Pick<
    Product,
    | 'id'
    | 'sku'
    | 'name'
    | 'cost_price'
    | 'eco_tax_default'
    | 'margin_percentage'
    | 'stock_real'
    | 'product_status'
    | 'subcategory_id'
    | 'supplier_id'
    | 'enseigne_id'
    | 'assigned_client_id'
    | 'weight'
    | 'dimensions'
    | 'suitable_rooms'
    | 'description'
    | 'selling_points'
    | 'created_by_affiliate'
    | 'affiliate_commission_rate'
    | 'affiliate_payout_ht'
    | 'affiliate_approval_status'
  >;
};

/**
 * Interface produit catalogue LinkMe
 * Mappé depuis channel_pricing + products
 */
export interface LinkMeCatalogProduct {
  id: string;
  product_id: string;
  is_enabled: boolean; // Mapped from is_active
  is_public_showcase: boolean;
  show_supplier: boolean;
  max_margin_rate: number | null;
  min_margin_rate: number | null;
  suggested_margin_rate: number | null;
  custom_title: string | null;
  custom_description: string | null;
  custom_selling_points: string[] | null;
  linkme_commission_rate: number | null; // Mapped from channel_commission_rate (= channel_commission_rate)
  views_count: number;
  selections_count: number;
  display_order: number;
  is_featured: boolean;
  // Champs Pricing pour complétude (9 champs total)
  public_price_ht: number | null; // Tarif public HT
  channel_commission_rate: number | null; // Commission LinkMe (alias direct)
  buffer_rate: number | null; // Marge de sécurité (décimal, ex: 0.05 = 5%)
  // Champs produit joint
  product_name: string;
  product_reference: string;
  product_price_ht: number; // custom_price_ht ou cost_price fallback
  product_selling_price_ht: number | null; // Prix de vente HT (= custom_price_ht s'il existe)
  product_image_url: string | null;
  product_stock_real: number;
  product_is_active: boolean;
  /** Statut reel du produit (source de verite) */
  product_status: 'active' | 'preorder' | 'discontinued' | 'draft';
  // Hiérarchie de catégorisation
  subcategory_id: string | null;
  subcategory_name: string | null;
  category_id: string | null;
  category_name: string | null;
  family_id: string | null;
  family_name: string | null;
  /** Chemin complet: "Famille > Catégorie > Sous-catégorie" */
  category_full_path: string | null;
  product_supplier_name: string | null;
  // Produits sur mesure (sourcés)
  enseigne_id: string | null;
  enseigne_name: string | null;
  assigned_client_id: string | null;
  assigned_client_name: string | null;
  /** true si produit exclusif à une enseigne ou organisation */
  is_sourced: boolean;
  /** ID affilié créateur (produit créé par affilié) */
  created_by_affiliate: string | null;
  /** Commission Vérone sur produit affilié (%) */
  affiliate_commission_rate: number | null;
  /** Payout affilié par unité vendue (HT) */
  affiliate_payout_ht: number | null;
  /** Nombre de sélections avec base_price_ht != public_price_ht */
  selections_price_mismatch: number;
}

/**
 * Interface produit éligible (non encore dans le catalogue LinkMe)
 */
export interface EligibleProduct {
  id: string;
  name: string;
  reference: string;
  price_ht: number;
  primary_image_url: string | null;
  stock_real: number;
  is_active: boolean;
  family_name: string | null;
  category_name: string | null;
}

export type AddProductWithPricing = {
  productId: string;
  customPriceHt: number;
  commissionRate: number;
};

/**
 * Interface variante produit
 */
export interface ProductVariant {
  id: string;
  sku: string | null;
  name: string | null;
  variant_attributes: Record<string, string> | null;
  stock_real: number;
  cost_price: number | null;
  /** URL image principale de la variante */
  image_url: string | null;
}

/**
 * Interface produit sur mesure (sourcé pour une enseigne ou organisation)
 * Version simplifiée pour affichage dans l'onglet "Produits sur mesure"
 */
export interface SourcingProduct {
  id: string;
  catalog_id: string | null; // channel_pricing.id pour navigation vers page détail LinkMe
  name: string;
  reference: string;
  description: string | null;
  cost_price: number;
  margin_percentage: number;
  selling_price_ht: number; // Calculé: cost_price * (1 + margin_percentage/100)
  stock_real: number;
  image_url: string | null;
  created_at: string | null;
  // Attribution exclusive
  enseigne_id: string | null;
  enseigne_name: string | null;
  assigned_client_id: string | null;
  assigned_client_name: string | null;
  // Catégorisation
  subcategory_id: string | null;
  subcategory_name: string | null;
  category_name: string | null;
  family_name: string | null;
  // Fournisseur
  supplier_id: string | null;
  supplier_name: string | null;
}

/**
 * Interface: présence d'un produit dans une sélection avec comparaison prix
 */
export interface ProductSelectionPresence {
  item_id: string;
  selection_id: string;
  selection_name: string;
  base_price_ht: number;
  margin_rate: number | null;
  selling_price_ht: number | null;
}
