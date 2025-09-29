export type DimensionUnit = 'cm' | 'm' | 'mm' | 'in'

export interface VariantGroup {
  id: string
  name: string
  subcategory_id: string
  dimensions_length?: number
  dimensions_width?: number
  dimensions_height?: number
  dimensions_unit?: DimensionUnit
  product_count: number
  created_at: string
  updated_at: string

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
  image_url?: string
  price_ht?: number
  variant_position: number
  variant_attributes: {
    color?: string
    material?: string
  }
}

export interface CreateVariantGroupData {
  name: string
  subcategory_id: string
  dimensions_length?: number
  dimensions_width?: number
  dimensions_height?: number
  dimensions_unit?: DimensionUnit
  initial_product_id?: string
}

export interface AddProductToGroupData {
  product_id: string
  variant_attributes: {
    color?: string
    material?: string
  }
}

export interface UpdateVariantGroupData extends Partial<Omit<CreateVariantGroupData, 'initial_product_id'>> {
  id: string
}

export interface ProductWithVariantInfo {
  id: string
  name: string
  sku: string
  image_url?: string
  price_ht?: number
  variant_group_id?: string
  variant_position?: number
  variant_attributes?: {
    color?: string
    material?: string
  }
}