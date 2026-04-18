'use client';

import { useState, useEffect, useMemo } from 'react';

import { useSearchParams } from 'next/navigation';

import type { PurchaseOrder, PurchaseOrderStatus } from '@verone/orders';
import type { PurchaseAdvancedFilters } from '@verone/orders';
import { DEFAULT_PURCHASE_FILTERS, countActiveFilters } from '@verone/orders';
import { usePurchaseOrders } from '@verone/orders';
import { useOrganisations } from '@verone/organisations';
import { createClient } from '@verone/utils/supabase/client';

import type {
  SortColumn,
  SortDirection,
  ShortageDetail,
  CancelRemainderItem,
  PurchaseOrderRow,
  PurchaseOrderExtended,
} from './types';
import { useFournisseursActions } from './use-fournisseurs-actions';
import { useFournisseursFilters } from './use-fournisseurs-filters';

// =====================================================================
// HOOK PRINCIPAL — état + effets + navigation + actions
// =====================================================================

export function useFournisseursPage() {
  const {
    loading,
    orders,
    stats: _stats,
    fetchOrders,
    fetchStats,
    updateStatus: _updateStatus,
    deleteOrder,
  } = usePurchaseOrders();

  const searchParams = useSearchParams();
  const { organisations: suppliers } = useOrganisations({ type: 'supplier' });

  // ----------------------------------------------------------------
  // États filtres
  // ----------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<PurchaseOrderStatus | 'all'>(
    'all'
  );
  const [advancedFilters, setAdvancedFilters] =
    useState<PurchaseAdvancedFilters>(DEFAULT_PURCHASE_FILTERS);

  const currentYear = new Date().getFullYear();

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    orders.forEach(order => {
      const dateRef = order.order_date ?? order.created_at;
      years.add(new Date(dateRef).getFullYear());
    });
    years.add(currentYear);
    return Array.from(years).sort((a, b) => a - b);
  }, [orders, currentYear]);

  const isPeriodEnabled =
    advancedFilters.filterYear === null ||
    advancedFilters.filterYear === currentYear;

  const hasActiveFilters = useMemo(
    () => countActiveFilters(advancedFilters, DEFAULT_PURCHASE_FILTERS) > 0,
    [advancedFilters]
  );

  // ----------------------------------------------------------------
  // États tri
  // ----------------------------------------------------------------
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // ----------------------------------------------------------------
  // États modals
  // ----------------------------------------------------------------
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(
    null
  );
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [initialPaymentOpen, setInitialPaymentOpen] = useState(false);
  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<PurchaseOrderRow | null>(null);
  const [showValidateConfirmation, setShowValidateConfirmation] =
    useState(false);
  const [orderToValidate, setOrderToValidate] = useState<string | null>(null);
  const [showDevalidateConfirmation, setShowDevalidateConfirmation] =
    useState(false);
  const [orderToDevalidate, setOrderToDevalidate] = useState<string | null>(
    null
  );
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [showShortageWarning, setShowShortageWarning] = useState(false);
  const [shortageDetails, setShortageDetails] = useState<ShortageDetail[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showCancelRemainderModal, setShowCancelRemainderModal] =
    useState(false);
  const [cancelRemainderOrder, setCancelRemainderOrder] =
    useState<PurchaseOrder | null>(null);
  const [cancelRemainderItems, setCancelRemainderItems] = useState<
    CancelRemainderItem[]
  >([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // ----------------------------------------------------------------
  // Effets
  // ----------------------------------------------------------------
  useEffect(() => {
    const supabase = createClient();
    void supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        setCurrentUserId(user?.id ?? null);
      })
      .catch(error => {
        console.error('[PurchaseOrders] getUser failed:', error);
      });
  }, []);

  useEffect(() => {
    void fetchOrders().catch(error => {
      console.error('[PurchaseOrders] Fetch orders failed:', error);
    });
    void fetchStats().catch(error => {
      console.error('[PurchaseOrders] Fetch stats failed:', error);
    });
  }, [fetchOrders, fetchStats]);

  useEffect(() => {
    const orderId = searchParams.get('id');
    if (orderId && orders.length > 0 && !showOrderDetail) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setShowOrderDetail(true);
      }
    }
  }, [searchParams, orders, showOrderDetail]);

  // ----------------------------------------------------------------
  // Toggle ligne expandée
  // ----------------------------------------------------------------
  const toggleRow = (orderId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  // ----------------------------------------------------------------
  // Filtrage + KPIs (hook dédié)
  // ----------------------------------------------------------------
  // Supabase retourne PurchaseOrder[], mais les champs extended (payment_status_v2,
  // is_matched, etc.) sont injectes par la query JOIN. Le cast est safe car les
  // champs sont optionnels dans PurchaseOrderExtended.
  const ordersExtended = orders as PurchaseOrderExtended[];

  const { tabCounts, filteredOrders, filteredStats } = useFournisseursFilters({
    orders: ordersExtended,
    activeTab,
    searchTerm,
    advancedFilters,
    sortColumn,
    sortDirection,
    currentYear,
  });

  // ----------------------------------------------------------------
  // Tri
  // ----------------------------------------------------------------
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // ----------------------------------------------------------------
  // Actions (délégué à use-fournisseurs-actions)
  // ----------------------------------------------------------------
  const actions = useFournisseursActions({
    state: {
      currentUserId,
      orderToValidate,
      orderToDevalidate,
      orderToDelete,
      orderToCancel,
      shortageDetails,
    },
    setters: {
      setShowValidateConfirmation,
      setOrderToValidate,
      setShowDevalidateConfirmation,
      setOrderToDevalidate,
      setShowDeleteConfirmation,
      setOrderToDelete,
      setShowCancelConfirmation,
      setOrderToCancel,
      setShowShortageWarning,
      setShortageDetails,
      setShowEditModal,
      setOrderToEdit,
      setShowReceptionModal,
      setShowOrderDetail,
      setSelectedOrder,
      setInitialPaymentOpen,
      setShowCancelRemainderModal,
      setCancelRemainderOrder,
      setCancelRemainderItems,
    },
    fetchOrders,
    deleteOrder,
  });

  // ----------------------------------------------------------------
  // Return
  // ----------------------------------------------------------------
  return {
    loading,
    orders,
    filteredOrders,
    filteredStats,
    suppliers,
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    advancedFilters,
    setAdvancedFilters,
    availableYears,
    currentYear,
    isPeriodEnabled,
    hasActiveFilters,
    tabCounts,
    sortColumn,
    sortDirection,
    handleSort,
    expandedRows,
    toggleRow,
    selectedOrder,
    setSelectedOrder,
    showOrderDetail,
    setShowOrderDetail,
    initialPaymentOpen,
    setInitialPaymentOpen,
    showReceptionModal,
    setShowReceptionModal,
    showEditModal,
    setShowEditModal,
    orderToEdit,
    setOrderToEdit,
    showValidateConfirmation,
    setShowValidateConfirmation,
    orderToValidate,
    showDevalidateConfirmation,
    setShowDevalidateConfirmation,
    showDeleteConfirmation,
    setShowDeleteConfirmation,
    showCancelConfirmation,
    setShowCancelConfirmation,
    showShortageWarning,
    setShowShortageWarning,
    shortageDetails,
    setShortageDetails,
    showCancelRemainderModal,
    setShowCancelRemainderModal,
    cancelRemainderOrder,
    setCancelRemainderOrder,
    cancelRemainderItems,
    setCancelRemainderItems,
    fetchOrders,
    ...actions,
  };
}
