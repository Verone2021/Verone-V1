/**
 * Page: Liste Ajustements Stock
 * Route: /stocks/ajustements
 * Description: Page de listing des ajustements d'inventaire (augmentation/diminution/correction)
 */

'use client';

import React, { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useToggle } from '@verone/hooks';
import { UniversalOrderDetailsModal } from '@verone/orders';
import type { MovementWithDetails } from '@verone/stock';
import { MovementsFilters } from '@verone/stock';
import { CancelMovementModal } from '@verone/stock';
import { MovementDetailsModal } from '@verone/stock';
import { MovementsStatsCards } from '@verone/stock';
import { MovementsTable } from '@verone/stock';
import { useMovementsHistory } from '@verone/stock';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Badge } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  ArrowLeft,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  ChevronDown,
  Plus,
  ArrowUpDown,
} from 'lucide-react';

export default function StockAdjustmentsPage() {
  const router = useRouter();

  // ✅ Filtres initiaux : ADJUST uniquement (mouvements réels)
  const {
    loading,
    movements,
    stats,
    total,
    filters,
    applyFilters,
    resetFilters,
    exportMovements: _exportMovements,
    hasFilters,
    pagination,
  } = useMovementsHistory({
    initialFilters: {
      movementTypes: ['ADJUST'], // ✅ Filtre ADJUST dès l'initialisation
      affects_forecast: false, // ✅ Mouvements réels uniquement
    },
  });

  const [selectedMovement, setSelectedMovement] =
    useState<MovementWithDetails | null>(null);
  const [showMovementDetails, setShowMovementDetails] = useState(false);
  const [movementToCancel, setMovementToCancel] =
    useState<MovementWithDetails | null>(null);
  const [showCancelModal, _toggleShowCancelModal, setShowCancelModal] =
    useToggle(false);

  // États pour filtres sidebar collapsible
  const [filtersOpen, toggleFiltersOpen] = useToggle(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Compter filtres actifs
  useEffect(() => {
    const count = Object.keys(filters).filter(key => {
      const value = filters[key as keyof typeof filters];
      return (
        value !== undefined &&
        value !== null &&
        key !== 'limit' &&
        key !== 'offset'
      );
    }).length;
    setActiveFiltersCount(count);
  }, [filters]);

  // Modal commandes universelle
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderType, setSelectedOrderType] = useState<
    'sales' | 'purchase' | null
  >(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // ✅ Supprimé : useEffect pour filtrer sur ADJUST - maintenant via initialFilters

  // Pagination
  const handlePageChange = (newPage: number) => {
    const newOffset = (newPage - 1) * pagination.pageSize;
    applyFilters({
      ...filters,
      offset: newOffset,
    });
  };

  const handlePageSizeChange = (newSize: string) => {
    applyFilters({
      ...filters,
      limit: parseInt(newSize),
      offset: 0,
    });
  };

  // Voir détails mouvement
  const handleMovementClick = (movement: MovementWithDetails) => {
    setSelectedMovement(movement);
    setShowMovementDetails(true);
  };

  // Annuler mouvement
  const handleCancelClick = (movement: MovementWithDetails) => {
    setMovementToCancel(movement);
    setShowCancelModal(true);
  };

  // Succès annulation
  const handleCancelSuccess = () => {
    window.location.reload();
  };

  // Clic sur commande liée
  const handleOrderClick = (
    orderId: string,
    orderType: 'sales' | 'purchase'
  ) => {
    setSelectedOrderId(orderId);
    setSelectedOrderType(orderType);
    setShowOrderModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header compact avec badge info */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ButtonV2
                variant="outline"
                size="sm"
                onClick={() => router.push('/stocks')}
                className="flex items-center text-gray-600 hover:text-black h-8 px-2"
              >
                <ArrowLeft className="h-3 w-3 mr-1.5" />
                Retour
              </ButtonV2>
              <h1 className="text-xl font-semibold text-black">
                Audit des Ajustements de Stock
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Badge info compact */}
              <Badge
                variant="outline"
                className="text-xs text-purple-700 border-purple-600 px-2 py-1"
              >
                🔍 Audit & Traçabilité
              </Badge>

              <ButtonV2
                variant="outline"
                size="sm"
                onClick={() => router.push('/stocks/ajustements/create')}
                className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvel ajustement
              </ButtonV2>

              <ButtonV2
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                disabled={loading}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                />
                Actualiser
              </ButtonV2>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-4 space-y-6">
        {/* Statistiques KPI */}
        <MovementsStatsCards stats={stats} loading={loading} />

        {/* Ligne filtres compacte : Bouton Filtres */}
        <div className="flex items-center justify-between">
          {/* Bouton Filtres (gauche) */}
          <ButtonV2
            variant="outline"
            size="sm"
            onClick={toggleFiltersOpen}
            className="border-black text-black hover:bg-black hover:text-white transition-all"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge className="ml-2 bg-blue-600 text-white">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown
              className={cn(
                'h-4 w-4 ml-2 transition-transform duration-300',
                filtersOpen && 'rotate-180'
              )}
            />
          </ButtonV2>

          {/* Info filtrage automatique */}
          <div className="text-sm text-gray-500">
            Historique comptable : ajustements uniquement (ADJUST)
          </div>
        </div>

        {/* Layout principal avec filtres collapsible */}
        <div className="relative">
          {/* Layout avec sidebar collapsible */}
          <div className="flex gap-6">
            {/* Sidebar Filters (Collapsible) */}
            <div
              className={cn(
                'transition-all duration-300 ease-in-out overflow-hidden',
                filtersOpen ? 'w-[280px]' : 'w-0'
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
                        Historique des Ajustements
                        {hasFilters && (
                          <Badge
                            variant="outline"
                            className="border-black text-black"
                          >
                            Filtré
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {loading ? (
                          'Chargement...'
                        ) : (
                          <>
                            {total === 0 ? (
                              'Aucun ajustement trouvé'
                            ) : (
                              <>
                                {(pagination.currentPage - 1) *
                                  pagination.pageSize +
                                  1}
                                -
                                {Math.min(
                                  pagination.currentPage * pagination.pageSize,
                                  total
                                )}{' '}
                                sur {total} ajustements
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
                            onClick={() =>
                              handlePageChange(pagination.currentPage - 1)
                            }
                            disabled={pagination.currentPage === 1 || loading}
                            className="border-black text-black hover:bg-black hover:text-white"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </ButtonV2>

                          <span className="text-sm text-gray-600">
                            Page {pagination.currentPage} sur{' '}
                            {pagination.totalPages}
                          </span>

                          <ButtonV2
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handlePageChange(pagination.currentPage + 1)
                            }
                            disabled={
                              pagination.currentPage ===
                                pagination.totalPages || loading
                            }
                            className="border-black text-black hover:bg-black hover:text-white"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </ButtonV2>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Table des ajustements */}
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
                      Aucun ajustement trouvé
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Aucun ajustement ne correspond aux critères de recherche
                      sélectionnés.
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
                      Aucun ajustement
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Les ajustements d'inventaire apparaîtront ici dès qu'ils
                      seront créés.
                    </p>
                    <ButtonV2
                      variant="outline"
                      onClick={() => router.push('/stocks/ajustements/create')}
                      className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Créer un ajustement
                    </ButtonV2>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Modal détails mouvement */}
        <MovementDetailsModal
          movement={selectedMovement}
          isOpen={showMovementDetails}
          onClose={() => {
            setShowMovementDetails(false);
            setSelectedMovement(null);
          }}
        />

        {/* Modal annulation mouvement */}
        <CancelMovementModal
          movement={movementToCancel}
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setMovementToCancel(null);
          }}
          onSuccess={handleCancelSuccess}
        />

        {/* Modal détails commande universelle */}
        <UniversalOrderDetailsModal
          orderId={selectedOrderId}
          orderType={selectedOrderType}
          open={showOrderModal}
          onClose={() => {
            setShowOrderModal(false);
            setSelectedOrderId(null);
            setSelectedOrderType(null);
          }}
        />
      </div>
    </div>
  );
}
