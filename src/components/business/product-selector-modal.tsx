"use client"

import { useState, useEffect } from 'react'
import { Search, X, Plus, Check, Package, Filter } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '../../lib/utils'
import { createClient } from '@/lib/supabase/client'

interface Product {
  id: string
  name: string
  sku: string | null
  primary_image_url: string | null
  status: string
}

// Types de statuts selon la base de données
type ProductStatusFilter = 'all' | 'active' | 'incomplete' | 'archived'

interface ProductSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onProductsSelect: (productIds: string[]) => Promise<boolean>
  collectionName: string
  existingProductIds?: string[]
  loading?: boolean
}

export function ProductSelectorModal({
  isOpen,
  onClose,
  onProductsSelect,
  collectionName,
  existingProductIds = [],
  loading = false
}: ProductSelectorModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>('all')
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()

  // Mapping des statuts selon analyse DB
  const getStatusFilters = (filter: ProductStatusFilter): string[] => {
    switch (filter) {
      case 'active':
        return ['in_stock', 'preorder', 'coming_soon']
      case 'incomplete':
        return ['out_of_stock']
      case 'archived':
        return ['discontinued']
      case 'all':
      default:
        return ['in_stock', 'out_of_stock', 'preorder', 'coming_soon', 'discontinued']
    }
  }

  // Fetch products from database - Optimisé selon meilleures pratiques Supabase
  const fetchProducts = async () => {
    setLoadingProducts(true)
    try {
      const statusFilters = getStatusFilters(statusFilter)

      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          status,
          creation_mode,
          product_images!left (
            public_url,
            is_primary
          )
        `)
        .in('status', statusFilters as any)
        .eq('creation_mode', 'complete')
        .order('name', { ascending: true })

      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query.limit(50)

      if (error) {
        console.error('Error fetching products:', error)
        return
      }

      // Transform data to match Product interface
      const transformedProducts = (data || []).map((product: any) => {
        // Chercher l'image primaire selon le pattern BR-TECH-002
        const primaryImage = product.product_images?.find((img: any) => img.is_primary) || product.product_images?.[0]

        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          status: product.status,
          primary_image_url: primaryImage?.public_url || null
        }
      })

      // Filter out products already in the collection
      const availableProducts = transformedProducts.filter(
        product => !existingProductIds.includes(product.id)
      )

      setProducts(availableProducts)
    } catch (error) {
      console.error('Error in fetchProducts:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchProducts()
      setSelectedProductIds([])
    }
  }, [isOpen, searchQuery, statusFilter, existingProductIds])

  const handleProductToggle = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleSubmit = async () => {
    if (selectedProductIds.length === 0) return

    setSubmitting(true)
    try {
      const success = await onProductsSelect(selectedProductIds)
      if (success) {
        setSelectedProductIds([])
        onClose()
      }
    } catch (error) {
      console.error('Error adding products:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-700'
      case 'out_of_stock':
        return 'bg-red-100 text-red-700'
      case 'preorder':
        return 'bg-blue-100 text-blue-700'
      case 'coming_soon':
        return 'bg-purple-100 text-purple-700'
      case 'discontinued':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock': return 'En stock'
      case 'out_of_stock': return 'Rupture'
      case 'preorder': return 'Sur commande'
      case 'coming_soon': return 'Prochainement'
      case 'discontinued': return 'Arrêté'
      default: return status
    }
  }

  const ProductRow = ({ product }: { product: Product }) => {
    const isSelected = selectedProductIds.includes(product.id)

    return (
      <div
        className={cn(
          "flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50",
          isSelected
            ? "border-black bg-black/5"
            : "border-gray-200 hover:border-gray-300"
        )}
        onClick={() => handleProductToggle(product.id)}
      >
        {/* Checkbox */}
        <div className={cn(
          "w-5 h-5 rounded border-2 flex items-center justify-center mr-3 transition-all flex-shrink-0",
          isSelected
            ? "bg-black border-black text-white"
            : "border-gray-300 hover:border-gray-400"
        )}>
          {isSelected && <Check className="h-3 w-3" />}
        </div>

        {/* Product image (petite) */}
        <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex items-center justify-center mr-3 flex-shrink-0">
          {product.primary_image_url ? (
            <img
              src={product.primary_image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                if (target.nextElementSibling) {
                  (target.nextElementSibling as HTMLElement).style.display = 'flex'
                }
              }}
            />
          ) : null}
          <div
            className="w-full h-full bg-gray-200 flex items-center justify-center"
            style={{ display: product.primary_image_url ? 'none' : 'flex' }}
          >
            <Package className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Product name */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-gray-900 truncate">
            {product.name}
          </h3>
          {product.sku && (
            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
          )}
        </div>

        {/* Action button */}
        <ButtonV2
          size="sm"
          variant={isSelected ? "secondary" : "outline"}
          className={cn(
            "ml-3 flex-shrink-0",
            isSelected
              ? "bg-black text-white hover:bg-gray-800"
              : "border-gray-300 hover:border-black"
          )}
          onClick={(e) => {
            e.stopPropagation()
            handleProductToggle(product.id)
          }}
        >
          {isSelected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </ButtonV2>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">
            Ajouter des produits à "{collectionName}"
          </DialogTitle>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="flex-shrink-0 space-y-4 mb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher des produits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Statut :</span>
            <div className="flex space-x-2">
              {[
                { key: 'active', label: 'Actifs', count: products.filter(p => ['in_stock', 'preorder', 'coming_soon'].includes(p.status)).length },
                { key: 'incomplete', label: 'Incomplets', count: products.filter(p => p.status === 'out_of_stock').length },
                { key: 'archived', label: 'Archivés', count: products.filter(p => p.status === 'discontinued').length },
                { key: 'all', label: 'Tous', count: products.length }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setStatusFilter(filter.key as ProductStatusFilter)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    statusFilter === filter.key
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                  {!loadingProducts && (
                    <span className="ml-1 opacity-60">({filter.count})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selection counter */}
        {selectedProductIds.length > 0 && (
          <div className="flex-shrink-0 flex items-center justify-between p-3 bg-black/5 rounded-lg mb-4">
            <span className="text-sm font-medium text-gray-700">
              {selectedProductIds.length} produit{selectedProductIds.length !== 1 ? 's' : ''} sélectionné{selectedProductIds.length !== 1 ? 's' : ''}
            </span>
            <ButtonV2
              variant="ghost"
              size="sm"
              onClick={() => setSelectedProductIds([])}
              className="text-gray-600 hover:text-black"
            >
              <X className="h-4 w-4 mr-1" />
              Désélectionner tout
            </ButtonV2>
          </div>
        )}

        {/* Products list */}
        <div className="flex-1 overflow-y-auto">
          {loadingProducts ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center p-3 border rounded-lg animate-pulse">
                  <div className="w-5 h-5 bg-gray-300 rounded mr-3"></div>
                  <div className="w-12 h-12 bg-gray-300 rounded mr-3"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-8 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="space-y-2">
              {products.map(product => (
                <ProductRow key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'Aucun produit trouvé' : 'Aucun produit disponible'}
              </h3>
              <p className="text-gray-600">
                {searchQuery
                  ? 'Essayez de modifier votre recherche'
                  : 'Tous les produits sont déjà dans cette collection'
                }
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex-shrink-0 flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <ButtonV2
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Annuler
          </ButtonV2>
          <ButtonV2
            type="button"
            onClick={handleSubmit}
            disabled={selectedProductIds.length === 0 || submitting || loading}
            className="bg-black text-white hover:bg-gray-800"
          >
            {submitting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Ajout en cours...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter {selectedProductIds.length > 0 ? `(${selectedProductIds.length})` : ''}
              </>
            )}
          </ButtonV2>
        </div>
      </DialogContent>
    </Dialog>
  )
}