"use client"

import { useState, useMemo } from "react"
import { Search, Filter, Grid, List } from "lucide-react"
import { Button } from "../../components/ui/button"
import { ProductCard } from "../../components/business/product-card"
import { Badge } from "../../components/ui/badge"
import { cn } from "../../lib/utils"
import { checkSLOCompliance, debounce } from "../../lib/utils"
import { useCatalogue, Product, Category } from "../../hooks/use-catalogue"

// Interface Produit selon business rules - utilise maintenant celle du hook useCatalogue

// Interface filtres
interface Filters {
  search: string
  status: string[]
  category: string[]
  brand: string[]
}

export default function CataloguePage() {
  const startTime = Date.now()

  // Hook Supabase pour les données réelles
  const {
    products,
    categories,
    loading,
    error,
    setFilters: setCatalogueFilters,
    resetFilters,
    stats
  } = useCatalogue()

  // État local
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: [],
    category: [],
    brand: []
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
  const availableBrands = Array.from(new Set(
    products
      .map(p => p.product_groups?.brand)
      .filter(Boolean)
  ))

  // Toggle filtre - synchronise avec useCatalogue
  const toggleFilter = (type: keyof Filters, value: string) => {
    const newFilters = {
      ...filters,
      [type]: filters[type].includes(value)
        ? filters[type].filter(item => item !== value)
        : [...filters[type], value]
    }
    setFilters(newFilters)

    // Synchronise avec le hook useCatalogue
    setCatalogueFilters({
      search: newFilters.search,
      statuses: newFilters.status,
      categories: newFilters.category
    })
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

        {/* Indicateur SLO performance */}
        <div className="flex items-center space-x-2">
          <Badge variant={dashboardSLO.isCompliant ? "success" : "destructive"}>
            {dashboardSLO.duration}ms
          </Badge>
          <span className="text-xs text-black opacity-50">
            SLO: &lt;2s
          </span>
        </div>
      </div>

      {/* Barre de recherche et actions */}
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
                product={product}
              />
            ))}
          </div>
        ) : (
          // Vue liste (à implémenter)
          <div className="space-y-4">
            {products.map(product => (
              <div key={product.id} className="card-verone p-4">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-gray-200 flex-shrink-0"></div>
                  <div className="flex-1">
                    <h3 className="font-medium text-black">{product.name}</h3>
                    <p className="text-sm text-black opacity-70">{product.sku}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-black">
                      {(product.price_ht / 100).toFixed(2)} € HT
                    </div>
                    <Badge className="mt-1">
                      {product.status}
                    </Badge>
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
  )
}