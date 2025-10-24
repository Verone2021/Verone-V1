'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowUpDown, Download, RefreshCw, ChevronLeft, ChevronRight, Eye, ArrowLeft, Plus, Filter, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ButtonV2 } from '@/components/ui/button'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MovementsTable } from '@/components/business/movements-table'
import { MovementsFilters } from '@/components/business/movements-filters'
import { MovementsStatsCards } from '@/components/business/movements-stats'
import { MovementDetailsModal } from '@/components/business/movement-details-modal'
import { CancelMovementModal } from '@/components/business/cancel-movement-modal'
import { QuickStockMovementModal } from '@/components/business/quick-stock-movement-modal'
import { UniversalOrderDetailsModal } from '@/components/business/universal-order-details-modal'
import { useMovementsHistory, MovementWithDetails } from '@/hooks/use-movements-history'

export default function StockMovementsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams?.get('tab') || 'all' // Support ?tab=in|out|all

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

  // États pour filtres sidebar collapsible
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  // Compter filtres actifs
  useEffect(() => {
    const count = Object.keys(filters).filter(key => {
      const value = filters[key as keyof typeof filters]
      return (
        value !== undefined &&
        value !== null &&
        key !== 'limit' &&
        key !== 'offset'
      )
    }).length
    setActiveFiltersCount(count)
  }, [filters])

  // Modal commandes universelle
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [selectedOrderType, setSelectedOrderType] = useState<'sales' | 'purchase' | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)

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
    window.location.reload()
  }

  // Clic sur commande liée
  const handleOrderClick = (orderId: string, orderType: 'sales' | 'purchase') => {
    setSelectedOrderId(orderId)
    setSelectedOrderType(orderType)
    setShowOrderModal(true)
  }

  // Composant réutilisable pour le contenu de chaque tab
  const MovementsContent = ({
    title,
    emptyMessage
  }: {
    title: string
    emptyMessage: string
  }) => (
    <>
      {/* Statistiques */}
      <MovementsStatsCards stats={stats} loading={loading} />

      {/* Layout principal avec filtres collapsible */}
      <div className="relative">
        {/* Bouton Toggle Filtres */}
        <div className="mb-4">
          <ButtonV2
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="border-black text-black hover:bg-black hover:text-white transition-all"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge className="ml-2 bg-blue-600 text-white">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown className={cn(
              "h-4 w-4 ml-2 transition-transform duration-300",
              filtersOpen && "rotate-180"
            )} />
          </ButtonV2>
        </div>

        {/* Layout avec sidebar collapsible */}
        <div className="flex gap-6">
          {/* Sidebar Filters (Collapsible) */}
          <div
            className={cn(
              "transition-all duration-300 ease-in-out overflow-hidden",
              filtersOpen ? "w-[280px]" : "w-0"
            )}
          >
            {filtersOpen && (
              <div className="w-[280px]">
                <MovementsFilters
                  filters={filters}
                  onFiltersChange={applyFilters}
                  onReset={resetFilters}
                  hasFilters={hasFilters}
                />
              </div>
            )}
          </div>

          {/* Contenu Principal (Tableau) */}
          <div className="flex-1 space-y-4">
          {/* En-tête table avec stats et pagination */}
          <Card className="border-black rounded-[10px] shadow-md">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-black">
                    {title}
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
                      <ButtonV2
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1 || loading}
                        className="border-black text-black hover:bg-black hover:text-white"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </ButtonV2>

                      <span className="text-sm text-gray-600">
                        Page {pagination.currentPage} sur {pagination.totalPages}
                      </span>

                      <ButtonV2
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages || loading}
                        className="border-black text-black hover:bg-black hover:text-white"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </ButtonV2>
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
                onOrderClick={handleOrderClick}
              />
            </CardContent>
          </Card>

          {/* Message d'aide si aucun résultat */}
          {!loading && movements.length === 0 && hasFilters && (
            <Card className="p-8 border-black rounded-[10px] shadow-md">
              <div className="text-center">
                <Eye className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-black mb-2">
                  Aucun mouvement trouvé
                </h3>
                <p className="text-gray-500 mb-4">
                  Aucun mouvement ne correspond aux critères de recherche sélectionnés.
                </p>
                <ButtonV2
                  variant="outline"
                  onClick={resetFilters}
                  className="border-black text-black hover:bg-black hover:text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réinitialiser les filtres
                </ButtonV2>
              </div>
            </Card>
          )}

          {/* Message d'aide si base vide */}
          {!loading && movements.length === 0 && !hasFilters && (
            <Card className="p-8 border-black rounded-[10px] shadow-md">
              <div className="text-center">
                <ArrowUpDown className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-black mb-2">
                  {emptyMessage}
                </h3>
                <p className="text-gray-500">
                  Les mouvements apparaîtront ici dès qu'ils seront créés.
                </p>
              </div>
            </Card>
          )}
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ButtonV2
                variant="ghost"
                onClick={() => router.push('/stocks')}
                className="flex items-center text-gray-600 hover:text-black"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux Stocks
              </ButtonV2>
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
              <ButtonV2
                onClick={() => setShowQuickMovementModal(true)}
                className="bg-black text-white hover:bg-gray-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Mouvement
              </ButtonV2>

              <ButtonV2
                variant="outline"
                onClick={() => window.location.reload()}
                disabled={loading}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </ButtonV2>

              <ButtonV2
                variant="outline"
                onClick={() => exportMovements('csv')}
                disabled={loading || movements.length === 0}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </ButtonV2>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* TABS NIVEAU 1 : Direction (Entrées / Sorties / Tous) */}
        <Tabs
          defaultValue={initialTab}
          onValueChange={(value) => {
            // Mise à jour de l'URL pour refléter le tab actif
            const url = new URL(window.location.href)
            url.searchParams.set('tab', value)
            window.history.pushState({}, '', url)
          }}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 mb-6">
            <TabsTrigger value="in" className="text-sm font-medium">
              Entrées
            </TabsTrigger>
            <TabsTrigger value="out" className="text-sm font-medium">
              Sorties
            </TabsTrigger>
            <TabsTrigger value="all" className="text-sm font-medium">
              Tous
            </TabsTrigger>
          </TabsList>

          {/* ===== TAB ENTRÉES ===== */}
          <TabsContent value="in" className="space-y-6">
            <Tabs
              defaultValue="real"
              onValueChange={(value) => {
                applyFilters({
                  ...filters,
                  movement_type: 'IN',
                  affects_forecast: value === 'forecast',
                  forecast_type: value === 'forecast' ? 'in' : undefined,
                  offset: 0
                })
              }}
            >
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
                <TabsTrigger value="real" className="text-sm font-medium">
                  Entrées Réelles
                </TabsTrigger>
                <TabsTrigger value="forecast" className="text-sm font-medium">
                  Entrées Prévisionnelles
                </TabsTrigger>
              </TabsList>

              <TabsContent value="real" className="space-y-6">
                <MovementsContent
                  title="Entrées Réelles"
                  emptyMessage="Aucune entrée de stock réelle"
                />
              </TabsContent>

              <TabsContent value="forecast" className="space-y-6">
                <MovementsContent
                  title="Entrées Prévisionnelles"
                  emptyMessage="Aucune entrée prévisionnelle (commandes fournisseurs)"
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* ===== TAB SORTIES ===== */}
          <TabsContent value="out" className="space-y-6">
            <Tabs
              defaultValue="real"
              onValueChange={(value) => {
                applyFilters({
                  ...filters,
                  movement_type: 'OUT',
                  affects_forecast: value === 'forecast',
                  forecast_type: value === 'forecast' ? 'out' : undefined,
                  offset: 0
                })
              }}
            >
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
                <TabsTrigger value="real" className="text-sm font-medium">
                  Sorties Réelles
                </TabsTrigger>
                <TabsTrigger value="forecast" className="text-sm font-medium">
                  Sorties Prévisionnelles
                </TabsTrigger>
              </TabsList>

              <TabsContent value="real" className="space-y-6">
                <MovementsContent
                  title="Sorties Réelles"
                  emptyMessage="Aucune sortie de stock réelle"
                />
              </TabsContent>

              <TabsContent value="forecast" className="space-y-6">
                <MovementsContent
                  title="Sorties Prévisionnelles"
                  emptyMessage="Aucune sortie prévisionnelle (commandes clients)"
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* ===== TAB TOUS ===== */}
          <TabsContent value="all" className="space-y-6">
            <Tabs
              defaultValue="real"
              onValueChange={(value) => {
                applyFilters({
                  ...filters,
                  movement_type: undefined,
                  affects_forecast: value === 'forecast',
                  forecast_type: undefined,
                  offset: 0
                })
              }}
            >
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
                <TabsTrigger value="real" className="text-sm font-medium">
                  Mouvements Réels
                </TabsTrigger>
                <TabsTrigger value="forecast" className="text-sm font-medium">
                  Mouvements Prévisionnels
                </TabsTrigger>
              </TabsList>

              <TabsContent value="real" className="space-y-6">
                <MovementsContent
                  title="Tous les Mouvements Réels"
                  emptyMessage="Aucun mouvement de stock réel"
                />
              </TabsContent>

              <TabsContent value="forecast" className="space-y-6">
                <MovementsContent
                  title="Tous les Mouvements Prévisionnels"
                  emptyMessage="Aucun mouvement prévisionnel"
                />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

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

        {/* Modal détails commande universelle */}
        <UniversalOrderDetailsModal
          orderId={selectedOrderId}
          orderType={selectedOrderType}
          open={showOrderModal}
          onClose={() => {
            setShowOrderModal(false)
            setSelectedOrderId(null)
            setSelectedOrderType(null)
          }}
        />
      </div>
    </div>
  )
}
