'use client'

import React, { useState } from 'react'
import { History, Download, RefreshCw, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { MovementsTable } from '@/components/business/movements-table'
import { MovementsFilters } from '@/components/business/movements-filters'
import { MovementsStatsCards } from '@/components/business/movements-stats'
import { ProductStockHistoryModal } from '@/components/business/product-stock-history-modal'
import { useMovementsHistory, MovementWithDetails } from '@/hooks/use-movements-history'
import { useCatalogue } from '@/hooks/use-catalogue'

export default function HistoriqueMouvementsPage() {
  const {
    loading,
    movements,
    stats,
    total,
    filters,
    applyFilters,
    resetFilters,
    exportMovements,
    hasFilters,
    pagination
  } = useMovementsHistory()

  const { products } = useCatalogue()
  const [selectedMovement, setSelectedMovement] = useState<MovementWithDetails | null>(null)
  const [showProductHistory, setShowProductHistory] = useState(false)

  // Pagination
  const handlePageChange = (newPage: number) => {
    const newOffset = (newPage - 1) * pagination.pageSize
    applyFilters({
      ...filters,
      offset: newOffset
    })
  }

  const handlePageSizeChange = (newSize: string) => {
    applyFilters({
      ...filters,
      limit: parseInt(newSize),
      offset: 0
    })
  }

  // Voir détails produit
  const handleMovementClick = (movement: MovementWithDetails) => {
    setSelectedMovement(movement)
    setShowProductHistory(true)
  }

  // Trouver le produit correspondant pour le modal
  const getProductForModal = () => {
    if (!selectedMovement) return null

    const product = products.find(p => p.id === selectedMovement.product_id)
    return product ? {
      id: product.id,
      name: product.name,
      sku: product.sku,
      primary_image_url: product.primary_image_url
    } : {
      id: selectedMovement.product_id,
      name: selectedMovement.product_name || 'Produit supprimé',
      sku: selectedMovement.product_sku || 'SKU inconnu'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <History className="h-8 w-8" />
            Historique des Mouvements
          </h1>
          <p className="text-gray-600 mt-2">
            Visualisez et analysez tous les mouvements de stock avec des filtres avancés
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>

          <Button
            variant="outline"
            onClick={() => exportMovements('csv')}
            disabled={loading || movements.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <MovementsStatsCards stats={stats} loading={loading} />

      {/* Layout principal avec filtres et table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar filtres */}
        <div className="lg:col-span-1">
          <MovementsFilters
            filters={filters}
            onFiltersChange={applyFilters}
            onReset={resetFilters}
            hasFilters={hasFilters}
          />
        </div>

        {/* Contenu principal */}
        <div className="lg:col-span-3 space-y-4">
          {/* En-tête table avec stats et pagination */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Mouvements
                    {hasFilters && (
                      <Badge variant="secondary">Filtré</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {loading ? (
                      'Chargement...'
                    ) : (
                      <>
                        {total === 0 ? (
                          'Aucun mouvement trouvé'
                        ) : (
                          <>
                            {((pagination.currentPage - 1) * pagination.pageSize) + 1}-
                            {Math.min(pagination.currentPage * pagination.pageSize, total)} sur {total} mouvements
                          </>
                        )}
                      </>
                    )}
                  </CardDescription>
                </div>

                {/* Pagination et taille de page */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Afficher:</span>
                    <Select
                      value={pagination.pageSize.toString()}
                      onValueChange={handlePageSizeChange}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {pagination.totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1 || loading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <span className="text-sm text-gray-600">
                        Page {pagination.currentPage} sur {pagination.totalPages}
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages || loading}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <MovementsTable
                movements={movements}
                loading={loading}
                onMovementClick={handleMovementClick}
              />
            </CardContent>
          </Card>

          {/* Message d'aide si aucun résultat */}
          {!loading && movements.length === 0 && hasFilters && (
            <Card className="p-8">
              <div className="text-center">
                <Eye className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun mouvement trouvé
                </h3>
                <p className="text-gray-500 mb-4">
                  Aucun mouvement ne correspond aux critères de recherche sélectionnés.
                </p>
                <Button variant="outline" onClick={resetFilters}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réinitialiser les filtres
                </Button>
              </div>
            </Card>
          )}

          {/* Message d'aide si base vide */}
          {!loading && movements.length === 0 && !hasFilters && (
            <Card className="p-8">
              <div className="text-center">
                <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun mouvement de stock
                </h3>
                <p className="text-gray-500">
                  Il n'y a encore aucun mouvement de stock enregistré dans le système.
                  Les mouvements apparaîtront ici dès qu'ils seront créés.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modal historique produit */}
      <ProductStockHistoryModal
        product={getProductForModal()}
        isOpen={showProductHistory}
        onClose={() => {
          setShowProductHistory(false)
          setSelectedMovement(null)
        }}
      />
    </div>
  )
}