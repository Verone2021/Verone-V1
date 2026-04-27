'use client';

import { useEffect, useRef } from 'react';

import { useSearchParams } from 'next/navigation';

import { Badge } from '@verone/ui';
import { Tabs, TabsList, TabsTrigger } from '@verone/ui';

import { ExpeditionsStats } from './expeditions-stats';
import { HistoryDetailModal } from './expeditions-history-modal';
import { HistoryTab } from './expeditions-tab-history';
import { PacklinkTab } from './expeditions-tab-packlink';
import { ToShipTab } from './expeditions-tab-to-ship';
import { ShipmentModalWrapper } from './expeditions-order-row';
import type { UseExpeditionsReturn } from './use-expeditions';
import { useExpeditions } from './use-expeditions';

function ExpeditionsTabs({ exp }: { exp: UseExpeditionsReturn }) {
  return (
    <Tabs
      value={exp.activeTab}
      onValueChange={exp.setActiveTab}
      className="w-full"
    >
      <TabsList className="grid w-full max-w-xl grid-cols-3">
        <TabsTrigger value="to-ship">À expédier</TabsTrigger>
        <TabsTrigger value="packlink">
          En cours Packlink
          {exp.packlinkShipments.length > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {exp.packlinkShipments.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="history">Historique</TabsTrigger>
      </TabsList>
      <ToShipTab
        orders={exp.orders}
        loading={exp.loading}
        error={exp.error}
        searchTerm={exp.searchTerm}
        statusFilter={exp.statusFilter}
        urgencyFilter={exp.urgencyFilter}
        expandedRows={exp.expandedRows}
        packlinkPendingOrders={exp.packlinkPendingOrders}
        orderProgress={exp.orderProgress}
        onSearchChange={exp.setSearchTerm}
        onStatusFilterChange={exp.setStatusFilter}
        onUrgencyFilterChange={exp.setUrgencyFilter}
        onToggleRow={exp.toggleRowExpansion}
        onShip={exp.handleOpenShipmentModal}
      />
      <PacklinkTab
        packlinkShipments={exp.packlinkShipments}
        onCancel={id => {
          void exp.handleCancelPacklinkShipment(id).catch((err: unknown) => {
            console.error('[ExpeditionsPage] Cancel Packlink failed:', err);
          });
        }}
      />
      <HistoryTab
        historyOrders={exp.historyOrders}
        loading={exp.loading}
        error={exp.error}
        historySearchTerm={exp.historySearchTerm}
        historyStatusFilter={exp.historyStatusFilter}
        expandedHistoryRows={exp.expandedHistoryRows}
        onSearchChange={exp.setHistorySearchTerm}
        onStatusFilterChange={exp.setHistoryStatusFilter}
        onToggleRow={exp.toggleHistoryRowExpansion}
        onViewHistory={order => {
          void exp.handleViewHistory(order).catch((err: unknown) => {
            console.error('[ExpeditionsPage] View history failed:', err);
          });
        }}
      />
    </Tabs>
  );
}

export default function ExpeditionsPage() {
  const exp = useExpeditions();
  const searchParams = useSearchParams();

  // Auto-expand la commande si ?order=UUID present (lien depuis notifications).
  // useRef évite la dépendance instable sur exp.toggleRowExpansion / exp.orders
  // qui rebouclait à chaque render. On garde un flag pour ne déclencher qu'une
  // seule fois par couple (orderId + orders chargés). Cf rule data-fetching.md.
  const expRef = useRef(exp);
  useEffect(() => {
    expRef.current = exp;
  });
  const expandedOnceRef = useRef<string | null>(null);
  useEffect(() => {
    const orderId = searchParams.get('order');
    if (!orderId || expandedOnceRef.current === orderId) return;
    if (expRef.current.orders.length === 0) return;
    expandedOnceRef.current = orderId;
    expRef.current.toggleRowExpansion(orderId);
  }, [searchParams, exp.orders.length]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Expéditions Clients
        </h1>
        <p className="text-gray-600 mt-1">
          Gestion complète des expéditions commandes clients
        </p>
      </div>
      {exp.stats && <ExpeditionsStats stats={exp.stats} />}
      <ExpeditionsTabs exp={exp} />
      <ShipmentModalWrapper
        orderToShip={exp.orderToShip}
        showShipmentModal={exp.showShipmentModal}
        onClose={exp.handleCloseShipmentModal}
        onSuccess={exp.handleShipmentSuccess}
      />
      <HistoryDetailModal
        selectedOrder={exp.selectedOrder}
        showHistoryModal={exp.showHistoryModal}
        shipmentHistory={exp.shipmentHistory}
        onClose={exp.handleCloseHistoryModal}
        onEditSuccess={() => {
          void exp.handleRefreshHistory().catch((err: unknown) => {
            console.error('[ExpeditionsPage] Refresh history failed:', err);
          });
        }}
      />
    </div>
  );
}
