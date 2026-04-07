'use client';

import { useState, useEffect } from 'react';

import type { ReceptionShipmentStats, ReceptionHistory } from '@verone/types';

import { usePurchaseReceptions } from '@verone/orders';

import type {
  PurchaseOrderWithSupplier,
  CancellationHistoryItem,
  AffiliateReceptionMapped,
  ReceptionFilters,
} from './types';

export interface ReceptionsPageState {
  // Data
  stats: ReceptionShipmentStats | null;
  orders: PurchaseOrderWithSupplier[];
  historyOrders: PurchaseOrderWithSupplier[];
  selectedOrder: PurchaseOrderWithSupplier | null;
  receptionHistory: ReceptionHistory[];
  cancellationHistory: CancellationHistoryItem[];
  affiliateReceptions: AffiliateReceptionMapped[];
  affiliateHistory: AffiliateReceptionMapped[];
  selectedAffiliateReception: AffiliateReceptionMapped | null;

  // UI state
  loading: boolean;
  error: string | null;
  showReceptionModal: boolean;
  showHistoryModal: boolean;
  activeTab: string;
  searchTerm: string;
  statusFilter: string;
  urgencyFilter: string;
  sourceFilter: 'all' | 'suppliers' | 'affiliates';
  historySearchTerm: string;
  expandedRows: Set<string>;
  expandedHistoryRows: Set<string>;

  // Setters for controlled inputs
  setActiveTab: (tab: string) => void;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (filter: string) => void;
  setUrgencyFilter: (filter: string) => void;
  setSourceFilter: (filter: 'all' | 'suppliers' | 'affiliates') => void;
  setHistorySearchTerm: (term: string) => void;
  setSelectedAffiliateReception: (r: AffiliateReceptionMapped | null) => void;

  // Handlers
  toggleRowExpansion: (orderId: string) => void;
  toggleHistoryRowExpansion: (orderId: string) => void;
  handleOpenReception: (order: PurchaseOrderWithSupplier) => void;
  handleReceptionSuccess: () => void;
  handleCloseReceptionModal: () => void;
  handleViewHistory: (order: PurchaseOrderWithSupplier) => Promise<void>;
  handleAffiliateReceptionSuccess: () => void;
  handleCloseHistoryModal: () => void;
}

