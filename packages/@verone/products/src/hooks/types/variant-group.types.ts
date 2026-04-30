// ============================================================================
// TYPES LOCAUX (pour typage interne des requêtes Supabase)
// ============================================================================

/** Type du toast passé en dépendance aux sous-hooks */
export type ToastFn = (options: {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}) => void;

/** Produit tel que retourné par la requête Supabase dans fetchVariantGroups */
export interface FetchedProduct {
  id: string;
  name: string;
  sku: string;
  stock_status: string | null;
  product_status: string | null;
  variant_group_id: string | null;
  variant_position: number | null;
  cost_price: number | null;
  weight: number | null;
  variant_attributes: Record<string, unknown> | null;
}

/** Image de produit */
export interface ProductImageRef {
  product_id: string;
  public_url: string;
}

/** Données de mise à jour pour un variant group */
export interface VariantGroupUpdateData {
  name?: string;
  variant_type?: string;
  subcategory_id?: string;
  style?: string | null;
  suitable_rooms?: string[] | null;
  has_common_supplier?: boolean;
  supplier_id?: string | null;
  common_dimensions?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
    unit?: 'cm' | 'm' | 'mm' | 'in' | string;
  } | null;
  common_weight?: number | null;
  has_common_weight?: boolean;
  common_cost_price?: number | null;
  has_common_cost_price?: boolean;
  common_eco_tax?: number | null;
  common_material?: string | null;
  has_common_material?: boolean;
  common_color?: string | null;
  has_common_color?: boolean;
}
