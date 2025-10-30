"use client"

import { useState, useEffect } from 'react'
import { Search, Package } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

/**
 * Interface Product pour le sélecteur d'échantillons
 * Supporte à la fois les produits Catalogue (validés) et Sourcing (non validés)
 */
export interface Product {
  id: string
  name: string
  sku: string | null
  status: string
  creation_mode: 'complete' | 'sourcing'
  supplier_id: string | null
  cost_price: number | null
  product_images: { public_url: string; is_primary: boolean }[]
  organisations: { legal_name: string } | null
}

interface SampleProductSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onProductSelect: (product: Product) => void
  allowSourcing?: boolean  // default: true
  allowCatalog?: boolean   // default: true
}

/**
 * Modal de sélection de produits pour les échantillons clients
 *
 * Features :
 * - Tabs Catalogue (complete) vs Sourcing (sourcing)
 * - Recherche avec debounce 300ms
 * - Affichage images produits + fournisseur
 * - Sélection unique (click → callback + close)
 * - Grid responsive 2 colonnes
 */
export function SampleProductSelectorModal({
  isOpen,
  onClose,
  onProductSelect,
  allowSourcing = true,
  allowCatalog = true
}: SampleProductSelectorModalProps) {
  // Déterminer le tab par défaut selon les permissions
  const getDefaultTab = (): 'complete' | 'sourcing' => {
    if (allowCatalog) return 'complete'
    if (allowSourcing) return 'sourcing'
    return 'complete'
  }

  const [activeTab, setActiveTab] = useState<'complete' | 'sourcing'>(getDefaultTab())
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  // Fetch products avec debounce 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        fetchProducts()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, activeTab, isOpen])

  // Reset search quand on change de tab
  useEffect(() => {
    setSearchQuery('')
  }, [activeTab])

  // Reset tout quand modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setActiveTab(getDefaultTab())
    }
  }, [isOpen])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          status,
          creation_mode,
          supplier_id,
          cost_price,
          product_images!inner (
            public_url,
            is_primary
          ),
          organisations!products_supplier_id_fkey (
            legal_name
          )
        `)
        .eq('creation_mode', activeTab)
        .order('name', { ascending: true })

      // Filtre recherche
      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query.limit(50)

      if (error) {
        console.error('Error fetching products:', error)
        setProducts([])
        return
      }

      // Transformer les données
      const transformedProducts: Product[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        status: item.status,
        creation_mode: item.creation_mode,
        supplier_id: item.supplier_id,
        cost_price: item.cost_price,
        product_images: item.product_images || [],
        organisations: item.organisations || null
      }))

      setProducts(transformedProducts)
    } catch (error) {
      console.error('Exception in fetchProducts:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleProductClick = (product: Product) => {
    onProductSelect(product)
    onClose()
  }

  // Récupérer l'image primaire ou la première disponible
  const getProductImage = (product: Product): string | null => {
    const primaryImage = product.product_images.find(img => img.is_primary)
    if (primaryImage) return primaryImage.public_url

    if (product.product_images.length > 0) {
      return product.product_images[0].public_url
    }

    return null
  }

  // Composant ProductCard
  const ProductCard = ({ product }: { product: Product }) => {
    const imageUrl = getProductImage(product)

    return (
      <div
        onClick={() => handleProductClick(product)}
        className={cn(
          "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all duration-200",
          "hover:bg-gray-50 hover:border-gray-400 border-gray-200"
        )}
      >
        {/* Image produit */}
        <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const fallback = target.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }}
            />
          ) : null}
          <div
            className="w-full h-full bg-gray-200 flex items-center justify-center"
            style={{ display: imageUrl ? 'none' : 'flex' }}
          >
            <Package className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Infos produit */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-gray-900 truncate">
            {product.name}
          </h3>
          {product.sku && (
            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
          )}
          {product.organisations && (
            <p className="text-xs text-gray-500 truncate">
              Fournisseur: {product.organisations.legal_name}
            </p>
          )}
        </div>

        {/* Badge création mode */}
        <div className="flex-shrink-0">
          <Badge
            variant="secondary"
            className={cn(
              "text-xs",
              product.creation_mode === 'complete'
                ? "bg-green-100 text-green-700 hover:bg-green-100"
                : "bg-blue-100 text-blue-700 hover:bg-blue-100"
            )}
          >
            {product.creation_mode === 'complete' ? 'Catalogue' : 'Sourcing'}
          </Badge>
        </div>
      </div>
    )
  }

  // Skeleton loading
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg animate-pulse">
          <div className="w-12 h-12 bg-gray-300 rounded flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
          <div className="w-16 h-6 bg-gray-300 rounded flex-shrink-0"></div>
        </div>
      ))}
    </div>
  )

  // État vide
  const EmptyState = () => (
    <div className="text-center py-12">
      <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Aucun produit trouvé
      </h3>
      <p className="text-gray-600">
        {searchQuery
          ? 'Essayez de modifier votre recherche'
          : 'Aucun produit disponible dans cette catégorie'
        }
      </p>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-semibold">
            Sélectionner un produit
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'complete' | 'sourcing')}
          className="flex-1 flex flex-col px-6 pb-6 overflow-hidden"
        >
          {/* Tabs List */}
          <TabsList className="grid w-full grid-cols-2 mb-4 flex-shrink-0">
            {allowCatalog && (
              <TabsTrigger value="complete" className="data-[state=active]:bg-green-100">
                Catalogue
              </TabsTrigger>
            )}
            {allowSourcing && (
              <TabsTrigger value="sourcing" className="data-[state=active]:bg-blue-100">
                Sourcing
              </TabsTrigger>
            )}
          </TabsList>

          {/* Search Input */}
          <div className="relative mb-4 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher par nom ou SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          {/* Tabs Content */}
          <TabsContent value="complete" className="flex-1 overflow-y-auto mt-0 min-h-0">
            {loading ? (
              <LoadingSkeleton />
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </TabsContent>

          <TabsContent value="sourcing" className="flex-1 overflow-y-auto mt-0 min-h-0">
            {loading ? (
              <LoadingSkeleton />
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
