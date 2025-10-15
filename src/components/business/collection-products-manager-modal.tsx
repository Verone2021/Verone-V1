"use client"

import { useState } from 'react'
import { X, Plus, Trash2, Package, Eye } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '../../lib/utils'
import { useCollectionProducts } from '@/hooks/use-collection-products'
import { ProductSelectorModal } from './product-selector-modal'

interface CollectionProductsManagerModalProps {
  isOpen: boolean
  onClose: () => void
  collectionId: string
  collectionName: string
  onProductsChanged: () => void
  onAddProducts: (productIds: string[]) => Promise<boolean>
  onRemoveProduct: (productId: string) => Promise<boolean>
}

export function CollectionProductsManagerModal({
  isOpen,
  onClose,
  collectionId,
  collectionName,
  onProductsChanged,
  onAddProducts,
  onRemoveProduct
}: CollectionProductsManagerModalProps) {
  const { products, loading, refetch } = useCollectionProducts(collectionId)
  const [showProductSelector, setShowProductSelector] = useState(false)
  const [removingProductId, setRemovingProductId] = useState<string | null>(null)

  const handleRemoveProduct = async (productId: string) => {
    setRemovingProductId(productId)
    try {
      const success = await onRemoveProduct(productId)
      if (success) {
        await refetch()
        onProductsChanged()
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    } finally {
      setRemovingProductId(null)
    }
  }

  const handleAddProducts = async (productIds: string[]): Promise<boolean> => {
    try {
      const success = await onAddProducts(productIds)
      if (success) {
        // ✅ OPTIMISATION : Refetch seulement local pour UX fluide
        await refetch()
        onProductsChanged()
        setShowProductSelector(false)
      }
      return success
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error)
      return false
    }
  }

  const ProductCard = ({ product }: { product: any }) => {
    const isRemoving = removingProductId === product.product_id

    return (
      <div className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
        <div className="aspect-square relative bg-gray-50">
          {product.products.primary_image_url ? (
            <img
              src={product.products.primary_image_url}
              alt={product.products.name}
              className="w-full h-full object-cover transition-all duration-300"
              loading="lazy"
              onLoad={(e) => {
                const target = e.target as HTMLImageElement
                target.style.opacity = '1'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                if (target.nextElementSibling) {
                  (target.nextElementSibling as HTMLElement).style.display = 'flex'
                }
              }}
              style={{ opacity: '0' }}
            />
          ) : null}
          <div
            className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center transition-all duration-300"
            style={{ display: product.products.primary_image_url ? 'none' : 'flex' }}
          >
            <Package className="h-12 w-12 text-gray-400 animate-pulse" />
          </div>

          {/* Bouton suppression - toujours visible */}
          <button
            onClick={() => handleRemoveProduct(product.product_id)}
            disabled={isRemoving}
            className={cn(
              "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center",
              "bg-red-500 text-white shadow-lg transition-all duration-300 transform",
              "hover:bg-red-600 hover:scale-110 hover:shadow-xl hover:rotate-3",
              "group-hover:opacity-100 opacity-75",
              isRemoving && "bg-red-300 cursor-not-allowed scale-95"
            )}
            title="Supprimer de la collection"
          >
            {isRemoving ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="p-3">
          <h3 className="font-medium text-sm text-gray-900 truncate mb-1">
            {product.products.name}
          </h3>
          {product.products.sku && (
            <p className="text-xs text-gray-500 mb-2">SKU: {product.products.sku}</p>
          )}
          <div className="flex items-center justify-between">
            <Badge
              variant="secondary"
              className={cn(
                "text-xs",
                product.products.status === 'in_stock' && "bg-green-100 text-green-700",
                product.products.status === 'out_of_stock' && "bg-red-100 text-red-700",
                product.products.status === 'preorder' && "bg-blue-100 text-blue-700"
              )}
            >
              {product.products.status === 'in_stock' && 'En stock'}
              {product.products.status === 'out_of_stock' && 'Rupture'}
              {product.products.status === 'preorder' && 'Sur commande'}
              {product.products.status === 'coming_soon' && 'Prochainement'}
              {product.products.status === 'discontinued' && 'Arrêté'}
            </Badge>
            <span className="text-xs text-gray-400">
              Pos. {product.position}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-semibold">
              Gestion des produits - "{collectionName}"
            </DialogTitle>
          </DialogHeader>

          <div className="flex-shrink-0 flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-gray-500" />
              <span className="font-medium">
                {products.length} produit{products.length !== 1 ? 's' : ''}
              </span>
            </div>
            <Button
              onClick={() => setShowProductSelector(true)}
              className="bg-black text-white hover:bg-gray-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter des produits
            </ButtonV2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-gray-200 rounded-lg animate-pulse">
                    <div className="aspect-square bg-gray-300 rounded-t-lg"></div>
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={`${product.collection_id}-${product.product_id}`}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun produit dans cette collection
                </h3>
                <p className="text-gray-600 mb-4">
                  Commencez par ajouter des produits à votre collection
                </p>
                <Button
                  onClick={() => setShowProductSelector(true)}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter des produits
                </ButtonV2>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 flex items-center justify-end pt-4 border-t border-gray-200">
            <ButtonV2 variant="outline" onClick={onClose}>
              Fermer
            </ButtonV2>
          </div>
        </DialogContent>
      </Dialog>

      {showProductSelector && (
        <ProductSelectorModal
          isOpen={showProductSelector}
          onClose={() => setShowProductSelector(false)}
          onProductsSelect={handleAddProducts}
          collectionName={collectionName}
          existingProductIds={products.map(p => p.product_id)}
        />
      )}
    </>
  )
}