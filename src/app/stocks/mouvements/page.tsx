'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpDown, Download, RefreshCw, ChevronLeft, ChevronRight, Eye, ArrowLeft, Plus } from 'lucide-react'
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
import { MovementDetailsModal } from '@/components/business/movement-details-modal'
import { CancelMovementModal } from '@/components/business/cancel-movement-modal'
import { QuickStockMovementModal } from '@/components/business/quick-stock-movement-modal'
import { useMovementsHistory, MovementWithDetails } from '@/hooks/use-movements-history'

export default function StockMovementsPage() {
  const router = useRouter()
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

  const [selectedMovement, setSelectedMovement] = useState<MovementWithDetails | null>(null)
  const [showMovementDetails, setShowMovementDetails] = useState(false)
  const [movementToCancel, setMovementToCancel] = useState<MovementWithDetails | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showQuickMovementModal, setShowQuickMovementModal] = useState(false)

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

  // Voir détails mouvement
  const handleMovementClick = (movement: MovementWithDetails) => {
    setSelectedMovement(movement)
    setShowMovementDetails(true)
  }

  // Annuler mouvement
  const handleCancelClick = (movement: MovementWithDetails) => {
    setMovementToCancel(movement)
    setShowCancelModal(true)
  }

  // Succès annulation
  const handleCancelSuccess = () => {
    // Recharger les données
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/stocks')}
                className="flex items-center text-gray-600 hover:text-black"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux Stocks
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-black flex items-center gap-3">
                  <ArrowUpDown className="h-8 w-8" />
                  Mouvements de Stock
                </h1>
                <p className="text-gray-600 mt-1">
                  Visualisez et analysez tous les mouvements de stock avec des filtres avancés
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowQuickMovementModal(true)}
                className="bg-black text-white hover:bg-gray-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Mouvement
              </Button>

              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                disabled={loading}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>

              <Button
                variant="outline"
                onClick={() => exportMovements('csv')}
                disabled={loading || movements.length === 0}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
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
            <Card className="border-black">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-black">
                      Mouvements
                      {hasFilters && (
                        <Badge variant="outline" className="border-black text-black">Filtré</Badge>
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
                          className="border-black text-black hover:bg-black hover:text-white"
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
                          className="border-black text-black hover:bg-black hover:text-white"
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
                  onCancelClick={handleCancelClick}
                />
              </CardContent>
            </Card>

            {/* Message d'aide si aucun résultat */}
            {!loading && movements.length === 0 && hasFilters && (
              <Card className="p-8 border-black">
                <div className="text-center">
                  <Eye className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-black mb-2">
                    Aucun mouvement trouvé
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Aucun mouvement ne correspond aux critères de recherche sélectionnés.
                  </p>
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="border-black text-black hover:bg-black hover:text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réinitialiser les filtres
                  </Button>
                </div>
              </Card>
            )}

            {/* Message d'aide si base vide */}
            {!loading && movements.length === 0 && !hasFilters && (
              <Card className="p-8 border-black">
                <div className="text-center">
                  <ArrowUpDown className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-black mb-2">
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

        {/* Modal détails mouvement */}
        <MovementDetailsModal
          movement={selectedMovement}
          isOpen={showMovementDetails}
          onClose={() => {
            setShowMovementDetails(false)
            setSelectedMovement(null)
          }}
        />

        {/* Modal annulation mouvement */}
        <CancelMovementModal
          movement={movementToCancel}
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false)
            setMovementToCancel(null)
          }}
          onSuccess={handleCancelSuccess}
        />

        {/* Modal nouveau mouvement rapide */}
        <QuickStockMovementModal
          isOpen={showQuickMovementModal}
          onClose={() => setShowQuickMovementModal(false)}
          onSuccess={() => window.location.reload()}
        />
      </div>
    </div>
  )
}