"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Search, Filter, Grid, List, Plus, FileText, Package, Zap } from "lucide-react"
import { Button } from "../../components/ui/button"
import { ProductCard } from "../../components/business/product-card"
import { Badge } from "../../components/ui/badge"
import { cn } from "../../lib/utils"
import { checkSLOCompliance, debounce } from "../../lib/utils"
import { useCatalogue, Product, Category } from "../../hooks/use-catalogue"
import { useProductImages } from "../../hooks/use-product-images"

// Interface Produit selon business rules - utilise maintenant celle du hook useCatalogue

// Interface filtres - migration brand → supplier
interface Filters {
  search: string
  status: string[]
  category: string[]
  supplier: string[]
}

// Composant image pour la vue liste
function ProductImageThumb({ productId }: { productId: string }) {
  const { primaryImage, loading: imageLoading } = useProductImages({
    productId,
    autoFetch: true
  })

  return (
    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100">
      {primaryImage?.public_url && !imageLoading ? (
        <Image
          src={primaryImage.public_url}
          alt={primaryImage.alt_text || "Image produit"}
          width={64}
          height={64}
          className="object-contain w-full h-full"
          onError={() => {
            console.warn(`Erreur chargement image: ${primaryImage.public_url}`)
          }}
        />
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          {imageLoading ? (
            <div className="animate-pulse">
              <Package className="h-6 w-6 text-gray-300" />
            </div>
          ) : (
            <Package className="h-6 w-6 text-gray-400" />
          )}
        </div>
      )}
    </div>
  )
}

