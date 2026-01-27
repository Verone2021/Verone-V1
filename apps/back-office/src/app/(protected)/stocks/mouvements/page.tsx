'use client';

import React, { useState, useEffect } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useToggle } from '@verone/hooks';
import { UniversalOrderDetailsModal } from '@verone/orders';
import type { MovementWithDetails } from '@verone/stock';
import { MovementsFilters } from '@verone/stock';
import { CancelMovementModal } from '@verone/stock';
import { MovementDetailsModal } from '@verone/stock';
import { MovementsStatsCards } from '@verone/stock';
import { MovementsTable } from '@verone/stock';
import { useMovementsHistory } from '@verone/stock';
import { GeneralStockMovementModal } from '@verone/stock';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Badge } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  ArrowLeft,
  ArrowUpDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  ChevronDown,
  LayoutGrid,
  Table,
  Plus,
} from 'lucide-react';

import { MovementsListView } from './components/MovementsListView';

export default function StockMovementsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDirection = (searchParams?.get('tab') || 'all') as
    | 'in'
    | 'out'
    | 'all';

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
  } = useMovementsHistory();

  // État direction (remplace Tabs)
  const [directionFilter, setDirectionFilter] = useState<'in' | 'out' | 'all'>(
    initialDirection
  );

  // Phase 3.4.5: État vue Table vs Cards
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

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

  // États pour modals de création de mouvement
  const [showGeneralModal, setShowGeneralModal] = useState(false);

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

  // Changement de direction (remplace onValueChange des Tabs)
  const handleDirectionChange = (direction: 'in' | 'out' | 'all') => {
    setDirectionFilter(direction);

    // Mise à jour URL
    const url = new URL(window.location.href);
    url.searchParams.set('tab', direction);
    window.history.pushState({}, '', url);

    // Application filtres
    applyFilters({
      ...filters,
      movementTypes:
        direction === 'in' ? ['IN'] : direction === 'out' ? ['OUT'] : undefined,
      affects_forecast: false,
      forecast_type: undefined,
      offset: 0,
    });
  };

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

  // Titre selon direction
  const getTitle = () => {
    switch (directionFilter) {
      case 'in':
        return 'Entrées de Stock Réelles';
      case 'out':
        return 'Sorties de Stock Réelles';
      default:
        return 'Tous les Mouvements de Stock Réels';
    }
  };

  const getEmptyMessage = () => {
    switch (directionFilter) {
      case 'in':
        return 'Aucune entrée de stock réelle';
      case 'out':
        return 'Aucune sortie de stock réelle';
      default:
        return 'Aucun mouvement de stock réel';
    }
  };

  // Handler après création d'un mouvement
  const handleMovementCreated = () => {
    // Rafraîchir la liste des mouvements
    applyFilters({ ...filters, offset: 0 });
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
                Mouvements de Stock
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Badge info compact */}
              <Badge
                variant="outline"
                className="text-xs text-green-700 border-green-600 px-2 py-1"
              >
                ✓ Stock Réel
              </Badge>

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

              {/* Bouton création de mouvement */}
              <ButtonV2
                size="sm"
                onClick={() => setShowGeneralModal(true)}
                className="bg-black text-white hover:bg-gray-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau mouvement
              </ButtonV2>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-4 space-y-6">
        {/* Statistiques KPI */}
        <MovementsStatsCards stats={stats} loading={loading} />

        {/* Ligne filtres compacte : Bouton Filtres + Toggle Direction */}
        <div className="flex items-center justify-between">
          {/* Bouton Filtres (gauche) */}
          <div className="flex items-center gap-3">
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

            {/* Lien vers Ajustements */}
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={() => router.push('/stocks/ajustements')}
              className="border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              🔍 Ajustements uniquement
            </ButtonV2>
          </div>

          {/* Toggle Direction (droite) */}
          <div className="flex items-center border border-black rounded-md p-1 gap-1">
            <ButtonV2
              variant={directionFilter === 'in' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleDirectionChange('in')}
              className={cn(
                'px-4',
                directionFilter === 'in'
                  ? 'bg-black text-white hover:bg-black/90'
                  : 'text-black hover:bg-gray-100'
              )}
            >
              Entrées
            </ButtonV2>
            <ButtonV2
              variant={directionFilter === 'out' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleDirectionChange('out')}
              className={cn(
                'px-4',
                directionFilter === 'out'
                  ? 'bg-black text-white hover:bg-black/90'
                  : 'text-black hover:bg-gray-100'
              )}
            >
              Sorties
            </ButtonV2>
            <ButtonV2
              variant={directionFilter === 'all' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleDirectionChange('all')}
              className={cn(
                'px-4',
                directionFilter === 'all'
                  ? 'bg-black text-white hover:bg-black/90'
                  : 'text-black hover:bg-gray-100'
              )}
            >
              Tous
            </ButtonV2>
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

            {/* Contenu Principal */}
            <div className="flex-1 space-y-4">
              {/* En-tête avec titre, toggle vue et pagination */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-black">
                    {getTitle()}
                  </h2>
                  {hasFilters && (
                    <Badge
                      variant="outline"
                      className="border-black text-black"
                    >
                      Filtré
                    </Badge>
                  )}
                  <span className="text-sm text-gray-500">
                    {loading ? (
                      'Chargement...'
                    ) : total === 0 ? (
                      'Aucun mouvement'
                    ) : (
                      <>
                        {(pagination.currentPage - 1) * pagination.pageSize + 1}
                        -
                        {Math.min(
                          pagination.currentPage * pagination.pageSize,
                          total
                        )}{' '}
                        sur {total}
                      </>
                    )}
                  </span>
                </div>

                {/* Contrôles : Toggle vue + Pagination */}
                <div className="flex items-center gap-4">
                  {/* Toggle Table/Cards */}
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <ButtonV2
                      variant={viewMode === 'table' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className={cn(
                        'rounded-r-none',
                        viewMode === 'table'
                          ? 'bg-black text-white hover:bg-black/90'
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <Table className="h-4 w-4" />
                    </ButtonV2>
                    <ButtonV2
                      variant={viewMode === 'cards' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('cards')}
                      className={cn(
                        'rounded-l-none',
                        viewMode === 'cards'
                          ? 'bg-black text-white hover:bg-black/90'
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </ButtonV2>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Afficher:</span>
                    <Select
                      value={pagination.pageSize.toString()}
                      onValueChange={handlePageSizeChange}
                    >
                      <SelectTrigger className="w-20 h-8">
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
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </ButtonV2>

                      <span className="text-sm text-gray-500">
                        {pagination.currentPage}/{pagination.totalPages}
                      </span>

                      <ButtonV2
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handlePageChange(pagination.currentPage + 1)
                        }
                        disabled={
                          pagination.currentPage === pagination.totalPages ||
                          loading
                        }
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </ButtonV2>
                    </div>
                  )}
                </div>
              </div>

              {/* Table ou Cards - DIRECTEMENT sans wrapper */}
              {viewMode === 'table' ? (
                <MovementsTable
                  movements={movements}
                  loading={loading}
                  onMovementClick={handleMovementClick}
                  onCancelClick={handleCancelClick}
                  onOrderClick={handleOrderClick}
                />
              ) : (
                <MovementsListView movements={movements} loading={loading} />
              )}

              {/* État vide avec filtres */}
              {!loading && movements.length === 0 && hasFilters && (
                <div className="bg-white border border-gray-200 rounded-lg p-8">
                  <div className="text-center">
                    <Eye className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-black mb-2">
                      Aucun mouvement trouvé
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Aucun mouvement ne correspond aux critères sélectionnés.
                    </p>
                    <ButtonV2
                      variant="outline"
                      onClick={resetFilters}
                      className="border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Réinitialiser les filtres
                    </ButtonV2>
                  </div>
                </div>
              )}

              {/* État vide sans filtres */}
              {!loading && movements.length === 0 && !hasFilters && (
                <div className="bg-white border border-gray-200 rounded-lg p-8">
                  <div className="text-center">
                    <ArrowUpDown className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-black mb-2">
                      {getEmptyMessage()}
                    </h3>
                    <p className="text-gray-500">
                      Les mouvements apparaîtront ici dès qu'ils seront créés.
                    </p>
                  </div>
                </div>
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

        {/* Modals création de mouvement */}
        <GeneralStockMovementModal
          isOpen={showGeneralModal}
          onClose={() => setShowGeneralModal(false)}
          onSuccess={handleMovementCreated}
        />
      </div>
    </div>
  );
}
