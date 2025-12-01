/**
 * Types pour le module LinkMe Catalogue
 * Architecture unifiée : channel_pricing avec channel_id = LinkMe
 */

/**
 * Détail complet d'un produit LinkMe pour la page [id]
 */
export interface LinkMeProductDetail {
  /** ID dans channel_pricing */
  id: string;
  /** ID du produit source */
  product_id: string;
  /** SKU produit */
  sku: string;
  /** Nom du produit */
  name: string;

  // === PRICING (CRITIQUE) ===
  /** Prix coûtant - READ-ONLY depuis products.cost_price */
  cost_price: number;
  /** Prix de vente HT - EDITABLE via channel_pricing.custom_price_ht */
  custom_price_ht: number | null;

  // === TOGGLES ===
  /** Actif pour affiliés */
  is_active: boolean;
  /** Visible sur vitrine publique (non-connectés) */
  is_public_showcase: boolean;
  /** Produit vedette mis en avant */
  is_featured: boolean;
  /** Afficher fournisseur dans "Nos partenaires" */
  show_supplier: boolean;

  // === MARGES ===
  /** Marge minimum autorisée (%) */
  min_margin_rate: number;
  /** Marge maximum autorisée (%) */
  max_margin_rate: number;
  /** Marge suggérée par défaut (%) */
  suggested_margin_rate: number | null;
  /** Commission Vérone sur ce produit (%) */
  channel_commission_rate: number | null;

  // === METADATA CUSTOM ===
  /** Titre personnalisé pour LinkMe */
  custom_title: string | null;
  /** Description personnalisée pour LinkMe */
  custom_description: string | null;
  /** Arguments de vente personnalisés */
  custom_selling_points: string[] | null;

  // === INFORMATIONS PRODUIT (READ-ONLY) ===
  /** URL image principale */
  primary_image_url: string | null;
  /** Stock réel */
  stock_real: number;
  /** Produit actif dans catalogue principal */
  product_is_active: boolean;
  /** Nom famille produit */
  product_family_name: string | null;
  /** Nom catégorie produit */
  product_category_name: string | null;
  /** Nom fournisseur */
  product_supplier_name: string | null;

  // === STATISTIQUES ===
  /** Nombre de vues */
  views_count: number;
  /** Nombre de sélections/ajouts panier */
  selections_count: number;
  /** Ordre d'affichage */
  display_order: number;
}

/**
 * Données pour mise à jour pricing
 */
export interface LinkMePricingUpdate {
  custom_price_ht?: number | null;
  min_margin_rate?: number;
  max_margin_rate?: number;
  suggested_margin_rate?: number | null;
  channel_commission_rate?: number | null;
}

/**
 * Données pour mise à jour metadata
 */
export interface LinkMeMetadataUpdate {
  custom_title?: string | null;
  custom_description?: string | null;
  custom_selling_points?: string[] | null;
}

/**
 * Calcul de marge
 * @param costPrice Prix coûtant
 * @param sellingPrice Prix de vente
 * @returns Marge en pourcentage ou null si calcul impossible
 */
export function calculateMargin(
  costPrice: number,
  sellingPrice: number | null
): number | null {
  if (!sellingPrice || costPrice <= 0) return null;
  return ((sellingPrice - costPrice) / costPrice) * 100;
}

/**
 * Vérifie si la marge est dans les limites autorisées
 */
export function isMarginValid(
  margin: number | null,
  minRate: number,
  maxRate: number
): boolean {
  if (margin === null) return false;
  return margin >= minRate && margin <= maxRate;
}
