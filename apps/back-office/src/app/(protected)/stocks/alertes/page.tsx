'use client';

import React from 'react';

import { CheckCircle, Package } from 'lucide-react';

import { PurchaseOrderDetailModal } from '@verone/orders';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';

import { QuickPurchaseOrderModal } from '@/components/business/quick-purchase-order-modal';

import { AlertesFilters } from './components/AlertesFilters';
import { AlertesHeader } from './components/AlertesHeader';
import { AlertesKpiCards } from './components/AlertesKpiCards';
import { AlertsListCard } from './components/AlertsListCard';
import { useStockAlertesPage } from './hooks';

export default function StockAlertesPage() {
  const {
    router,
    filters,
    setFilters,
    searchTerm,
    setSearchTerm,
    showFilters,
    toggleShowFilters,
    showQuickPurchaseModal,
    setShowQuickPurchaseModal,
    selectedProductForOrder,
    setSelectedProductForOrder,
    activeTab,
    setActiveTab,
    showOrderDetailModal,
    setShowOrderDetailModal,
    loading,
    fetchAlerts,
    currentOrder,
    alertStats,
    activeAlerts,
    historiqueAlerts,
    filteredAlerts,
    handleOpenOrderDetail,
  } = useStockAlertesPage();

  const handleAlertAction = (clickedAlert: {
    stock_real: number;
    stock_forecasted_in?: number;
    stock_forecasted_out?: number;
    min_stock: number;
    draft_order_id: string | null;
    product_id: string;
    shortage_quantity: number;
  }) => {
    const stockPrevisionnel =
      clickedAlert.stock_real +
      (clickedAlert.stock_forecasted_in ?? 0) -
      (clickedAlert.stock_forecasted_out ?? 0);
    const manqueReel = Math.max(0, clickedAlert.min_stock - stockPrevisionnel);
    const seuilAtteint = stockPrevisionnel >= clickedAlert.min_stock;

    if (seuilAtteint && clickedAlert.draft_order_id) {
      void handleOpenOrderDetail(clickedAlert.draft_order_id).catch(error => {
        console.error('[AlertesPage] Open order detail failed:', error);
      });
      return;
    }

    setSelectedProductForOrder({
      productId: clickedAlert.product_id,
      shortageQuantity: manqueReel,
    });
    setShowQuickPurchaseModal(true);
  };

  const hasActiveFilters = Boolean(
    searchTerm || filters.severity || filters.category
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AlertesHeader
        router={router}
        loading={loading}
        fetchAlerts={fetchAlerts}
      />

      <div className="w-full px-4 py-8 space-y-8">
        <AlertesKpiCards alertStats={alertStats} />

        <AlertesFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showFilters={showFilters}
          toggleShowFilters={toggleShowFilters}
          setFilters={setFilters}
        />

        <Tabs
          value={activeTab}
          onValueChange={v => setActiveTab(v as 'actives' | 'historique')}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="actives">
              Actives ({activeAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="historique">
              Historique ({historiqueAlerts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="actives" className="mt-6">
            <AlertsListCard
              filteredAlerts={filteredAlerts}
              loading={loading}
              title="Alertes Actives"
              description="Produits nécessitant une action (stock < seuil minimum)"
              emptyIcon={
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              }
              emptyMessage="Aucune alerte active"
              emptySubMessage={
                hasActiveFilters
                  ? 'Essayez de modifier vos filtres'
                  : 'Tous les produits ont un stock suffisant'
              }
              onActionClick={handleAlertAction}
            />
          </TabsContent>

          <TabsContent value="historique" className="mt-6">
            <AlertsListCard
              filteredAlerts={filteredAlerts}
              loading={loading}
              title="Historique"
              description="Alertes résolues (stock ≥ seuil minimum)"
              emptyIcon={
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              }
              emptyMessage="Aucune alerte dans l'historique"
              emptySubMessage="Les alertes résolues apparaîtront ici"
              onActionClick={handleAlertAction}
            />
          </TabsContent>
        </Tabs>
      </div>

      {selectedProductForOrder && (
        <QuickPurchaseOrderModal
          open={showQuickPurchaseModal}
          onClose={() => {
            setShowQuickPurchaseModal(false);
            setSelectedProductForOrder(null);
          }}
          productId={selectedProductForOrder.productId}
          shortageQuantity={selectedProductForOrder.shortageQuantity}
          onSuccess={() => {
            void fetchAlerts().catch(error => {
              console.error(
                '[AlertesPage] Refresh after order success failed:',
                error
              );
            });
          }}
        />
      )}

      {showOrderDetailModal && currentOrder && (
        <PurchaseOrderDetailModal
          order={currentOrder}
          open={showOrderDetailModal}
          onClose={() => {
            setShowOrderDetailModal(false);
          }}
          onUpdate={() => {
            void fetchAlerts().catch(error => {
              console.error(
                '[AlertesPage] Refresh after order update failed:',
                error
              );
            });
          }}
        />
      )}
    </div>
  );
}
