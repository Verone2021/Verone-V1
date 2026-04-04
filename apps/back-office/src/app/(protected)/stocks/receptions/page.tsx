'use client';

/**
 * Page Réceptions Marchandises (Purchase Orders)
 *
 * @since Phase 3.7 - Unification réceptions (2025-11-04)
 * @updated Phase 3.8 - Historique + Tabs (2025-11-04)
 * @refactored BO-MAXLINES-015 - Decomposition en sous-composants
 */

import type { AffiliateReception, PurchaseOrder } from '@verone/orders';
import {
  PurchaseOrderReceptionModal,
  AffiliateReceptionModal,
} from '@verone/orders';
import { Input } from '@verone/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import { Search } from 'lucide-react';

import { AffiliateHistoryTable } from './AffiliateHistoryTable';
import { AffiliateReceptionsTable } from './AffiliateReceptionsTable';
import { ReceptionHistoryModal } from './ReceptionHistoryModal';
import { ReceptionsFilters } from './ReceptionsFilters';
import { ReceptionsStatsCards } from './ReceptionsStatsCards';
import { SupplierHistoryTable } from './SupplierHistoryTable';
import { SupplierOrdersTable } from './SupplierOrdersTable';
import { useReceptionsPage } from './use-receptions-page';

export default function ReceptionsPage() {
  const state = useReceptionsPage();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Réceptions Marchandises
        </h1>
        <p className="text-gray-600 mt-1">
          Gestion complète des réceptions fournisseurs
        </p>
      </div>

      {/* Stats Dashboard */}
      {state.stats && <ReceptionsStatsCards stats={state.stats} />}

      {/* Tabs: À recevoir / Historique */}
      <Tabs
        value={state.activeTab}
        onValueChange={state.setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="to-receive">À recevoir</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        {/* TAB 1: À RECEVOIR */}
        <TabsContent value="to-receive" className="space-y-4 mt-6">
          <ReceptionsFilters
            sourceFilter={state.sourceFilter}
            affiliateReceptionsCount={state.affiliateReceptions.length}
            searchTerm={state.searchTerm}
            statusFilter={state.statusFilter}
            urgencyFilter={state.urgencyFilter}
            onSourceFilterChange={state.setSourceFilter}
            onSearchTermChange={state.setSearchTerm}
            onStatusFilterChange={state.setStatusFilter}
            onUrgencyFilterChange={state.setUrgencyFilter}
          />

          {(state.sourceFilter === 'suppliers' ||
            state.sourceFilter === 'all') && (
            <SupplierOrdersTable
              orders={state.orders}
              loading={state.loading}
              error={state.error}
              expandedRows={state.expandedRows}
              onToggleRow={state.toggleRowExpansion}
              onOpenReception={state.handleOpenReception}
            />
          )}

          {(state.sourceFilter === 'affiliates' ||
            state.sourceFilter === 'all') && (
            <AffiliateReceptionsTable
              receptions={state.affiliateReceptions}
              loading={state.loading}
              onOpenReception={state.setSelectedAffiliateReception}
            />
          )}

          {state.selectedAffiliateReception && (
            <AffiliateReceptionModal
              reception={
                state.selectedAffiliateReception as unknown as AffiliateReception
              }
              open={!!state.selectedAffiliateReception}
              onClose={() => state.setSelectedAffiliateReception(null)}
              onSuccess={state.handleAffiliateReceptionSuccess}
            />
          )}
        </TabsContent>

        {/* TAB 2: HISTORIQUE */}
        <TabsContent value="history" className="space-y-4 mt-6">
          {/* Filtre Historique */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher par numéro de commande ou fournisseur..."
              value={state.historySearchTerm}
              onChange={e => state.setHistorySearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <SupplierHistoryTable
            orders={state.historyOrders}
            loading={state.loading}
            error={state.error}
            expandedHistoryRows={state.expandedHistoryRows}
            onToggleRow={state.toggleHistoryRowExpansion}
            onViewHistory={order => {
              void state.handleViewHistory(order).catch(error => {
                console.error('[Receptions] Failed to view history:', error);
              });
            }}
          />

          <AffiliateHistoryTable
            history={state.affiliateHistory}
            loading={state.loading}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de réception fournisseur */}
      {state.selectedOrder && state.showReceptionModal && (
        <PurchaseOrderReceptionModal
          order={state.selectedOrder as unknown as PurchaseOrder}
          open={state.showReceptionModal}
          onClose={state.handleCloseReceptionModal}
          onSuccess={state.handleReceptionSuccess}
        />
      )}

      {/* Modal détails historique */}
      {state.selectedOrder && state.showHistoryModal && (
        <ReceptionHistoryModal
          selectedOrder={state.selectedOrder}
          receptionHistory={state.receptionHistory}
          cancellationHistory={state.cancellationHistory}
          onClose={state.handleCloseHistoryModal}
        />
      )}
    </div>
  );
}
