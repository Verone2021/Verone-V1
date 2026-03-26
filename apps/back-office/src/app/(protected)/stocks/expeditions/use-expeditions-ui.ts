'use client';

import { useState, useCallback } from 'react';

import type { SalesOrder, ShipmentStats } from './expeditions-types';

export function useExpeditionsExpanded() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedHistoryRows, setExpandedHistoryRows] = useState<Set<string>>(
    new Set()
  );

  const toggleRowExpansion = useCallback((id: string) => {
    setExpandedRows(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }, []);

  const toggleHistoryRowExpansion = useCallback((id: string) => {
    setExpandedHistoryRows(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }, []);

  return {
    expandedRows,
    expandedHistoryRows,
    toggleRowExpansion,
    toggleHistoryRowExpansion,
  };
}

export function useShipmentModal() {
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [orderToShip, setOrderToShip] = useState<SalesOrder | null>(null);

  const handleOpenShipmentModal = useCallback((order: SalesOrder) => {
    setOrderToShip(order);
    setShowShipmentModal(true);
  }, []);

  const handleCloseShipmentModal = useCallback(() => {
    setShowShipmentModal(false);
    setOrderToShip(null);
  }, []);

  return {
    showShipmentModal,
    orderToShip,
    setOrderToShip,
    setShowShipmentModal,
    handleOpenShipmentModal,
    handleCloseShipmentModal,
  };
}

interface UseShipmentSuccessArgs {
  setShowShipmentModal: (v: boolean) => void;
  setOrderToShip: (v: SalesOrder | null) => void;
  loadShipmentStats: () => Promise<ShipmentStats>;
  setStats: (v: ShipmentStats) => void;
  loadSalesOrdersReadyForShipment: (f: {
    status?: string;
    search?: string;
  }) => Promise<unknown>;
  setOrders: (v: SalesOrder[]) => void;
  statusFilter: string;
  searchTerm: string;
}

export function useShipmentSuccessHandler({
  setShowShipmentModal,
  setOrderToShip,
  loadShipmentStats,
  setStats,
  loadSalesOrdersReadyForShipment,
  setOrders,
  statusFilter,
  searchTerm,
}: UseShipmentSuccessArgs) {
  return useCallback(() => {
    setShowShipmentModal(false);
    setOrderToShip(null);
    void loadShipmentStats()
      .then(setStats)
      .catch((err: unknown) => {
        console.error('[ExpeditionsPage] Reload stats failed:', err);
      });
    void loadSalesOrdersReadyForShipment({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: searchTerm ?? undefined,
    })
      .then(data => setOrders(data as SalesOrder[]))
      .catch((err: unknown) => {
        console.error('[ExpeditionsPage] Reload orders failed:', err);
      });
  }, [
    setShowShipmentModal,
    setOrderToShip,
    loadShipmentStats,
    setStats,
    loadSalesOrdersReadyForShipment,
    setOrders,
    statusFilter,
    searchTerm,
  ]);
}
