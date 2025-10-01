// Types simplifiés pour le système de variantes minimaliste

// Types de variante supportés (Google Merchant Center 2024)
// Note: size retiré car les dimensions sont gérées au niveau du groupe
// Note: pattern retiré car considéré comme moins pertinent que couleur/matériau
export type VariantType = 'color' | 'material'

// Dimensions produit standardisées (JSONB)
export interface ProductDimensions {
  length?: number | null
  width?: number | null
  height?: number | null
  unit: 'cm' | 'm'
}

export interface VariantGroup {
  id: string
  name: string
  base_sku: string // SKU de base pour génération automatique des SKU produits
  subcategory_id: string
  variant_type?: VariantType // Type de variante du groupe
  product_count?: number
  created_at: string
  updated_at: string

  // Attributs communs hérités par les produits
  common_dimensions?: ProductDimensions | null

  // Attributs de catégorisation (alignés avec collections)
  style?: string | null // Style décoratif (minimaliste, contemporain, etc.)
  suitable_rooms?: string[] | null // Pièces compatibles (40 room types)

  // Système de fournisseur commun
  supplier_id?: string | null // ID du fournisseur commun (si has_common_supplier = true)
  has_common_supplier?: boolean // Si true, tous les produits héritent du supplier_id

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
  supplier?: {
    id: string
    name: string
  }
  products?: VariantProduct[]
}

export interface VariantProduct {
  id: string
  name: string
  sku: string
  cost_price?: string | number // Prix coûtant
  status?: string
  variant_group_id?: string
  variant_position?: number
  item_group_id?: string // Google Merchant Center identifier
  variant_attributes?: Record<string, any> // Attributs variantes JSONB (color, material, etc.)

  // Attributs physiques
  dimensions?: ProductDimensions | null
  weight?: number | null // Poids en kg

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
  base_sku: string // SKU de base pour génération automatique
  subcategory_id: string
  variant_type?: VariantType // Type de variante (color/material)

  // Attributs communs optionnels
  dimensions_length?: number
  dimensions_width?: number
  dimensions_height?: number
  dimensions_unit?: 'cm' | 'm' | 'mm' | 'in'

  // Catégorisation optionnelle
  style?: string // Style décoratif
  suitable_rooms?: string[] // Pièces compatibles

  // Fournisseur commun optionnel
  supplier_id?: string | null
  has_common_supplier?: boolean
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
  variant_type?: VariantType | 'all' // Filtre par type de variante
  is_active?: boolean // Filtre par statut (avec/sans produits)
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
  base_sku?: string // SKU de base pour génération automatique
  subcategory_id?: string
  style?: string
  suitable_rooms?: string[]
  supplier_id?: string | null
  has_common_supplier?: boolean
}

export interface ProductWithVariantInfo extends VariantProduct {}

// Champs modifiables d'un produit (pour EditProductInGroupModal)
export interface EditableProductFields {
  // Identité
  name: string
  sku: string
  
  // Prix
  cost_price: number
  
  // Attributs physiques
  dimensions?: ProductDimensions | null
  weight?: number | null
  
  // Variante
  variant_attributes?: Record<string, string>
  
  // Statut
  status: string
}
