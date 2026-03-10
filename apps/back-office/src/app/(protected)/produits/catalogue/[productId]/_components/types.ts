import type { Database } from '@verone/types';

// Type pour un produit avec ses relations (base sur types Supabase generes)
export type ProductRow = Database['public']['Tables']['products']['Row'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];

// Relations jointes via select
export interface ProductRelations {
  enseigne?: {
    id: string;
    name: string;
  } | null;
  assigned_client?: {
    id: string;
    legal_name: string;
    trade_name: string | null;
  } | null;
  affiliate_creator?: {
    id: string;
    display_name: string;
    enseigne?: { id: string; name: string } | null;
    organisation?: {
      id: string;
      legal_name: string;
      trade_name: string | null;
    } | null;
  } | null;
  supplier?: {
    id: string;
    legal_name: string;
    trade_name: string | null;
    email: string | null;
    phone: string | null;
    is_active: boolean;
    type: string | null;
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
      };
    };
  } | null;
  variant_group?: {
    id: string;
    name: string;
    dimensions_length: number | null;
    dimensions_width: number | null;
    dimensions_height: number | null;
    dimensions_unit: string | null;
    common_weight: number | null;
    has_common_weight: boolean | null;
    common_cost_price: number | null;
    has_common_cost_price: boolean | null;
    style: string | null;
    suitable_rooms: string[] | null;
    has_common_supplier: boolean | null;
    supplier_id: string | null;
  } | null;
}

// Type combine Product (Row + Relations)
export type Product = ProductRow & ProductRelations;

// Channel pricing type
export interface ChannelPricingRow {
  channel_id: string;
  channel_name: string;
  channel_code: string;
  public_price_ht: number | null;
  custom_price_ht: number | null;
  discount_rate: number | null;
  is_active: boolean;
}

// Sourcing type
export interface SourcingInfo {
  type: 'interne' | 'client' | 'affiliate';
  clientType?: 'enseigne' | 'organisation';
  clientName?: string;
  clientId?: string;
  affiliateName?: string;
  affiliateDisplayName?: string;
}

// Nombre total de champs pour le calcul de completude
const TOTAL_COMPLETION_FIELDS = 19;

/**
 * Calcule champs manquants par section (19 champs au total)
 * Couvre TOUTES les sections de la fiche produit
 */
export function calculateAllMissingFields(product: Product | null) {
  if (!product)
    return {
      infosGenerales: 0,
      descriptions: 0,
      categorisation: 0,
      fournisseur: 0,
      stock: 0,
      tarification: 0,
      caracteristiques: 0,
      identifiants: 0,
    };

  const attrs = product.variant_attributes as Record<string, unknown> | null;

  return {
    // Informations Generales (2 champs)
    infosGenerales: [
      !product.name || product.name.trim() === '',
      !product.cost_price || product.cost_price <= 0,
    ].filter(Boolean).length,

    // Descriptions (3 champs)
    descriptions: [
      !product.description || product.description.trim() === '',
      !product.technical_description ||
        product.technical_description.trim() === '',
      !product.selling_points ||
        (product.selling_points as string[]).length === 0,
    ].filter(Boolean).length,

    // Categorisation (1 champ)
    categorisation: !product.subcategory_id ? 1 : 0,

    // Fournisseur & References (2 champs)
    fournisseur: [
      !product.supplier_id,
      !product.weight || product.weight <= 0,
    ].filter(Boolean).length,

    // Stock (1 champ)
    stock: !product.condition || product.condition.trim() === '' ? 1 : 0,

    // Tarification (1 champ)
    tarification:
      product.margin_percentage == null || product.margin_percentage <= 0
        ? 1
        : 0,

    // Caracteristiques (6 champs - avec heritage variant_group)
    caracteristiques: [
      !attrs?.color,
      !attrs?.material,
      product.variant_group_id ? !product.variant_group?.style : !product.style,
      !attrs?.finish,
      product.variant_group_id
        ? !(
            product.variant_group?.dimensions_length ??
            product.variant_group?.dimensions_width ??
            product.variant_group?.dimensions_height
          )
        : !(
            product.dimensions &&
            Object.keys(product.dimensions as Record<string, unknown>).length >
              0
          ),
      product.variant_group_id
        ? !product.variant_group?.common_weight
        : !product.weight,
    ].filter(Boolean).length,

    // Identifiants (3 champs)
    identifiants: [
      !product.sku || product.sku.trim() === '',
      !product.brand || product.brand.trim() === '',
      !product.gtin || product.gtin.trim() === '',
    ].filter(Boolean).length,
  };
}

export type MissingFields = ReturnType<typeof calculateAllMissingFields>;

export function calculateCompletionPercentage(missing: MissingFields): number {
  const totalMissing = Object.values(missing).reduce((sum, n) => sum + n, 0);
  return Math.round(
    ((TOTAL_COMPLETION_FIELDS - totalMissing) / TOTAL_COMPLETION_FIELDS) * 100
  );
}
