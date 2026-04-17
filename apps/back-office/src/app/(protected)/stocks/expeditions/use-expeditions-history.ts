'use client';

import { useState, useEffect, useCallback } from 'react';

import type { SalesOrder, ShipmentHistoryItem } from './expeditions-types';

interface UseHistoryOrdersArgs {
  loadShippedOrdersHistory: (filters: {
    status?: string;
    search?: string;
  }) => Promise<unknown>;
  loadShipmentHistory: (orderId: string) => Promise<unknown>;
  activeTab: string;
  historyStatusFilter: string;
  historySearchTerm: string;
}

export function useHistoryOrders({
  loadShippedOrdersHistory,
  loadShipmentHistory,
  activeTab,
  historyStatusFilter,
  historySearchTerm,
}: UseHistoryOrdersArgs) {
  const [historyOrders, setHistoryOrders] = useState<SalesOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [shipmentHistory, setShipmentHistory] = useState<ShipmentHistoryItem[]>(
    []
  );
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    if (activeTab !== 'history') return;
    const filters: { status?: string; search?: string } = {};
    if (historyStatusFilter !== 'all') filters.status = historyStatusFilter;
    if (historySearchTerm) filters.search = historySearchTerm;
    void loadShippedOrdersHistory(filters)
      .then(data => setHistoryOrders(data as SalesOrder[]))
      .catch((err: unknown) => {
        console.error('[ExpeditionsPage] Load history failed:', err);
      });
  }, [
    loadShippedOrdersHistory,
    historyStatusFilter,
    historySearchTerm,
    activeTab,
  ]);

  const handleViewHistory = useCallback(
    async (order: SalesOrder) => {
      setSelectedOrder(order);
      const history = await loadShipmentHistory(order.id);
      setShipmentHistory((history ?? []) as ShipmentHistoryItem[]);
      setShowHistoryModal(true);
    },
    [loadShipmentHistory]
  );

  const handleCloseHistoryModal = useCallback(() => {
    setShowHistoryModal(false);
    setSelectedOrder(null);
    setShipmentHistory([]);
  }, []);

  /**
   * Rafraîchit l'historique du shipment sélectionné (après édition par ex.)
   */
  const handleRefreshHistory = useCallback(async () => {
    if (!selectedOrder) return;
    const history = await loadShipmentHistory(selectedOrder.id);
    setShipmentHistory((history ?? []) as ShipmentHistoryItem[]);
  }, [selectedOrder, loadShipmentHistory]);

  return {
    historyOrders,
    selectedOrder,
    shipmentHistory,
    showHistoryModal,
    handleViewHistory,
    handleCloseHistoryModal,
    handleRefreshHistory,
  };
}
