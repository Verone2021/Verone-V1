/**
 * 🔗 Product Variants Section Component
 *
 * Displays and manages product variants within the product detail page
 * Supports bidirectional variant relationships (A↔B↔C)
 * Integrated with Google Merchant Center item_group_id
 */

"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package,
  Plus,
  X,
  ExternalLink,
  Edit,
  Settings,
  ChevronRight,
  Star,
  AlertCircle
} from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn, formatPrice } from '@/lib/utils'
import { VariantCreationModal } from './variant-creation-modal'

interface ProductVariant {
  variant_id: string
  variant_sku: string
  variant_name: string
  variant_price: number
  is_primary_variant: boolean
  group_name: string
  item_group_id: string
  variant_details?: {
    status: string
    description?: string
    variant_attributes?: Record<string, any>
    images?: Array<{
      id: string
      public_url: string
      is_primary: boolean
    }>
  }
}

interface VariantGroup {
  name: string
  item_group_id: string
  primary_variant_id?: string
}

interface ProductVariantsData {
  product: {
    id: string
    sku: string
    name: string
  }
  variants: ProductVariant[]
  group: VariantGroup | null
  total_variants: number
}

interface ProductVariantsSectionProps {
  productId: string
  productName: string
  productData?: {
    id: string
    name: string
    sku: string
    supplier_id?: string
    supplier?: {
      id: string
      name: string
    }
    dimensions_length?: number
    dimensions_width?: number
    dimensions_height?: number
    dimensions_unit?: string
    weight?: number
    weight_unit?: string
    base_cost?: number
    selling_price?: number
    description?: string
    technical_description?: string
    category_id?: string
    subcategory_id?: string
    variant_group_id?: string
  }
  onVariantsUpdate?: () => void
}

export function ProductVariantsSection({
  productId,
  productName,
  productData,
  onVariantsUpdate
}: ProductVariantsSectionProps) {
  const router = useRouter()
  const [variantsData, setVariantsData] = useState<ProductVariantsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showManageModal, setShowManageModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchVariants = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/products/${productId}/variants?includeImages=true&includeDetails=true`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch variants')
      }

      setVariantsData(result.data)
    } catch (err) {
      console.error('Error fetching variants:', err)
      setError(err instanceof Error ? err.message : 'Failed to load variants')
    } finally {
      setLoading(false)
    }
  }

  const handleNavigateToVariant = (variantId: string) => {
    router.push(`/catalogue/${variantId}`)
  }

  const handleManageVariants = () => {
    setShowCreateModal(true)
  }

  const handleVariantCreated = () => {
    fetchVariants()
    if (onVariantsUpdate) onVariantsUpdate()
  }

  const getVariantAttributeDisplay = (attributes: Record<string, any> | undefined) => {
    if (!attributes || Object.keys(attributes).length === 0) return null

    return Object.entries(attributes)
      .filter(([key, value]) => value && value !== '')
      .slice(0, 3) // Show max 3 attributes
      .map(([key, value]) => (
        <span
          key={key}
          className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
        >
          {key}: {value}
        </span>
      ))
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800'
      case 'out_of_stock':
        return 'bg-red-100 text-red-800'
      case 'preorder':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  useEffect(() => {
    fetchVariants()
  }, [productId])

  if (loading) {
    return (
      <div className="bg-white border border-black p-4">
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
          <span className="ml-2 text-sm text-gray-600">Chargement des variantes...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white border border-black p-4">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    )
  }

  // No variants case
  if (!variantsData?.variants || variantsData.variants.length === 0) {
    return (
      <div className="bg-white border border-black p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-sm flex items-center">
            <Package className="h-4 w-4 mr-2" />
            Variantes Produit
          </h3>
          <ButtonV2
            variant="outline"
            size="sm"
            onClick={handleManageVariants}
          >
            <Plus className="h-3 w-3 mr-1" />
            Créer
          </ButtonV2>
        </div>
        <div className="text-center py-4">
          <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">Aucune variante configurée</p>
          <p className="text-xs text-gray-500">
            Les variantes permettent de regrouper des produits similaires (couleurs, tailles, etc.)
          </p>
        </div>
      </div>
    )
  }

  const { variants, group, total_variants } = variantsData

  return (
    <div className="bg-white border border-black p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm flex items-center">
          <Package className="h-4 w-4 mr-2" />
          Variantes Produit
          <Badge variant="outline" className="ml-2 text-xs">
            {total_variants}
          </Badge>
        </h3>
        <div className="flex items-center space-x-2">
          <ButtonV2
            variant="ghost"
            size="sm"
            onClick={handleManageVariants}
          >
            <Settings className="h-3 w-3 mr-1" />
            Gérer
          </ButtonV2>
        </div>
      </div>

      {/* Group Information */}
      {group && (
        <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm text-gray-900">{group.name}</h4>
              <p className="text-xs text-gray-600 font-mono">
                Group ID: {group.item_group_id}
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              Google Merchant
            </Badge>
          </div>
        </div>
      )}

      {/* Variants List */}
      <div className="space-y-3">
        {variants.map((variant, index) => (
          <div
            key={variant.variant_id}
            className="border border-gray-200 rounded p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-sm text-gray-900 truncate">
                    {variant.variant_name}
                  </h4>
                  {variant.is_primary_variant && (
                    <Star className="h-3 w-3 text-gray-700 fill-current" />
                  )}
                </div>

                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs text-gray-600 font-mono">
                    {variant.variant_sku}
                  </span>
                  <span className="text-xs font-medium">
                    {formatPrice(variant.variant_price)}
                  </span>
                  {variant.variant_details?.status && (
                    <Badge
                      className={cn(
                        "text-xs",
                        getStatusBadgeColor(variant.variant_details.status)
                      )}
                    >
                      {variant.variant_details.status}
                    </Badge>
                  )}
                </div>

                {/* Variant Attributes */}
                {variant.variant_details?.variant_attributes && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {getVariantAttributeDisplay(variant.variant_details.variant_attributes)}
                  </div>
                )}

                {/* Primary Image */}
                {variant.variant_details?.images?.length && variant.variant_details.images.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-8 h-8 bg-gray-200 rounded overflow-hidden">
                      <img
                        src={variant.variant_details?.images?.find(img => img.is_primary)?.public_url || variant.variant_details?.images?.[0]?.public_url}
                        alt={variant.variant_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {variant.variant_details?.images?.length ?? 0} image(s)
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-1 ml-3">
                <ButtonV2
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavigateToVariant(variant.variant_id)}
                  className="h-8 w-8 p-0"
                >
                  <ExternalLink className="h-3 w-3" />
                </ButtonV2>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Variant Quick Action */}
      <Separator className="my-4" />
      <ButtonV2
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={handleManageVariants}
      >
        <Plus className="h-3 w-3 mr-2" />
        Ajouter une variante à ce groupe
      </ButtonV2>

      {/* Variant Creation Modal */}
      {productData && (
        <VariantCreationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          productData={productData}
          onVariantCreated={handleVariantCreated}
        />
      )}
    </div>
  )
}