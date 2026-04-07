'use client';

/**
 * Hook pour la gestion des commandes clients
 * Gère le workflow : devis → commande → préparation → expédition → livraison
 *
 * Orchestrateur : compose les hooks spécialisés (fetch, mutations, payments, stock)
 */

import { useState, useMemo, useRef } from 'react';

import { useToast } from '@verone/common/hooks';
import { useStockMovements } from '@verone/stock/hooks/use-stock-movements';
import { createClient } from '@verone/utils/supabase/client';

// Re-export types for backward compatibility (consumers import from this file)
export type {
  SalesOrderStatus,
  ManualPaymentType,
  OrderPayment,
  SalesOrder,
  SalesOrderItem,
  CreateSalesOrderData,
  CreateSalesOrderItemData,
  UpdateSalesOrderData,
  ShipItemData,
  SalesOrderFilters,
  SalesOrderStats,
} from './types/sales-order.types';

// Re-export FSM utilities for backward compatibility
export {
  STATUS_TRANSITIONS,
  validateStatusTransition,
  isFinalStatus,
  getAllowedTransitions,
} from './utils/sales-order-fsm';

import type { SalesOrder, SalesOrderStats } from './types/sales-order.types';
import { getAllowedTransitions, isFinalStatus } from './utils/sales-order-fsm';

// Internal hooks
import { useSalesOrdersFetch } from './use-sales-orders-fetch';
import { useSalesOrdersMutations } from './use-sales-orders-mutations';
import { useSalesOrdersPayments } from './use-sales-orders-payments';
import { useSalesOrdersStock } from './use-sales-orders-stock';

export function useSalesOrders() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [currentOrder, setCurrentOrder] = useState<SalesOrder | null>(null);
  const currentOrderRef = useRef(currentOrder);
  currentOrderRef.current = currentOrder;
  const [stats, setStats] = useState<SalesOrderStats | null>(null);
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const supabase = useMemo(() => createClient(), []);
  const { createMovement: _createMovement, getAvailableStock } =
    useStockMovements();

  // Compose specialized hooks
  const { fetchOrders, fetchOrder, fetchStats } = useSalesOrdersFetch({
    supabase,
    toastRef,
    setLoading,
    setOrders,
    setCurrentOrder,
    setStats,
  });

  const { checkStockAvailability, getStockWithForecasted, markWarehouseExit } =
    useSalesOrdersStock({
      supabase,
      toastRef,
      fetchOrders,
      fetchOrder,
      currentOrderRef,
      getAvailableStock,
    });

  const {
    createOrder,
    updateOrder,
    updateOrderWithItems,
    updateStatus,
    shipItems,
    deleteOrder,
  } = useSalesOrdersMutations({
    supabase,
    toastRef,
    setLoading,
    setCurrentOrder,
    fetchOrders,
    fetchOrder,
    currentOrderRef,
    checkStockAvailability,
    getAvailableStock,
  });

  const {
    markAsPaid,
    markAsManuallyPaid,
    fetchOrderPayments,
    deleteManualPayment,
  } = useSalesOrdersPayments({
    supabase,
    toastRef,
    fetchOrders,
    fetchOrder,
    currentOrderRef,
  });

  return {
    // État
    loading,
    orders,
    currentOrder,
    stats,

    // Actions principales
    fetchOrders,
    fetchOrder,
    fetchStats,
    createOrder,
    updateOrder,
    updateOrderWithItems,
    updateStatus,
    shipItems,
    deleteOrder,
    markAsPaid,
    markAsManuallyPaid,
    fetchOrderPayments,
    deleteManualPayment,
    markWarehouseExit,

    // Utilitaires
    checkStockAvailability,
    getStockWithForecasted,
    setCurrentOrder,

    // FSM Helpers (pour UI)
    getAllowedTransitions,
    isFinalStatus,
  };
}

// FSM utilities are re-exported at the top of this file from './utils/sales-order-fsm'
