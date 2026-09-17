/* eslint-disable @typescript-eslint/no-explicit-any */

// ============================================================================
// TYPES - UniversalProductSelectorV2
// ============================================================================

/**
 * Type de produit retourné par les queries Supabase
 */
export interface ProductData {
  id: string;
  name: string;
  description?: string | null;
  sku: string | null;
  product_status: 'active' | 'preorder' | 'discontinued' | 'draft';
  creation_mode: 'complete' | 'sourcing';
  sourcing_type?: string;
  /** Étape de sourcing — sert à écarter les sourcings clos (refusé, validé…) */
  sourcing_status?: string | null;
  supplier_id: string | null;
  subcategory_id?: string | null;
  stock_real?: number;
  cost_price?: number; // Prix d'achat pour commandes fournisseurs
  eco_tax_default?: number; // Éco-taxe par défaut du produit
  created_at?: string;
  updated_at?: string;
  archived_at?: string | null;
  product_images?: Array<{
    public_url: string;
    cloudflare_image_id?: string | null;
    is_primary: boolean;
  }>;
  supplier?: {
    id: string;
    legal_name: string;
    trade_name?: string;
    has_different_trade_name?: boolean;
  } | null;
  subcategory?: {
    id: string;
    name: string;
    slug: string;
    category?: {
      id: string;
      name: string;
      slug: string;
      family?: {
        id: string;
        name: string;
        slug: string;
      } | null;
    } | null;
  } | null;
  variant_attributes?: {
    color?: string;
    color_name?: string;
    material?: string;
    size?: string;
    pattern?: string;
    [key: string]: any; // Autres attributs personnalisés
  } | null;
}

/**
 * Produit sélectionné avec métadonnées
 */
export interface SelectedProduct extends ProductData {
  quantity?: number;
  unit_price?: number;
  discount_percentage?: number;
  notes?: string;
}

/**
 * Mode de sélection
 */
export type SelectionMode = 'single' | 'multi';

/**
 * Contexte d'utilisation
 */
export type SelectionContext =
  | 'collections'
  | 'orders'
  | 'consultations'
  | 'variants'
  | 'samples';

/**
 * Props du composant UniversalProductSelectorV2
 */
export interface UniversalProductSelectorV2Props {
  open: boolean;
  onClose: () => void;
  onSelect: (products: SelectedProduct[]) => void | Promise<void>;
  mode?: SelectionMode;
  context?: SelectionContext;
  title?: string;
  description?: string;
  selectedProducts?: SelectedProduct[];
  excludeProductIds?: string[];
  showQuantity?: boolean;
  showPricing?: boolean;
  showImages?: boolean;
  searchDebounce?: number;
  className?: string;
  /** Filtrer les produits par fournisseur (pour commandes fournisseurs) */
  supplierId?: string | null;
  /** Recherche initiale pré-remplie a l'ouverture du selector (ex: nom du groupe variantes) */
  initialSearch?: string;
  /** Seulement les produits vendables (commandes client) — règle BO-CHANNELS-P7-001 */
  sellableOnly?: boolean;
  /**
   * Raccourci « créer un produit en sourcing » proposé dans le sélecteur.
   * Fourni par l'appelant, qui ferme le sélecteur et ouvre son propre
   * formulaire de sourcing (consultations — BO-CONSULT-SOURCING-001).
   */
  onCreateSourcingProduct?: () => void;
}

// Types pour filtres hiérarchiques (internes)
export interface Family {
  id: string;
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  family_id: string | null;
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
}

export interface ProductSearchFilters {
  familyId?: string | null;
  categoryId?: string | null;
  subcategoryId?: string | null;
  creationMode?: 'complete' | 'sourcing' | null;
  sourcingType?: string | null;
  supplierId?: string | null;
  /**
   * Si true, applique la règle « proposable en consultation » : produits
   * vendables OU encore en sourcing (hors sourcing clos). Miroir de
   * `isProductProposableInConsultation` et de `get_consultation_eligible_products`.
   */
  proposableInConsultation?: boolean;
  /** Si true, exclut les produits qui ont deja un variant_group_id (regle 1 produit = 1 variante max) */
  excludeProductsInVariantGroup?: boolean;
  /** Si true, seulement les produits vendables (non retirés, actifs ou en précommande, hors sourcing) */
  sellableOnly?: boolean;
}
