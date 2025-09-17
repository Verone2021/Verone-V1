"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, Grid, List, Plus, FileText, Package } from "lucide-react"
import { Button } from "../../components/ui/button"
import { ProductCard } from "../../components/business/product-card"
import { Badge } from "../../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { cn } from "../../lib/utils"
import { checkSLOCompliance, debounce } from "../../lib/utils"
import { useCatalogue, Product, Category } from "../../hooks/use-catalogue"
import { ProductCreationWizard } from "../../components/forms/product-creation-wizard"
import { DraftsList } from "../../components/business/drafts-list"

// Interface Produit selon business rules - utilise maintenant celle du hook useCatalogue

// Interface filtres - migration brand → supplier
interface Filters {
  search: string
  status: string[]
  category: string[]
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
  const [showCreateWizard, setShowCreateWizard] = useState(false)
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null)

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
          <Button
            onClick={() => setShowCreateWizard(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau produit</span>
          </Button>

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

      {/* Onglets Produits vs Brouillons */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produits finalisés
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Brouillons
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
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
                    product={product}
                    onArchive={handleArchiveProduct}
                    onDelete={handleDeleteProduct}
                    archived={!!product.archived_at}
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
        </TabsContent>

        <TabsContent value="drafts" className="space-y-6">
          <DraftsList
            onCreateNew={() => {
              setEditingDraftId(null)
              setShowCreateWizard(true)
            }}
            onEditDraft={(draftId) => {
              setEditingDraftId(draftId)
              setShowCreateWizard(true)
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Wizard de création de produit */}
      <ProductCreationWizard
        isOpen={showCreateWizard}
        draftId={editingDraftId || undefined}
        onClose={() => {
          setShowCreateWizard(false)
          setEditingDraftId(null)
        }}
        onSuccess={(productId) => {
          console.log('✅ Produit créé avec succès:', productId)
          setShowCreateWizard(false)
          setEditingDraftId(null)
          // Optionnel: rediriger vers le détail du produit
          router.push(`/catalogue/${productId}`)
        }}
        onDraftSaved={(draftId) => {
          console.log('💾 Brouillon sauvegardé:', draftId)
          if (!editingDraftId) {
            setEditingDraftId(draftId)
          }
        }}
      />
    </div>
  )
}