"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Search, Filter, Grid, List, Plus, FileText, Package, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/business/product-card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { checkSLOCompliance, debounce } from "@/lib/utils"
import { useCatalogue, Product, Category } from "@/hooks/use-catalogue"
import { useFamilies } from "@/hooks/use-families"
import { useCategories } from "@/hooks/use-categories"
import { useSubcategories } from "@/hooks/use-subcategories"
import { CategoryHierarchyFilterV2 } from "@/components/business/category-hierarchy-filter-v2"
import { ChannelSelector } from "@/components/business/channel-selector"
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

  // ✅ FIX 3.1: Fonction de recherche debouncée - CORRIGÉE (retirer filters des deps)
  const debouncedSearch = useMemo(
    () => debounce((searchTerm: string) => {
      setCatalogueFilters({
        search: searchTerm
      })
    }, 300),
    [setCatalogueFilters]  // ✅ Seulement setCatalogueFilters
  )

  // ✅ FIX 3.2: Fonction pour charger produits archivés - MÉMORISÉE avec useCallback
  const loadArchivedProductsData = useCallback(async () => {
    setArchivedLoading(true)
    try {
      const result = await loadArchivedProducts(filters)
      setArchivedProducts(result.products)
    } catch (error) {
      console.error('Erreur chargement produits archivés:', error)
    } finally {
      setArchivedLoading(false)
    }
  }, [filters, loadArchivedProducts])

  // Charger les produits archivés quand on change d'onglet
  useEffect(() => {
    if (activeTab === 'archived') {
      loadArchivedProductsData()
    }
  }, [activeTab, loadArchivedProductsData])  // ✅ loadArchivedProductsData dans deps

  // Le filtrage est maintenant géré par le hook useCatalogue

  // ✅ FIX 3.1: Extraction des valeurs uniques - MÉMORISÉES
  const availableStatuses = useMemo(
    () => Array.from(new Set(products.map(p => p.status))),
    [products]
  )
  
  const availableSuppliers = useMemo(
    () => Array.from(new Set(
      products
        .map(p => p.supplier?.name)
        .filter(Boolean)
    )),
    [products]
  )

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
      subcategories: newFilters.subcategories  // ✅ FIX: subcategories au lieu de categories
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

  // Réinitialiser tous les filtres
  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: [],
      subcategories: [],
      supplier: []
    })
    resetFilters()
  }

  // Archiver un produit
  const handleArchiveProduct = async (productId: string) => {
    try {
      await archiveProduct(productId)
    } catch (error) {
      console.error('Erreur archivage produit:', error)
    }
  }

  // Supprimer un produit
  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId)
    } catch (error) {
      console.error('Erreur suppression produit:', error)
    }
  }

  // Sélectionner les produits à afficher
  const currentProducts = activeTab === 'active' ? products : archivedProducts

  // Vérification SLO dashboard <2s
  const dashboardSLO = 2000 // 2 secondes selon SLOs
  useEffect(() => {
    const loadTime = Date.now() - startTime
    if (!loading && loadTime > dashboardSLO) {
      console.warn(`⚠️ SLO Dashboard dépassé: ${loadTime}ms > ${dashboardSLO}ms`)
    } else if (!loading) {
      console.log(`✅ SLO Dashboard OK: ${loadTime}ms < ${dashboardSLO}ms`)
    }
  }, [loading])

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <h2 className="text-lg font-semibold text-red-900 mb-2">
            Erreur de chargement
          </h2>
          <p className="text-sm text-red-600">
            Erreur: {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Catalogue Produits</h1>
            <p className="text-sm text-slate-600">
              {stats?.totalProducts || 0} produits • {stats?.inStock || 0} en stock
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push('/produits/catalogue/produits/new')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau produit
            </Button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-6">
        <div className="grid grid-cols-[280px,1fr] gap-6">
          {/* Sidebar filtres */}
          <div className="space-y-4">
            {/* Recherche */}
            <div>
              <label className="text-xs font-semibold text-slate-900 mb-2 block">
                Rechercher
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Nom ou SKU..."
                  value={filters.search}
                  onChange={(e) => {
                    const searchValue = e.target.value
                    setFilters(prev => ({ ...prev, search: searchValue }))
                    debouncedSearch(searchValue)  // ✅ Appel debounced
                  }}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Canal de vente */}
            <div>
              <label className="text-xs font-semibold text-slate-900 mb-2 block">
                Canal de vente
              </label>
              <ChannelSelector
                selectedChannelId={selectedChannelId}
                onChannelChange={setSelectedChannelId}
              />
            </div>

            {/* Hiérarchie catégories */}
            <CategoryHierarchyFilterV2
              families={families}
              categories={allCategories}
              subcategories={subcategories}
              selectedSubcategories={filters.subcategories}
              onSubcategoryToggle={handleSubcategoryToggle}
            />

            {/* Statut */}
            <div>
              <label className="text-xs font-semibold text-slate-900 mb-2 block">
                Statut
              </label>
              <div className="space-y-1">
                {availableStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => toggleFilter('status', status)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      filters.status.includes(status)
                        ? "bg-blue-50 text-blue-900 font-medium"
                        : "hover:bg-slate-100 text-slate-700"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Bouton reset */}
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="w-full"
            >
              Réinitialiser filtres
            </Button>
          </div>

          {/* Zone principale */}
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                {/* Onglets */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('active')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      activeTab === 'active'
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}
                  >
                    Actifs ({products.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('archived')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      activeTab === 'archived'
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}
                  >
                    Archivés ({archivedProducts.length})
                  </button>
                </div>

                {/* Mode d'affichage */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      viewMode === 'grid'
                        ? "bg-blue-100 text-blue-600"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      viewMode === 'list'
                        ? "bg-blue-100 text-blue-600"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Grille produits */}
            {loading || archivedLoading ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <Package className="h-12 w-12 text-slate-400 mx-auto mb-4 animate-pulse" />
                <p className="text-sm text-slate-600">Chargement des produits...</p>
              </div>
            ) : currentProducts.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-sm text-slate-600">Aucun produit trouvé</p>
              </div>
            ) : (
              <div className={cn(
                "grid gap-4",
                viewMode === 'grid' ? "grid-cols-3" : "grid-cols-1"
              )}>
                {currentProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product as any}
                    onArchive={activeTab === 'active' ? handleArchiveProduct : undefined}
                    onDelete={handleDeleteProduct}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
