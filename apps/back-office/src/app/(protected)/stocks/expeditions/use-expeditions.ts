'use client';

import { useSalesShipments } from '@verone/orders';

import type {
  SalesOrder,
  SalesOrderProgress,
  ShipmentStats,
  ShipmentHistoryItem,
  PacklinkShipment,
} from './expeditions-types';
import { useExpeditionsFilters } from './use-expeditions-filters';
import { useHistoryOrders } from './use-expeditions-history';
import {
  useToShipOrders,
  usePacklinkShipmentsList,
  useExpeditionsStats,
} from './use-expeditions-orders';
import {
  useExpeditionsExpanded,
  useShipmentModal,
  useShipmentSuccessHandler,
} from './use-expeditions-ui';

export interface UseExpeditionsReturn {
  loading: boolean;
  error: string | null;
  stats: ShipmentStats | null;
  orders: SalesOrder[];
  historyOrders: SalesOrder[];
  packlinkShipments: PacklinkShipment[];
  packlinkPendingOrders: Set<string>;
  orderProgress: Map<string, SalesOrderProgress>;
  expandedRows: Set<string>;
  expandedHistoryRows: Set<string>;
  activeTab: string;
  searchTerm: string;
  statusFilter: string;
  urgencyFilter: string;
  historySearchTerm: string;
  historyStatusFilter: string;
  selectedOrder: SalesOrder | null;
  shipmentHistory: ShipmentHistoryItem[];
  showHistoryModal: boolean;
  showShipmentModal: boolean;
  orderToShip: SalesOrder | null;
  setActiveTab: (tab: string) => void;
  setSearchTerm: (v: string) => void;
  setStatusFilter: (v: string) => void;
  setUrgencyFilter: (v: string) => void;
  setHistorySearchTerm: (v: string) => void;
  setHistoryStatusFilter: (v: string) => void;
  toggleRowExpansion: (id: string) => void;
  toggleHistoryRowExpansion: (id: string) => void;
  handleOpenShipmentModal: (order: SalesOrder) => void;
  handleCloseShipmentModal: () => void;
  handleShipmentSuccess: () => void;
  handleViewHistory: (order: SalesOrder) => Promise<void>;
  handleCloseHistoryModal: () => void;
  handleRefreshHistory: () => Promise<void>;
  handleCancelPacklinkShipment: (shipmentId: string) => Promise<void>;
}

// Assembles the final return value — kept outside the hook to stay under line limit.
function buildReturn(
  base: ReturnType<typeof useSalesShipments>,
  rest: Omit<UseExpeditionsReturn, 'loading' | 'error'>
): UseExpeditionsReturn {
  return { loading: base.loading, error: base.error, ...rest };
}

export function useExpeditions(): UseExpeditionsReturn {
  const shipments = useSalesShipments();
  const { loadShipmentStats, loadSalesOrdersReadyForShipment } = shipments;
  const { loadShipmentHistory, loadShippedOrdersHistory } = shipments;

  const filters = useExpeditionsFilters();
  const { activeTab, searchTerm, statusFilter, urgencyFilter } = filters;
  const { historySearchTerm, historyStatusFilter } = filters;

  const { stats, setStats } = useExpeditionsStats({ loadShipmentStats });
  const expanded = useExpeditionsExpanded();
  const modal = useShipmentModal();
  const { orders, setOrders, packlinkPendingOrders, orderProgress } =
    useToShipOrders({
      loadSalesOrdersReadyForShipment,
      activeTab,
      statusFilter,
      searchTerm,
      urgencyFilter,
    });
  const { packlinkShipments, handleCancelPacklinkShipment } =
    usePacklinkShipmentsList({ activeTab });
  const history = useHistoryOrders({
    loadShippedOrdersHistory,
    loadShipmentHistory,
    activeTab,
    historyStatusFilter,
    historySearchTerm,
  });
  const handleShipmentSuccess = useShipmentSuccessHandler({
    setShowShipmentModal: modal.setShowShipmentModal,
    setOrderToShip: modal.setOrderToShip,
    loadShipmentStats,
    setStats,
    loadSalesOrdersReadyForShipment,
    setOrders,
    statusFilter,
    searchTerm,
  });

  return buildReturn(shipments, {
    stats,
    orders,
    packlinkShipments,
    packlinkPendingOrders,
    orderProgress,
    historyOrders: history.historyOrders,
    selectedOrder: history.selectedOrder,
    shipmentHistory: history.shipmentHistory,
    showHistoryModal: history.showHistoryModal,
    showShipmentModal: modal.showShipmentModal,
    orderToShip: modal.orderToShip,
    expandedRows: expanded.expandedRows,
    expandedHistoryRows: expanded.expandedHistoryRows,
    ...filters,
    toggleRowExpansion: expanded.toggleRowExpansion,
    toggleHistoryRowExpansion: expanded.toggleHistoryRowExpansion,
    handleOpenShipmentModal: modal.handleOpenShipmentModal,
    handleCloseShipmentModal: modal.handleCloseShipmentModal,
    handleShipmentSuccess,
    handleViewHistory: history.handleViewHistory,
    handleCloseHistoryModal: history.handleCloseHistoryModal,
    handleRefreshHistory: history.handleRefreshHistory,
    handleCancelPacklinkShipment,
  });
}
