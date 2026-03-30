'use client';

import { useState, useEffect } from 'react';

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
import { cn } from '@verone/utils';

import { MovementsContentHeader } from './components/MovementsContentHeader';
import { MovementsDirectionBar } from './components/MovementsDirectionBar';
import { MovementsEmptyState } from './components/MovementsEmptyState';
import { MovementsListView } from './components/MovementsListView';
import { MovementsPageHeader } from './components/MovementsPageHeader';
import {
  type DirectionFilter,
  getTitle,
  getEmptyMessage,
} from './components/utils';

export default function StockMovementsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDirection = (searchParams?.get('tab') ??
    'all') as DirectionFilter;

  const {
    loading,
    movements,
    stats,
    total,
    filters,
    applyFilters,
    resetFilters,
    hasFilters,
    pagination,
  } = useMovementsHistory();

  const [directionFilter, setDirectionFilter] =
    useState<DirectionFilter>(initialDirection);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const [selectedMovement, setSelectedMovement] =
    useState<MovementWithDetails | null>(null);
  const [showMovementDetails, setShowMovementDetails] = useState(false);
  const [movementToCancel, setMovementToCancel] =
    useState<MovementWithDetails | null>(null);
  const [showCancelModal, _toggleShowCancelModal, setShowCancelModal] =
    useToggle(false);

  const [filtersOpen, toggleFiltersOpen] = useToggle(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [showGeneralModal, setShowGeneralModal] = useState(false);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderType, setSelectedOrderType] = useState<
    'sales' | 'purchase' | null
  >(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

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

  const handleDirectionChange = (direction: DirectionFilter) => {
    setDirectionFilter(direction);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', direction);
    window.history.pushState({}, '', url);
    applyFilters({
      ...filters,
      movementTypes:
        direction === 'in' ? ['IN'] : direction === 'out' ? ['OUT'] : undefined,
      affects_forecast: false,
      forecast_type: undefined,
      offset: 0,
    });
  };

  const handlePageChange = (newPage: number) => {
    applyFilters({ ...filters, offset: (newPage - 1) * pagination.pageSize });
  };

  const handlePageSizeChange = (newSize: string) => {
    applyFilters({ ...filters, limit: parseInt(newSize, 10), offset: 0 });
  };

  const handleMovementClick = (movement: MovementWithDetails) => {
    setSelectedMovement(movement);
    setShowMovementDetails(true);
  };

  const handleCancelClick = (movement: MovementWithDetails) => {
    setMovementToCancel(movement);
    setShowCancelModal(true);
  };

  const handleCancelSuccess = () => {
    window.location.reload();
  };

  const handleOrderClick = (
    orderId: string,
    orderType: 'sales' | 'purchase'
  ) => {
    setSelectedOrderId(orderId);
    setSelectedOrderType(orderType);
    setShowOrderModal(true);
  };

  const handleMovementCreated = () => {
    applyFilters({ ...filters, offset: 0 });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MovementsPageHeader
        loading={loading}
        onBack={() => router.push('/stocks')}
        onRefresh={() => window.location.reload()}
        onNewMovement={() => setShowGeneralModal(true)}
      />

      <div className="w-full px-4 py-4 space-y-6">
        <MovementsStatsCards stats={stats} loading={loading} />

        <MovementsDirectionBar
          directionFilter={directionFilter}
          filtersOpen={filtersOpen}
          activeFiltersCount={activeFiltersCount}
          onToggleFilters={toggleFiltersOpen}
          onDirectionChange={handleDirectionChange}
          onAdjustmentsClick={() => router.push('/stocks/ajustements')}
        />

        <div className="relative">
          <div className="flex gap-6">
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

            <div className="flex-1 space-y-4">
              <MovementsContentHeader
                title={getTitle(directionFilter)}
                hasFilters={hasFilters}
                loading={loading}
                total={total}
                pagination={pagination}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />

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

              {!loading && movements.length === 0 && (
                <MovementsEmptyState
                  hasFilters={hasFilters}
                  emptyMessage={getEmptyMessage(directionFilter)}
                  onResetFilters={resetFilters}
                />
              )}
            </div>
          </div>
        </div>

        <MovementDetailsModal
          movement={selectedMovement}
          isOpen={showMovementDetails}
          onClose={() => {
            setShowMovementDetails(false);
            setSelectedMovement(null);
          }}
        />

        <CancelMovementModal
          movement={movementToCancel}
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setMovementToCancel(null);
          }}
          onSuccess={handleCancelSuccess}
        />

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

        <GeneralStockMovementModal
          isOpen={showGeneralModal}
          onClose={() => setShowGeneralModal(false)}
          onSuccess={handleMovementCreated}
        />
      </div>
    </div>
  );
}
