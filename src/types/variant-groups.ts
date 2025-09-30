// Types simplifiés pour le système de variantes minimaliste

export interface VariantGroup {
  id: string
  name: string
  subcategory_id: string
  product_count?: number
  created_at: string
  updated_at: string

  // Relations
  subcategory?: {
    id: string
    name: string
    category_id: string
    category?: {
      id: string
      name: string
    }
  }
  products?: VariantProduct[]
}

export interface VariantProduct {
  id: string
  name: string
  sku: string
  price_ht?: number
  status?: string
  variant_group_id?: string
  variant_position?: number
  // Image principale pour affichage
  image_url?: string
}

// Pour afficher un produit avec ses variantes (siblings)
export interface ProductWithVariants {
  id: string
  name: string
  sku: string
  price_ht?: number
  variant_group_id?: string
  variant_group?: VariantGroup
  siblings?: VariantProduct[] // Les autres produits du même groupe
}

// Données pour créer un groupe de variantes
export interface CreateVariantGroupData {
  name: string
  subcategory_id: string
}

// Données pour ajouter des produits à un groupe
export interface AddProductsToGroupData {
  variant_group_id: string
  product_ids: string[]
}

// Données pour retirer un produit d'un groupe
export interface RemoveProductFromGroupData {
  product_id: string
}

// Filtres pour rechercher des groupes
export interface VariantGroupFilters {
  search?: string
  subcategory_id?: string
  has_products?: boolean
}

// Pour la compatibilité (deprecated - à retirer plus tard)
export interface AddProductToGroupData {
  product_id: string
  variant_group_id: string
}

export interface UpdateVariantGroupData {
  id: string
  name?: string
  subcategory_id?: string
}

export interface ProductWithVariantInfo extends VariantProduct {}