export function useReceptionsPage(): ReceptionsPageState {
  const {
    loading,
    error,
    loadReceptionStats,
    loadPurchaseOrdersReadyForReception,
    loadReceptionHistory,
    loadCancellationHistory,
    loadAffiliateProductReceptions,
  } = usePurchaseReceptions();

  const [stats, setStats] = useState<ReceptionShipmentStats | null>(null);
  const [orders, setOrders] = useState<PurchaseOrderWithSupplier[]>([]);
  const [historyOrders, setHistoryOrders] = useState<
    PurchaseOrderWithSupplier[]
  >([]);
  const [selectedOrder, setSelectedOrder] =
    useState<PurchaseOrderWithSupplier | null>(null);
  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [receptionHistory, setReceptionHistory] = useState<ReceptionHistory[]>(
    []
  );
  const [cancellationHistory, setCancellationHistory] = useState<
    CancellationHistoryItem[]
  >([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [affiliateReceptions, setAffiliateReceptions] = useState<
    AffiliateReceptionMapped[]
  >([]);
  const [affiliateHistory, setAffiliateHistory] = useState<
    AffiliateReceptionMapped[]
  >([]);
  const [selectedAffiliateReception, setSelectedAffiliateReception] =
    useState<AffiliateReceptionMapped | null>(null);

  const [activeTab, setActiveTab] = useState<string>('to-receive');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<
    'all' | 'suppliers' | 'affiliates'
  >('all');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedHistoryRows, setExpandedHistoryRows] = useState<Set<string>>(
    new Set()
  );

  const toggleRowExpansion = (orderId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const toggleHistoryRowExpansion = (orderId: string) => {
    setExpandedHistoryRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Charger stats
  useEffect(() => {
    void loadReceptionStats()
      .then(setStats)
      .catch(error => {
        console.error('[Receptions] Failed to load stats:', error);
      });
  }, [loadReceptionStats]);

  // Charger liste POs à recevoir (fournisseurs) - aussi quand 'all'
  useEffect(() => {
    if (
      activeTab === 'to-receive' &&
      (sourceFilter === 'suppliers' || sourceFilter === 'all')
    ) {
      const filters: ReceptionFilters = {};

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      if (searchTerm) {
        filters.search = searchTerm;
      }

      if (urgencyFilter === 'urgent') {
        filters.urgent_only = true;
      } else if (urgencyFilter === 'overdue') {
        filters.overdue_only = true;
      }

      void loadPurchaseOrdersReadyForReception(filters)
        .then(data => setOrders(data as PurchaseOrderWithSupplier[]))
        .catch(error => {
          console.error('[Receptions] Failed to load purchase orders:', error);
        });
    }
  }, [
    statusFilter,
    searchTerm,
    urgencyFilter,
    activeTab,
    sourceFilter,
    loadPurchaseOrdersReadyForReception,
  ]);

  // Charger réceptions affiliés - aussi quand 'all'
  useEffect(() => {
    if (
      activeTab === 'to-receive' &&
      (sourceFilter === 'affiliates' || sourceFilter === 'all')
    ) {
      void loadAffiliateProductReceptions({ search: searchTerm })
        .then(data =>
          setAffiliateReceptions(data as AffiliateReceptionMapped[])
        )
        .catch(error => {
          console.error(
            '[Receptions] Failed to load affiliate receptions:',
            error
          );
        });
    }
  }, [searchTerm, activeTab, sourceFilter, loadAffiliateProductReceptions]);

  // Charger historique POs reçus + affiliés
  useEffect(() => {
    if (activeTab === 'history') {
      const filters: ReceptionFilters = {
        status: 'received',
      };

      if (historySearchTerm) {
        filters.search = historySearchTerm;
      }

      void loadPurchaseOrdersReadyForReception(filters)
        .then(data => setHistoryOrders(data as PurchaseOrderWithSupplier[]))
        .catch(error => {
          console.error('[Receptions] Failed to load history orders:', error);
        });

      void loadAffiliateProductReceptions({
        status: 'completed',
        search: historySearchTerm,
      })
        .then(data => setAffiliateHistory(data as AffiliateReceptionMapped[]))
        .catch(error => {
          console.error(
            '[Receptions] Failed to load affiliate history:',
            error
          );
        });
    }
  }, [
    historySearchTerm,
    activeTab,
    loadAffiliateProductReceptions,
    loadPurchaseOrdersReadyForReception,
  ]);

  const handleOpenReception = (order: PurchaseOrderWithSupplier) => {
    setSelectedOrder(order);
    setShowReceptionModal(true);
  };

  const handleReceptionSuccess = () => {
    void loadReceptionStats()
      .then(setStats)
      .catch(error => {
        console.error('[Receptions] Failed to reload stats:', error);
      });
    void loadPurchaseOrdersReadyForReception()
      .then(data => setOrders(data as PurchaseOrderWithSupplier[]))
      .catch(error => {
        console.error('[Receptions] Failed to reload orders:', error);
      });
    setShowReceptionModal(false);
    setSelectedOrder(null);
  };

  const handleCloseReceptionModal = () => {
    setShowReceptionModal(false);
    setSelectedOrder(null);
  };

  const handleViewHistory = async (order: PurchaseOrderWithSupplier) => {
    setSelectedOrder(order);
    const [history, cancellations] = await Promise.all([
      loadReceptionHistory(order.id),
      loadCancellationHistory(order.id),
    ]);
    setReceptionHistory(history ?? []);
    setCancellationHistory(cancellations ?? []);
    setShowHistoryModal(true);
  };

  const handleAffiliateReceptionSuccess = () => {
    void loadAffiliateProductReceptions()
      .then(data => setAffiliateReceptions(data as AffiliateReceptionMapped[]))
      .catch(error => {
        console.error(
          '[Receptions] Failed to reload affiliate receptions:',
          error
        );
      });
    void loadReceptionStats()
      .then(setStats)
      .catch(error => {
        console.error('[Receptions] Failed to reload stats:', error);
      });
    setSelectedAffiliateReception(null);
  };

  const handleCloseHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedOrder(null);
    setReceptionHistory([]);
    setCancellationHistory([]);
  };

  return {
    // Data
    stats,
    orders,
    historyOrders,
    selectedOrder,
    receptionHistory,
    cancellationHistory,
    affiliateReceptions,
    affiliateHistory,
    selectedAffiliateReception,

    // UI state
    loading,
    error,
    showReceptionModal,
    showHistoryModal,
    activeTab,
    searchTerm,
    statusFilter,
    urgencyFilter,
    sourceFilter,
    historySearchTerm,
    expandedRows,
    expandedHistoryRows,

    // Setters
    setActiveTab,
    setSearchTerm,
    setStatusFilter,
    setUrgencyFilter,
    setSourceFilter,
    setHistorySearchTerm,
    setSelectedAffiliateReception,

    // Handlers
    toggleRowExpansion,
    toggleHistoryRowExpansion,
    handleOpenReception,
    handleReceptionSuccess,
    handleCloseReceptionModal,
    handleViewHistory,
    handleAffiliateReceptionSuccess,
    handleCloseHistoryModal,
  };
}
