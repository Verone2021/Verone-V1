"use client"

import { useState, useMemo } from "react"
import { Search, Filter, Grid, List } from "lucide-react"
import { Button } from "../../components/ui/button"
import { ProductCard } from "../../components/business/product-card"
import { Badge } from "../../components/ui/badge"
import { cn } from "../../lib/utils"
import { checkSLOCompliance, debounce } from "../../lib/utils"

// Interface Produit selon business rules
interface Product {
  id: string
  sku: string
  name: string
  price_ht: number
  status: 'in_stock' | 'out_of_stock' | 'preorder' | 'coming_soon' | 'discontinued'
  condition: 'new' | 'refurbished' | 'used'
  primary_image_url: string
  brand?: string
  category?: string
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
    unit?: string
  }
}

// Interface filtres
interface Filters {
  search: string
  status: string[]
  category: string[]
  brand: string[]
}

// Mock data pour démonstration (sera remplacé par Supabase)
const mockProducts: Product[] = [
  {
    id: "1",
    sku: "VER-CAN-LUX-001",
    name: "Canapé Moderne Luxe 3 Places",
    price_ht: 149900, // 1499,00€ en centimes
    status: "in_stock",
    condition: "new",
    primary_image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&w=500",
    brand: "Vérone Luxury",
    category: "Canapés",
    weight: 45.5,
    dimensions: { length: 220, width: 90, height: 85, unit: "cm" }
  },
  {
    id: "2",
    sku: "VER-TAB-DIN-002",
    name: "Table Salle à Manger Épurée",
    price_ht: 89900,
    status: "preorder",
    condition: "new",
    primary_image_url: "https://images.unsplash.com/photo-1549497538-303791108f95?ixlib=rb-4.0.3&w=500",
    brand: "Vérone Design",
    category: "Tables",
    weight: 32.0
  },
  {
    id: "3",
    sku: "VER-CHA-CON-003",
    name: "Chaise Confort Ergonomique",
    price_ht: 34900,
    status: "in_stock",
    condition: "new",
    primary_image_url: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?ixlib=rb-4.0.3&w=500",
    brand: "Vérone Office",
    category: "Chaises"
  },
  {
    id: "4",
    sku: "VER-LUM-SUS-004",
    name: "Luminaire Suspension Minimal",
    price_ht: 24900,
    status: "coming_soon",
    condition: "new",
    primary_image_url: "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?ixlib=rb-4.0.3&w=500",
    brand: "Vérone Light",
    category: "Éclairage"
  },
  {
    id: "5",
    sku: "VER-DEC-VAR-005",
    name: "Vase Décoratif Géométrique",
    price_ht: 8900,
    status: "out_of_stock",
    condition: "new",
    primary_image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&w=500",
    brand: "Vérone Déco",
    category: "Décoration"
  },
  {
    id: "6",
    sku: "VER-BIB-MOD-006",
    name: "Bibliothèque Modulaire",
    price_ht: 129900,
    status: "in_stock",
    condition: "refurbished",
    primary_image_url: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?ixlib=rb-4.0.3&w=500",
    brand: "Vérone Storage",
    category: "Rangement"
  }
]

export default function CataloguePage() {
  const startTime = Date.now()

  // État local
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: [],
    category: [],
    brand: []
  })

  // Fonction de recherche debouncée
  const debouncedSearch = useMemo(
    () => debounce((searchTerm: string) => {
      setFilters(prev => ({ ...prev, search: searchTerm }))
    }, 300),
    []
  )

  // Filtrage des produits
  const filteredProducts = useMemo(() => {
    let results = mockProducts

    // Filtre par recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      results = results.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower)
      )
    }

    // Filtre par statut
    if (filters.status.length > 0) {
      results = results.filter(product =>
        filters.status.includes(product.status)
      )
    }

    // Validation SLO pour la recherche
    const searchSLO = checkSLOCompliance(startTime, 'search')

    return results
  }, [filters, startTime])

  // Extraction des valeurs uniques pour filtres
  const availableStatuses = Array.from(new Set(mockProducts.map(p => p.status)))
  const availableCategories = Array.from(new Set(mockProducts.map(p => p.category).filter(Boolean)))
  const availableBrands = Array.from(new Set(mockProducts.map(p => p.brand).filter(Boolean)))

  // Toggle filtre
  const toggleFilter = (type: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value]
    }))
  }

  // Validation SLO dashboard
  const dashboardSLO = checkSLOCompliance(startTime, 'dashboard')

  return (
    <div className="space-y-6">
      {/* En-tête avec indicateur performance */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-black">Catalogue Produits</h1>
          <p className="text-black opacity-70 mt-1">
            Gestion des produits et collections Vérone
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

        {/* Nouveau produit */}
        <Button variant="default">
          Nouveau Produit
        </Button>
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
            {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
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
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={(product) => {
                  console.log('Product clicked:', product.name)
                }}
              />
            ))}
          </div>
        ) : (
          // Vue liste (à implémenter)
          <div className="space-y-4">
            {filteredProducts.map(product => (
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
        {filteredProducts.length === 0 && (
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