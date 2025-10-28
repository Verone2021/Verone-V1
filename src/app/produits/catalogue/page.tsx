"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Search, Filter, Grid, List, Plus, FileText, Package, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductCardV2 as ProductCard } from "@/components/business/product-card-v2"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { checkSLOCompliance, debounce } from "@/lib/utils"
import { useCatalogue, Product, Category } from "@/hooks/use-catalogue"
import { useProductImages } from "@/hooks/use-product-images"
import { useFamilies } from "@/hooks/use-families"
import { useCategories } from "@/hooks/use-categories"
import { useSubcategories } from "@/hooks/use-subcategories"
import { CategoryHierarchyFilterV2 } from "@/components/business/category-hierarchy-filter-v2"
// Nouveaux composants UX/UI 2025
import { ModernActionButton } from "@/components/ui/modern-action-button"
import { CommandPaletteSearch, SearchItem } from "@/components/business/command-palette-search"
import { ViewModeToggle } from "@/components/ui/view-mode-toggle"
import { FilterCombobox, FilterOption } from "@/components/business/filter-combobox"
// Interface Produit selon business rules - utilise maintenant celle du hook useCatalogue

// Interface filtres - migration brand → supplier
interface Filters {
  search: string
  status: string[]
  subcategories: string[] // Changé de 'category' à 'subcategories'
  supplier: string[]
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
    loadArchivedProducts,
    archiveProduct,
    unarchiveProduct,
    deleteProduct,
    stats
  } = useCatalogue()

  // Hooks pour l'arborescence de catégories
  const { families } = useFamilies()
  const { allCategories } = useCategories()
  const { subcategories } = useSubcategories()

  // État local
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [archivedProducts, setArchivedProducts] = useState<Product[]>([])
  const [archivedLoading, setArchivedLoading] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: [],
    subcategories: [],
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
        subcategories: newFilters.category
      })
    }, 300),
    [filters, setCatalogueFilters]
  )

  // Fonction pour charger les produits archivés
  const loadArchivedProductsData = async () => {
    setArchivedLoading(true)
    try {
      const result = await loadArchivedProducts(filters)
      setArchivedProducts(result.products as any)
    } catch (error) {
      console.error('Erreur chargement produits archivés:', error)
    } finally {
      setArchivedLoading(false)
    }
  }

  // Charger les produits archivés quand on change d'onglet
  useEffect(() => {
    if (activeTab === 'archived') {
      loadArchivedProductsData()
    }
  }, [activeTab, filters])

  // Listener global ⌘K pour CommandPaletteSearch
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Préparer les items pour CommandPaletteSearch
  const searchItems: SearchItem[] = useMemo(() => {
    return products.map((product) => ({
      id: product.id,
      type: 'product' as const,
      title: product.name,
      subtitle: product.sku || undefined,
      url: `/produits/${product.id}`,
    }))
  }, [products])

  // Handler sélection item CommandPalette
  const handleSearchSelect = (item: SearchItem) => {
    router.push(item.url)
    setPaletteOpen(false)
  }

  // Le filtrage est maintenant géré par le hook useCatalogue

  // Extraction des valeurs uniques pour filtres depuis Supabase
  const availableStatuses = Array.from(new Set(products.map(p => p.status)))
  const availableSuppliers = Array.from(new Set(
    products
      .map(p => p.supplier?.trade_name || p.supplier?.legal_name)
      .filter(Boolean)
  ))

  // Options pour FilterCombobox (avec labels français)
  const statusOptions: FilterOption[] = availableStatuses.map((status) => {
    const count = products.filter((p) => p.status === status).length
    const labels: Record<string, string> = {
      'in_stock': '✓ En stock',
      'out_of_stock': '✕ Rupture',
      'preorder': '📅 Précommande',
      'coming_soon': '⏳ Bientôt',
      'discontinued': '⚠ Arrêté',
    }
    return {
      value: status,
      label: labels[status] || status,
      count,
    }
  })

  const subcategoryOptions: FilterOption[] = subcategories.map((subcategory) => {
    const count = products.filter((p) => p.subcategory_id === subcategory.id).length
    return {
      value: subcategory.id,
      label: subcategory.name,
      count,
    }
  })

  const supplierOptions: FilterOption[] = availableSuppliers.map((supplier) => {
    const count = products.filter((p) => (p.supplier?.trade_name || p.supplier?.legal_name) === supplier).length
    return {
      value: supplier,
      label: supplier,
      count,
    }
  })

  // Toggle filtre statut - synchronise avec useCatalogue
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
      subcategories: newFilters.subcategories
    })
  }

  // Toggle filtre sous-catégorie
  const handleSubcategoryToggle = (subcategoryId: string) => {
    const newSubcategories = filters.subcategories.includes(subcategoryId)
      ? filters.subcategories.filter(id => id !== subcategoryId)
      : [...filters.subcategories, subcategoryId]

    const newFilters = {
      ...filters,
      subcategories: newSubcategories
    }
    setFilters(newFilters)

    // Synchronise avec le hook useCatalogue
    setCatalogueFilters({
      search: newFilters.search,
      statuses: newFilters.status,
      subcategories: newSubcategories
    })
  }

  // Gestion des actions produits
  const handleArchiveProduct = async (product: Product) => {
    try {
      if (product.archived_at) {
        await unarchiveProduct(product.id)
        console.log('✅ Produit restauré:', product.name)
        // Rafraîchir la liste des archivés après restauration
        await loadArchivedProductsData()
      } else {
        await archiveProduct(product.id)
        console.log('✅ Produit archivé:', product.name)
        // Rafraîchir la liste des archivés après archivage
        await loadArchivedProductsData()
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
              onClick={() => router.push('/produits/sourcing/validation')}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1.5 border-black text-black hover:bg-black hover:text-white h-8 text-xs"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Sourcing Rapide</span>
            </Button>

            <Button
              onClick={() => router.push('/produits/catalogue/nouveau')}
              size="sm"
              className="flex items-center space-x-1.5 bg-black hover:bg-gray-800 text-white h-8 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
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

            {/* Toggle vue (nouveau ViewModeToggle) */}
            <ViewModeToggle
              value={viewMode}
              onChange={setViewMode}
              variant="outline"
            />
          </div>

          {/* Onglets produits actifs/archivés */}
          <div className="flex border-b border-black">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'active'
                  ? 'border-b-2 border-black text-black'
                  : 'text-black opacity-60 hover:opacity-80'
              }`}
            >
              Produits Actifs ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'archived'
                  ? 'border-b-2 border-black text-black'
                  : 'text-black opacity-60 hover:opacity-80'
              }`}
            >
              Produits Archivés ({archivedProducts.length})
            </button>
          </div>

          {/* Filtres rapides (nouveaux FilterCombobox) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtre par statut */}
            <FilterCombobox
              label="Statut"
              options={statusOptions}
              selectedValues={filters.status}
              onSelectionChange={(values) => {
                const newFilters = { ...filters, status: values }
                setFilters(newFilters)
                setCatalogueFilters({
                  search: newFilters.search,
                  statuses: values,
                  subcategories: newFilters.subcategories
                })
              }}
              placeholder="Rechercher un statut..."
            />

            {/* Filtre par sous-catégories */}
            <FilterCombobox
              label="Sous-catégories"
              options={subcategoryOptions}
              selectedValues={filters.subcategories}
              onSelectionChange={(values) => {
                const newFilters = { ...filters, subcategories: values }
                setFilters(newFilters)
                setCatalogueFilters({
                  search: newFilters.search,
                  statuses: newFilters.status,
                  subcategories: values
                })
              }}
              placeholder="Rechercher une sous-catégorie..."
            />

            {/* Filtre par fournisseurs */}
            <FilterCombobox
              label="Fournisseurs"
              options={supplierOptions}
              selectedValues={filters.supplier}
              onSelectionChange={(values) => {
                setFilters({ ...filters, supplier: values })
                // Note: useCatalogue ne filtre pas encore par supplier
              }}
              placeholder="Rechercher un fournisseur..."
            />
          </div>

          {/* Résultats */}
          <div className="space-y-4">
            {/* Gestion du chargement et erreurs */}
            {((activeTab === 'active' && loading) || (activeTab === 'archived' && archivedLoading)) ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-black opacity-70">Chargement...</div>
              </div>
            ) : (
              <>
                {/* Compteur résultats */}
                <div className="flex items-center justify-between text-sm text-black opacity-70">
                  <span>
                    {activeTab === 'active'
                      ? `${products.length} produit${products.length > 1 ? 's' : ''} actif${products.length > 1 ? 's' : ''}`
                      : `${archivedProducts.length} produit${archivedProducts.length > 1 ? 's' : ''} archivé${archivedProducts.length > 1 ? 's' : ''}`
                    }
                  </span>
                  {filters.search && (
                    <span>
                      Recherche: "{filters.search}"
                    </span>
                  )}
                </div>

                {/* Grille produits */}
                {(() => {
                  const currentProducts = activeTab === 'active' ? products : archivedProducts

                  return viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {currentProducts.map((product, index) => (
                        <ProductCard
                          key={product.id}
                          product={{
                            ...product,
                            supplier: product.supplier ? {
                              ...product.supplier,
                              slug: (product.supplier.trade_name || product.supplier.legal_name).toLowerCase().replace(/\s+/g, '-'),
                              is_active: true
                            } : undefined
                          } as any}
                          index={index}
                          onArchive={handleArchiveProduct}
                          onDelete={handleDeleteProduct}
                          archived={!!product.archived_at}
                        />
                      ))}
                    </div>
                  ) : (
                    // Vue liste avec images - COMPACT
                    <div className="space-y-2">
                      {currentProducts.map(product => {
                        // Hook pour charger l'image
                        const ProductListItem = () => {
                          const { primaryImage, loading: imageLoading } = useProductImages({
                            productId: product.id,
                            autoFetch: true
                          })

                          return (
                            <div
                              key={product.id}
                              className="card-verone p-3 cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => router.push(`/produits/catalogue/${product.id}`)}
                            >
                              <div className="flex items-center space-x-3">
                                {/* Image produit */}
                                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100 flex items-center justify-center">
                                  {primaryImage?.public_url && !imageLoading ? (
                                    <img
                                      src={primaryImage.public_url}
                                      alt={product.name}
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <Package className="h-5 w-5 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-sm text-black truncate hover:underline">{product.name}</h3>
                                  <p className="text-xs text-black opacity-70">{product.sku}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="font-semibold text-sm text-black">
                                    {product.cost_price ? `${product.cost_price.toFixed(2)} € HT` : 'Prix non défini'}
                                  </div>
                                  <div className="flex items-center gap-1 mt-0.5 justify-end">
                                    <Badge className="text-[10px] px-1.5 py-0">
                                      {product.status}
                                    </Badge>
                                    {/* Badge "nouveau" pour les produits créés dans les 30 derniers jours */}
                                    {(() => {
                                      const createdAt = new Date(product.created_at)
                                      const thirtyDaysAgo = new Date()
                                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                                      return createdAt > thirtyDaysAgo
                                    })() && (
                                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 text-[10px] px-1.5 py-0">
                                        nouveau
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        }

                        return <ProductListItem key={product.id} />
                      })}
                    </div>
                  )
                })()}

                {/* État vide */}
                {(() => {
                  const currentProducts = activeTab === 'active' ? products : archivedProducts
                  const isEmpty = currentProducts.length === 0

                  return isEmpty && (
                    <div className="text-center py-12">
                      <div className="text-black opacity-50 text-lg">
                        {activeTab === 'active'
                          ? 'Aucun produit actif trouvé'
                          : 'Aucun produit archivé trouvé'
                        }
                      </div>
                      <p className="text-black opacity-30 text-sm mt-2">
                        {activeTab === 'active'
                          ? 'Essayez de modifier vos critères de recherche'
                          : 'Les produits archivés apparaîtront ici'
                        }
                      </p>
                    </div>
                  )
                })()}
              </>
            )}
          </div>
        </div>

      {/* CommandPaletteSearch global ⌘K */}
      <CommandPaletteSearch
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onSelect={handleSearchSelect}
        items={searchItems}
      />
    </div>
  )
}