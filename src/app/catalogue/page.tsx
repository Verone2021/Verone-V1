"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Search, Filter, Grid, List, Plus, FileText, Package, Zap } from "lucide-react"
import { Button } from "../../components/ui/button"
import { ProductCard } from "../../components/business/product-card"
import { Badge } from "../../components/ui/badge"
import { cn } from "../../lib/utils"
import { checkSLOCompliance, debounce } from "../../lib/utils"
import { useCatalogue, Product, Category } from "../../hooks/use-catalogue"
import { useFamilies } from "../../hooks/use-families"
import { useCategories } from "../../hooks/use-categories"
import { useSubcategories } from "../../hooks/use-subcategories"
import { CategoryHierarchyFilterV2 } from "../../components/business/category-hierarchy-filter-v2"
import { ChannelSelector } from "../../components/business/channel-selector"
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
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null) // 💰 État canal sélectionné
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
        categories: newFilters.category
      })
    }, 300),
    [filters, setCatalogueFilters]
  )

  // Fonction pour charger les produits archivés
  const loadArchivedProductsData = async () => {
    setArchivedLoading(true)
    try {
      const result = await loadArchivedProducts(filters)
      setArchivedProducts(result.products)
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

  // Le filtrage est maintenant géré par le hook useCatalogue

  // Extraction des valeurs uniques pour filtres depuis Supabase
  const availableStatuses = Array.from(new Set(products.map(p => p.status)))
  const availableSuppliers = Array.from(new Set(
    products
      .map(p => p.supplier?.name)
      .filter(Boolean)
  ))

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
              onClick={() => router.push('/catalogue/sourcing/rapide')}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1.5 border-black text-black hover:bg-black hover:text-white h-8 text-xs"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Sourcing Rapide</span>
            </Button>

            <Button
              onClick={() => router.push('/catalogue/nouveau')}
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

            {/* 💰 Sélecteur Canal de Vente (Pricing V2) */}
            <ChannelSelector
              value={selectedChannelId}
              onValueChange={setSelectedChannelId}
              placeholder="Canal de vente"
              showAllOption={true}
            />

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

            {/* Filtres par arborescence Famille > Catégorie > Sous-catégorie */}
            <CategoryHierarchyFilterV2
              families={families}
              categories={allCategories}
              subcategories={subcategories}
              products={products}
              selectedSubcategories={filters.subcategories}
              onSubcategoryToggle={handleSubcategoryToggle}
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
                              slug: product.supplier.name.toLowerCase().replace(/\s+/g, '-'),
                              is_active: true
                            } : undefined
                          } as any}
                          priority={index === 0} // 🚀 Optimisation LCP pour première ProductCard
                          showPricing={true} // 💰 Activer affichage pricing V2
                          showQuantityBreaks={true} // 📦 Activer affichage paliers quantités
                          channelId={selectedChannelId} // 💰 Canal sélectionné
                          onArchive={handleArchiveProduct}
                          onDelete={handleDeleteProduct}
                          archived={!!product.archived_at}
                        />
                      ))}
                    </div>
                  ) : (
                    // Vue liste avec images - COMPACT
                    <div className="space-y-2">
                      {currentProducts.map(product => (
                        <div
                          key={product.id}
                          className="card-verone p-3 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => router.push(`/catalogue/${product.id}`)}
                        >
                          <div className="flex items-center space-x-3">
                            {/* Image produit - 🚀 Optimisée avec next/Image + BR-TECH-002 */}
                            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100">
                              {product.primary_image_url ? (
                                <Image
                                  src={product.primary_image_url}
                                  alt={product.name}
                                  fill
                                  sizes="48px"
                                  className="object-contain"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-400" />
                                </div>
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
                      ))}
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

    </div>
  )
}