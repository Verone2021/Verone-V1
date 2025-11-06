"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ButtonV2 } from "@/components/ui/button"
import { ProductVariantGridCard } from "./product-variant-grid-card"
import { useProductVariants } from '@/shared/modules/products/hooks'
import { Package2, Plus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductVariantsGridProps {
  productId: string
  currentProductId?: string
  className?: string
}

const ITEMS_PER_PAGE = 20

export function ProductVariantsGrid({
  productId,
  currentProductId,
  className,
}: ProductVariantsGridProps) {
  const router = useRouter()
  const { siblings, loading, error, product } = useProductVariants(productId)
  const [displayedCount, setDisplayedCount] = React.useState(ITEMS_PER_PAGE)

  // Variantes à afficher (avec pagination)
  const displayedVariants = siblings.slice(0, displayedCount)
  const hasMore = displayedCount < siblings.length
  const totalVariants = siblings.length

  const handleLoadMore = () => {
    setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, siblings.length))
  }

  const handleVariantClick = (variantId: string) => {
    router.push(`/produits/catalogue/${variantId}`)
  }

  const handleAddVariant = () => {
    // Navigate to variant group page or open modal
    if (product?.variant_group_id) {
      router.push(`/produits/catalogue/variantes/${product.variant_group_id}`)
    }
  }

  // État de chargement
  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <span className="ml-3 text-sm text-neutral-600">Chargement des variantes...</span>
      </div>
    )
  }

  // État d'erreur
  if (error) {
    return (
      <div className={cn("rounded-lg bg-red-50 border border-red-200 p-4", className)}>
        <p className="text-sm text-red-700">
          <strong>Erreur:</strong> {error}
        </p>
      </div>
    )
  }

  // Aucune variante
  if (totalVariants === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
          <Package2 className="h-8 w-8 text-neutral-400" />
        </div>
        <h4 className="text-sm font-medium text-neutral-900 mb-1">
          Aucune variante
        </h4>
        <p className="text-sm text-neutral-600 mb-4">
          Ce produit n'a pas d'autres variantes dans son groupe.
        </p>
        {product?.variant_group_id && (
          <ButtonV2
            size="sm"
            onClick={handleAddVariant}
            className="inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Créer une variante
          </ButtonV2>
        )}
      </div>
    )
  }

  // Une seule variante (info)
  const showSingleVariantHint = totalVariants === 1

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-neutral-900">
            {totalVariants} {totalVariants === 1 ? 'variante' : 'variantes'}
          </h4>
          {displayedCount < totalVariants && (
            <p className="text-xs text-neutral-500 mt-0.5">
              Affichage de {displayedCount} sur {totalVariants}
            </p>
          )}
        </div>
        {product?.variant_group_id && (
          <ButtonV2
            size="sm"
            variant="outline"
            onClick={handleAddVariant}
            className="inline-flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </ButtonV2>
        )}
      </div>

      {/* Info hint pour une seule variante */}
      {showSingleVariantHint && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
          <p className="text-sm text-blue-700">
            💡 Une seule variante dans ce groupe. Ajoutez-en pour profiter du système de variantes.
          </p>
        </div>
      )}

      {/* Grid responsive 2/3/4 colonnes */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {displayedVariants.map((variant) => (
          <ProductVariantGridCard
            key={variant.id}
            variant={{
              id: variant.id,
              name: variant.name,
              sku: variant.sku,
              selling_price: null, // Pas dans le hook actuel
              price_ht: (typeof variant.cost_price === 'number' ? variant.cost_price : null) as any, // Utiliser cost_price comme fallback
              status: variant.status,
              primary_image_url: variant.image_url || null,
              variant_attributes: null, // Pas dans le hook actuel
              is_primary: false, // TODO: ajouter is_primary au hook
            }}
            onClick={handleVariantClick}
            isCurrentProduct={variant.id === (currentProductId || productId)}
          />
        ))}
      </div>

      {/* Load More button */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <ButtonV2
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            className="min-w-[200px]"
          >
            Charger {Math.min(ITEMS_PER_PAGE, totalVariants - displayedCount)} variantes supplémentaires
          </ButtonV2>
        </div>
      )}

      {/* Performance warning si >200 variantes */}
      {totalVariants > 200 && (
        <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 mt-4">
          <p className="text-sm text-orange-700">
            ⚠️ <strong>{totalVariants} variantes.</strong> La pagination par défaut (20 par page) optimise les performances.
          </p>
        </div>
      )}
    </div>
  )
}