export default function CataloguePage() {
  const startTime = Date.now()
  const router = useRouter()

  // Hook Supabase pour les données réelles
  const {
    products,
    categories,
    loading,
    error,
    setFilters: setCatalogueFilters,
    resetFilters,
    archiveProduct,
    unarchiveProduct,
    deleteProduct,
    stats
  } = useCatalogue()

  // État local
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: [],
    category: [],
    supplier: []
  })

  // Fonction de recherche debouncée - synchronise avec useCatalogue
  const debouncedSearch = useMemo(
    () => debounce((searchTerm: string) => {
      const newFilters = { ...filters, search: searchTerm }
      setFilters(newFilters)
      // Synchronise avec le hook useCatalogue
      setCatalogueFilters({
        search: searchTerm,
        statuses: newFilters.status,
        categories: newFilters.category
      })
    }, 300),
    [filters, setCatalogueFilters]
  )

  // Le filtrage est maintenant géré par le hook useCatalogue

  // Extraction des valeurs uniques pour filtres depuis Supabase
  const availableStatuses = Array.from(new Set(products.map(p => p.status)))
  const availableCategories = categories.map(c => c.name)
  const availableSuppliers = Array.from(new Set(
    products
      .map(p => p.supplier?.name)
      .filter(Boolean)
  ))

  // Toggle filtre - synchronise avec useCatalogue
  const toggleFilter = (type: keyof Filters, value: string) => {
    const currentFilter = filters[type]
    const currentArray = Array.isArray(currentFilter) ? currentFilter : []

    const newFilters = {
      ...filters,
      [type]: currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value]
    }
    setFilters(newFilters)

    // Synchronise avec le hook useCatalogue
    setCatalogueFilters({
      search: newFilters.search,
      statuses: newFilters.status,
      categories: newFilters.category
    })
  }

  // Gestion des actions produits
  const handleArchiveProduct = async (product: Product) => {
    try {
      if (product.archived_at) {
        await unarchiveProduct(product.id)
        console.log('✅ Produit restauré:', product.name)
      } else {
        await archiveProduct(product.id)
        console.log('✅ Produit archivé:', product.name)
      }
    } catch (error) {
      console.error('❌ Erreur archivage produit:', error)
    }
  }

  const handleDeleteProduct = async (product: Product) => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement "${product.name}" ?\n\nCette action est irréversible !`
    )

    if (confirmed) {
      try {
        await deleteProduct(product.id)
        console.log('✅ Produit supprimé définitivement:', product.name)
      } catch (error) {
        console.error('❌ Erreur suppression produit:', error)
      }
    }
  }

  // Validation SLO dashboard
  const dashboardSLO = checkSLOCompliance(startTime, 'dashboard')

  // Gestion des états de chargement et erreur
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-black opacity-70">Chargement du catalogue...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Erreur: {error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec indicateur performance */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-black">Catalogue Produits</h1>
          <p className="text-black opacity-70 mt-1">
            Gestion des produits et collections Vérone ({products.length} produits)
          </p>
        </div>

        {/* Actions et indicateur SLO performance */}
        <div className="flex items-center space-x-4">
          {/* Boutons de création */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => router.push('/catalogue/sourcing')}
              variant="outline"
              className="flex items-center space-x-2 border-black text-black hover:bg-black hover:text-white"
            >
              <Zap className="h-4 w-4" />
              <span>Sourcing Rapide</span>
            </Button>

            <Button
              onClick={() => router.push('/catalogue/create')}
              className="flex items-center space-x-2 bg-black hover:bg-gray-800 text-white"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau Produit</span>
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant={dashboardSLO.isCompliant ? "success" : "destructive"}>
              {dashboardSLO.duration}ms
            </Badge>
            <span className="text-xs text-black opacity-50">
              SLO: &lt;2s
            </span>
          </div>
        </div>
      </div>

      {/* Contenu principal catalogue */}
      <div className="space-y-6">
          {/* Barre de recherche et actions pour produits */}
          <div className="flex items-center space-x-4">
            {/* Recherche */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black opacity-50" />
              <input
                type="search"
                placeholder="Rechercher par nom, SKU, marque..."
                className="w-full border border-black bg-white py-2 pl-10 pr-4 text-sm text-black placeholder:text-black placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>

            {/* Toggle vue */}
            <div className="flex border border-black">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="border-0 rounded-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="border-0 rounded-none border-l border-black"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filtres rapides */}
          <div className="space-y-4">
            {/* Filtres par statut */}
            <div>
              <h3 className="text-sm font-medium text-black mb-2">Statut</h3>
              <div className="flex flex-wrap gap-2">
                {availableStatuses.map(status => (
                  <Badge
                    key={status}
                    variant={filters.status.includes(status) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleFilter('status', status)}
                  >
                    {status === 'in_stock' && '✓ En stock'}
                    {status === 'out_of_stock' && '✕ Rupture'}
                    {status === 'preorder' && '📅 Précommande'}
                    {status === 'coming_soon' && '⏳ Bientôt'}
                    {status === 'discontinued' && '⚠ Arrêté'}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Filtres par catégorie */}
            <div>
              <h3 className="text-sm font-medium text-black mb-2">Catégories</h3>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map(category => (
                  <Badge
                    key={category}
                    variant={filters.category.includes(category) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleFilter('category', category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Résultats */}
          <div className="space-y-4">
            {/* Compteur résultats */}
            <div className="flex items-center justify-between text-sm text-black opacity-70">
              <span>
                {products.length} produit{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}
              </span>
              {filters.search && (
                <span>
                  Recherche: "{filters.search}"
                </span>
              )}
            </div>

            {/* Grille produits */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={{
                      ...product,
                      supplier: product.supplier ? {
                        ...product.supplier,
                        slug: product.supplier.name.toLowerCase().replace(/\s+/g, '-'),
                        is_active: true
                      } : undefined
                    } as any}
                    onArchive={handleArchiveProduct}
                    onDelete={handleDeleteProduct}
                    archived={!!product.archived_at}
                  />
                ))}
              </div>
            ) : (
              // Vue liste avec images
              <div className="space-y-4">
                {products.map(product => (
                  <div key={product.id} className="card-verone p-4">
                    <div className="flex items-center space-x-4">
                      <ProductImageThumb productId={product.id} />
                      <div className="flex-1">
                        <h3 className="font-medium text-black">{product.name}</h3>
                        <p className="text-sm text-black opacity-70">{product.sku}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-black">
                          {product.price_ht.toFixed(2)} € HT
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge>
                            {product.status}
                          </Badge>
                          {/* Badge "nouveau" pour les produits créés dans les 30 derniers jours */}
                          {(() => {
                            const createdAt = new Date(product.created_at)
                            const thirtyDaysAgo = new Date()
                            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                            return createdAt > thirtyDaysAgo
                          })() && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                              nouveau
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* État vide */}
            {products.length === 0 && (
              <div className="text-center py-12">
                <div className="text-black opacity-50 text-lg">
                  Aucun produit trouvé
                </div>
                <p className="text-black opacity-30 text-sm mt-2">
                  Essayez de modifier vos critères de recherche
                </p>
              </div>
            )}
          </div>
        </div>

    </div>
  )
}