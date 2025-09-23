'use client'

import React, { memo, Suspense, lazy, useState, useCallback, useMemo } from 'react'
import { Search, Filter, RefreshCw, Plus, Download, BarChart3 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { useCatalogueOptimized, CatalogueFilters } from '../../hooks/use-catalogue-optimized'
import { useUserActivityTracker } from '../../hooks/use-user-activity-tracker'
import { BugReporter } from '../business/bug-reporter'

// Lazy loading des composants lourds
const ProductGrid = lazy(() => import('./product-grid-optimized'))
const FiltersPanel = lazy(() => import('./filters-panel-optimized'))

// Composant KPI optimisé avec memo
const KPICard = memo(({ title, value, description, icon: Icon, trend }: {
  title: string
  value: number | string
  description: string
  icon: any
  trend?: { value: number; isPositive: boolean }
}) => (
  <Card className="border-black">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      <Icon className="h-4 w-4 text-black" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-black">{value}</div>
      <p className="text-xs text-gray-600 flex items-center gap-1">
        {description}
        {trend && (
          <Badge variant={trend.isPositive ? "default" : "destructive"} className="text-xs">
            {trend.isPositive ? '+' : ''}{trend.value}%
          </Badge>
        )}
      </p>
    </CardContent>
  </Card>
))

// Loading skeleton optimisé
const LoadingSkeleton = memo(() => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-black">
          <CardHeader className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </CardHeader>
          <CardContent className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1 animate-pulse">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
      <div className="lg:col-span-3 animate-pulse">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
))

// Error boundary fallback
const ErrorFallback = memo(({ error, resetError }: { error: Error; resetError: () => void }) => (
  <Card className="border-red-200 bg-red-50">
    <CardHeader>
      <CardTitle className="text-red-800">Erreur de chargement</CardTitle>
      <CardDescription className="text-red-600">
        Une erreur s'est produite lors du chargement du catalogue.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-red-600 mb-4">{error.message}</p>
      <Button variant="outline" onClick={resetError} className="border-red-200 text-red-600">
        <RefreshCw className="h-4 w-4 mr-2" />
        Réessayer
      </Button>
    </CardContent>
  </Card>
))

export default function CataloguePageOptimized() {
  const [filters, setFilters] = useState<CatalogueFilters>({
    limit: 50,
    offset: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Hooks optimisés
  const {
    products,
    categories,
    loading,
    error,
    stats,
    refetch,
    mutations
  } = useCatalogueOptimized(filters)

  const { trackEvent, trackSearch, trackFilterApplied, trackPerformanceMetric } = useUserActivityTracker()

  // Memoized search handler avec debouncing
  const handleSearch = useCallback(
    debounce((term: string) => {
      const startTime = performance.now()

      setFilters(prev => ({ ...prev, search: term, offset: 0 }))
      trackSearch(term, products.length)

      const endTime = performance.now()
      trackPerformanceMetric({
        action: 'search_performed',
        duration: endTime - startTime,
        success: true
      })
    }, 300),
    [products.length, trackSearch, trackPerformanceMetric]
  )

  // Optimized filter application
  const applyFilters = useCallback((newFilters: Partial<CatalogueFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 }))
    trackFilterApplied(newFilters)
    trackEvent({
      action: 'filters_applied',
      new_data: { filters: newFilters }
    })
  }, [trackFilterApplied, trackEvent])

  // Memoized KPI data pour éviter les recalculs
  const kpiData = useMemo(() => [
    {
      title: "Total Produits",
      value: stats.totalProducts,
      description: "Dans le catalogue",
      icon: BarChart3,
      trend: stats.totalProducts > 0 ? { value: 12, isPositive: true } : undefined
    },
    {
      title: "En Stock",
      value: stats.inStock,
      description: "Produits disponibles",
      icon: BarChart3,
      trend: { value: Math.round((stats.inStock / stats.totalProducts) * 100), isPositive: true }
    },
    {
      title: "Stock Faible",
      value: stats.lowStock,
      description: "Nécessitent réappro",
      icon: BarChart3,
      trend: stats.lowStock > 0 ? { value: -5, isPositive: false } : undefined
    },
    {
      title: "Marge Moyenne",
      value: `${Math.round(stats.averageMargin)}%`,
      description: "Taux de marge",
      icon: BarChart3,
      trend: { value: 2.3, isPositive: true }
    }
  ], [stats])

  // Effect pour le search avec cleanup
  React.useEffect(() => {
    if (searchTerm !== filters.search) {
      handleSearch(searchTerm)
    }
  }, [searchTerm, handleSearch])

  // Error handling
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorFallback
          error={new Error(error)}
          resetError={() => {
            refetch()
            trackEvent({ action: 'error_recovery_attempted' })
          }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header optimisé */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Catalogue Vérone</h1>
              <p className="text-gray-600 mt-1">
                Gestion intelligente de votre catalogue produits
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  refetch()
                  trackEvent({ action: 'catalogue_manual_refresh' })
                }}
                disabled={loading}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Button
                onClick={() => trackEvent({ action: 'new_product_clicked' })}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Produit
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* KPIs avec performance optimisée */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpiData.map((kpi, index) => (
                <KPICard key={index} {...kpi} />
              ))}
            </div>

            {/* Barre de recherche et filtres */}
            <Card className="border-black">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recherche et Filtres</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="border-black text-black hover:bg-black hover:text-white"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtres {showFilters ? '(Masquer)' : '(Afficher)'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Rechercher un produit..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border-black"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="border-black text-black hover:bg-black hover:text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </div>

                {/* Filtres avec lazy loading */}
                {showFilters && (
                  <Suspense fallback={<div className="h-32 animate-pulse bg-gray-100 rounded"></div>}>
                    <FiltersPanel
                      categories={categories}
                      onFiltersChange={applyFilters}
                      currentFilters={filters}
                    />
                  </Suspense>
                )}
              </CardContent>
            </Card>

            {/* Grille de produits avec lazy loading */}
            <Card className="border-black">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Produits ({stats.totalProducts})</span>
                  {mutations.creating && (
                    <Badge variant="outline" className="border-green-300 text-green-600">
                      Création en cours...
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Affichage de {products.length} produits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense
                  fallback={
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-64 animate-pulse bg-gray-100 rounded"></div>
                      ))}
                    </div>
                  }
                >
                  <ProductGrid
                    products={products}
                    onProductSelect={(productId) => {
                      trackEvent({
                        action: 'product_selected',
                        record_id: productId
                      })
                    }}
                  />
                </Suspense>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Bug Reporter intégré */}
      <BugReporter onSubmitSuccess={() => {
        trackEvent({ action: 'bug_report_submitted_from_catalogue' })
      }} />
    </div>
  )
}

// Utility function pour debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}