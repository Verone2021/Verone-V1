'use client';

/**
 * Page: Mes Commandes
 * Dashboard affilié avec KPIs, pagination server-side et filtre année
 *
 * @module CommandesPage
 * @since 2025-12-19
 * @updated 2026-02-25 - Pagination server-side, filtre année, KPIs corrigés
 */

import Link from 'next/link';

import { Plus } from 'lucide-react';

import { PageTourTrigger } from '../../../components/onboarding/PageTourTrigger';
import { HelpTooltip } from '../../../components/ui/help-tooltip';
import { OrderDetailModal } from './components/OrderDetailModal';
import { CommandesFilters } from './CommandesFilters';
import { CommandesKPIs } from './CommandesKPIs';
import { CommandesList } from './CommandesList';
import { CommandesTabs } from './CommandesTabs';
import { useCommandesPage } from './use-commandes-page';

export default function CommandesPage(): JSX.Element {
  const {
    activeTab,
    page,
    setPage,
    yearFilter,
    periodFilter,
    ownershipTypeFilter,
    expandedOrderId,
    selectedOrder,
    isDetailModalOpen,
    orders,
    totalCount,
    totalPages,
    isLoading,
    error,
    monthlyKPIs,
    kpisLoading,
    commissionStats,
    commissionStatsLoading,
    canViewCommissions,
    handleTabChange,
    handleYearChange,
    handlePeriodChange,
    handleOwnershipTypeChange,
    toggleOrder,
    openDetailModal,
    closeDetailModal,
    getTabCount,
  } = useCommandesPage();

  return (
    <div className="min-h-screen bg-gray-50">
      <PageTourTrigger tourId="tour_order" />

      <div
        data-tour="orders-header"
        className="bg-gradient-to-b from-white to-gray-50/50 border-b px-4 sm:px-6 py-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#183559]">
                Mes Commandes
              </h1>
              <HelpTooltip content="En approbation = en attente de validation Vérone. Validée = confirmée et en préparation. Expédiée = en cours de livraison. Livrée = commission payable." />
            </div>
            <p className="text-[#183559]/60 mt-1">
              Gérez vos commandes clients et suivez vos ventes
            </p>
          </div>
          <Link
            href="/commandes/nouvelle"
            data-tour="orders-create"
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-gradient-to-r from-[#5DBEBB] to-[#4AA8A5] text-white rounded-xl hover:from-[#4DA9A6] hover:to-[#3D9895] shadow-md hover:shadow-lg transition-all duration-200 font-medium w-full sm:w-auto"
          >
            <Plus className="h-5 w-5" />
            Nouvelle commande
          </Link>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        <CommandesKPIs
          monthlyKPIs={monthlyKPIs}
          commissionStats={commissionStats}
          kpisLoading={kpisLoading}
          commissionStatsLoading={commissionStatsLoading}
          canViewCommissions={canViewCommissions}
        />

        <CommandesFilters
          yearFilter={yearFilter}
          periodFilter={periodFilter}
          ownershipTypeFilter={ownershipTypeFilter}
          onYearChange={handleYearChange}
          onPeriodChange={handlePeriodChange}
          onOwnershipTypeChange={handleOwnershipTypeChange}
        />

        <div
          data-tour="orders-filters"
          className="bg-white rounded-xl border shadow-sm"
        >
          <CommandesTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            getTabCount={getTabCount}
          />
          <CommandesList
            orders={orders}
            totalCount={totalCount}
            totalPages={totalPages}
            page={page}
            isLoading={isLoading}
            error={error}
            activeTab={activeTab}
            expandedOrderId={expandedOrderId}
            canViewCommissions={canViewCommissions}
            onToggleOrder={toggleOrder}
            onOpenDetail={openDetailModal}
            onPageChange={setPage}
          />
        </div>
      </div>

      <OrderDetailModal
        order={selectedOrder}
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
      />
    </div>
  );
}
