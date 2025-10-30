// Types simplifiés pour le système de variantes minimaliste

import type { LucideIcon } from 'lucide-react'

// Types de variante supportés (Google Merchant Center 2024)
// Note: size retiré car les dimensions sont gérées au niveau du groupe
// Note: pattern retiré car considéré comme moins pertinent que couleur/matériau
export type VariantType = 'color' | 'material'

// Styles décoratifs disponibles
export type DecorativeStyle =
  | 'minimaliste'
  | 'contemporain'
  | 'moderne'
  | 'scandinave'
  | 'industriel'
  | 'classique'
  | 'boheme'
  | 'art_deco'

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

  // Dimensions communes (colonnes séparées alignées avec SQL schema)
  dimensions_length?: number | null
  dimensions_width?: number | null
  dimensions_height?: number | null
  dimensions_unit?: 'cm' | 'm' | 'mm' | 'in'

  // Dimensions et poids communs (JSONB et numeric)
  common_dimensions?: { length?: number; width?: number; height?: number; unit?: string } | null
  common_weight?: number | null

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

  // Poids commun optionnel
  common_weight?: number | null

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
  id?: string
  name?: string
  base_sku?: string // SKU de base pour génération automatique
  variant_type?: VariantType
  subcategory_id?: string

  // Dimensions communes (colonnes séparées)
  dimensions_length?: number | null
  dimensions_width?: number | null
  dimensions_height?: number | null
  dimensions_unit?: 'cm' | 'm' | 'mm' | 'in'

  // Poids commun
  common_weight?: number | null

  // Catégorisation
  style?: string
  suitable_rooms?: string[]

  // Fournisseur commun
  supplier_id?: string | null
  has_common_supplier?: boolean

  // Deprecated - gardé pour compatibilité
  common_dimensions?: {
    length?: number | null
    width?: number | null
    height?: number | null
    unit?: 'cm' | 'm' | 'mm' | 'in'
  } | null
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

// =====================================================================
// CONSTANTES - Styles décoratifs avec icônes Lucide React
// =====================================================================

import {
  Minimize,
  Building2,
  Rocket,
  TreePine,
  Factory,
  Crown,
  Sparkles,
  Gem
} from 'lucide-react'

export const DECORATIVE_STYLES: Array<{
  value: DecorativeStyle
  label: string
  description: string
  icon: LucideIcon
}> = [
  {
    value: 'minimaliste',
    label: 'Minimaliste',
    description: 'Épuré et fonctionnel',
    icon: Minimize
  },
  {
    value: 'contemporain',
    label: 'Contemporain',
    description: 'Moderne et actuel',
    icon: Building2
  },
  {
    value: 'moderne',
    label: 'Moderne',
    description: 'Design avant-gardiste',
    icon: Rocket
  },
  {
    value: 'scandinave',
    label: 'Scandinave',
    description: 'Chaleureux et naturel',
    icon: TreePine
  },
  {
    value: 'industriel',
    label: 'Industriel',
    description: 'Brut et authentique',
    icon: Factory
  },
  {
    value: 'classique',
    label: 'Classique',
    description: 'Intemporel et raffiné',
    icon: Crown
  },
  {
    value: 'boheme',
    label: 'Bohème',
    description: 'Libre et coloré',
    icon: Sparkles
  },
  {
    value: 'art_deco',
    label: 'Art Déco',
    description: 'Luxueux et géométrique',
    icon: Gem
  }
] as const
