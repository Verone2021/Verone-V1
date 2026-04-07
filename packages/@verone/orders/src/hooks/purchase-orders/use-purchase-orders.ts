'use client';
// FIXME: Server actions can't be imported from monorepo packages
// import { updatePurchaseOrderStatus as updatePurchaseOrderStatusAction } from '@/app/actions/purchase-orders';
import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@verone/common/hooks';
import { useStockMovements } from '@verone/stock/hooks/use-stock-movements';
import { createClient } from '@verone/utils/supabase/client';

import type {
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrderFilters,
  PurchaseOrderStats,
  CreatePurchaseOrderData,
  UpdatePurchaseOrderData,
  ReceiveItemData,
  ManualPaymentType,
  OrderPayment,
} from './types';

import {
  fetchOrders as queryFetchOrders,
  fetchOrder as queryFetchOrder,
  fetchStats as queryFetchStats,
  fetchOrderPayments as queryFetchOrderPayments,
  getStockWithForecasted as queryGetStockWithForecasted,
} from './purchase-order-queries';

import {
  createOrder as mutateCreateOrder,
  updateOrder as mutateUpdateOrder,
  updateStatus as mutateUpdateStatus,
  receiveItems as mutateReceiveItems,
  deleteOrder as mutateDeleteOrder,
  markAsManuallyPaid as mutateMarkAsManuallyPaid,
  deleteManualPayment as mutateDeleteManualPayment,
} from './purchase-order-mutations';

export function usePurchaseOrders() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [currentOrder, setCurrentOrder] = useState<PurchaseOrder | null>(null);
  const [stats, setStats] = useState<PurchaseOrderStats | null>(null);
  const { toast } = useToast();
  // ✅ FIX: useMemo pour éviter recréation du client à chaque render
  const supabase = useMemo(() => createClient(), []);
  const { createMovement: _createMovement } = useStockMovements();

  const fetchOrders = useCallback(
    async (filters?: PurchaseOrderFilters) => {
      setLoading(true);
      try {
        const result = await queryFetchOrders(supabase, filters);
        setOrders(result);
      } catch (error) {
        console.error('Erreur lors de la récupération des commandes:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de récupérer les commandes',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast]
  );

  const fetchOrder = useCallback(
    async (orderId: string) => {
      setLoading(true);
      try {
        const result = await queryFetchOrder(supabase, orderId);
        setCurrentOrder(result);
        return result;
      } catch (error) {
        console.error('Erreur lors de la récupération de la commande:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de récupérer la commande',
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast]
  );

  const fetchStats = useCallback(
    async (filters?: PurchaseOrderFilters) => {
      try {
        const result = await queryFetchStats(supabase, filters);
        setStats(result);
      } catch (error) {
        console.error(
          'Erreur lors de la récupération des statistiques:',
          error
        );
      }
    },
    [supabase]
  );

  const createOrder = useCallback(
    async (data: CreatePurchaseOrderData) => {
      setLoading(true);
      try {
        const order = await mutateCreateOrder(supabase, data, {
          onSuccess: () => undefined,
          onError: () => undefined,
          refreshOrders: () => fetchOrders(),
          refreshStats: () => fetchStats(),
        });

        const poNumber = order?.po_number ?? '';
        toast({
          title: 'Succès',
          description: `Commande ${poNumber} créée avec succès`,
        });

        return order;
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : 'Impossible de créer la commande';
        console.error('Erreur lors de la création de la commande:', error);
        toast({
          title: 'Erreur',
          description: message,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, fetchOrders, fetchStats]
  );

  const updateOrder = useCallback(
    async (orderId: string, data: UpdatePurchaseOrderData) => {
      setLoading(true);
      try {
        await mutateUpdateOrder(supabase, orderId, data);

        toast({
          title: 'Succès',
          description: 'Commande mise à jour avec succès',
        });

        await fetchOrders();
        await fetchStats(); // ✅ FIX Bug #6: Rafraîchir les stats après mise à jour
        if (currentOrder?.id === orderId) {
          await fetchOrder(orderId);
        }
      } catch (error: unknown) {
        console.error('Erreur lors de la mise à jour:', error);
        toast({
          title: 'Erreur',
          description:
            (error instanceof Error ? error.message : null) ??
            'Impossible de mettre à jour la commande',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, fetchOrders, fetchStats, currentOrder, fetchOrder]
  );

  const updateStatus = useCallback(
    async (orderId: string, newStatus: PurchaseOrderStatus) => {
      setLoading(true);
      try {
        await mutateUpdateStatus(supabase, orderId, newStatus, {
          refreshStats: () => fetchStats(),
          refreshOrder: (id: string) => fetchOrder(id),
          currentOrderId: currentOrder?.id,
        });
      } catch (error: unknown) {
        console.error('Erreur lors du changement de statut:', error);
        toast({
          title: 'Erreur',
          description:
            (error instanceof Error ? error.message : null) ??
            'Impossible de changer le statut',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, fetchStats, currentOrder, fetchOrder]
  );

  const receiveItems = useCallback(
    async (orderId: string, itemsToReceive: ReceiveItemData[]) => {
      setLoading(true);
      try {
        await mutateReceiveItems(supabase, orderId, itemsToReceive, {
          updateStatusFn: (id, status) => updateStatus(id, status),
        });

        toast({
          title: 'Succès',
          description: 'Réception enregistrée avec succès',
        });
      } catch (error: unknown) {
        console.error('Erreur lors de la réception:', error);
        toast({
          title: 'Erreur',
          description:
            (error instanceof Error ? error.message : null) ??
            "Impossible d'enregistrer la réception",
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, updateStatus]
  );

  const deleteOrder = useCallback(
    async (orderId: string) => {
      setLoading(true);
      try {
        await mutateDeleteOrder(supabase, orderId);

        toast({
          title: 'Succès',
          description: 'Commande supprimée avec succès',
        });

        await fetchOrders();
        await fetchStats(); // ✅ FIX Bug #6: Rafraîchir les stats après suppression
        if (currentOrder?.id === orderId) {
          setCurrentOrder(null);
        }
      } catch (error: unknown) {
        console.error('Erreur lors de la suppression:', error);
        toast({
          title: 'Erreur',
          description:
            (error instanceof Error ? error.message : null) ??
            'Impossible de supprimer la commande',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, fetchOrders, fetchStats, currentOrder]
  );

  const getStockWithForecasted = useCallback(
    async (productId: string) => {
      return queryGetStockWithForecasted(supabase, productId);
    },
    [supabase]
  );

  // Marquer une commande comme validée (déclenche stock prévisionnel)
  const confirmOrder = useCallback(
    async (orderId: string) => {
      return updateStatus(orderId, 'validated');
    },
    [updateStatus]
  );

  // Marquer réception complète
  const markAsReceived = useCallback(
    async (orderId: string) => {
      return updateStatus(orderId, 'received');
    },
    [updateStatus]
  );

  const markAsManuallyPaid = useCallback(
    async (
      orderId: string,
      paymentType: ManualPaymentType,
      amount: number,
      options?: {
        reference?: string;
        note?: string;
        date?: Date;
      }
    ) => {
      setLoading(true);
      try {
        await mutateMarkAsManuallyPaid(
          supabase,
          orderId,
          paymentType,
          amount,
          options
        );

        const paymentLabels: Record<ManualPaymentType, string> = {
          cash: 'Espèces',
          check: 'Chèque',
          transfer_other: 'Virement autre banque',
          card: 'Carte bancaire',
          compensation: 'Compensation',
        };

        toast({
          title: 'Paiement manuel enregistré',
          description: `Type: ${paymentLabels[paymentType]} — ${amount.toFixed(2)} €`,
        });

        await fetchOrders();
        if (currentOrder?.id === orderId) {
          await fetchOrder(orderId);
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Erreur inconnue';
        console.error('Erreur lors du paiement manuel:', error);
        toast({
          title: 'Erreur',
          description: message || "Impossible d'enregistrer le paiement manuel",
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, fetchOrders, currentOrder, fetchOrder]
  );

  const fetchOrderPayments = useCallback(
    async (orderId: string): Promise<OrderPayment[]> => {
      return queryFetchOrderPayments(supabase, orderId);
    },
    [supabase]
  );

  const deleteManualPayment = useCallback(
    async (paymentId: string) => {
      try {
        await mutateDeleteManualPayment(supabase, paymentId);
      } catch (error) {
        console.error('Error deleting PO payment:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer le paiement',
          variant: 'destructive',
        });
        throw error;
      }

      toast({
        title: 'Paiement supprime',
        description: 'Le paiement manuel a ete supprime',
      });

      await fetchOrders();
    },
    [supabase, toast, fetchOrders]
  );

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
    updateStatus,
    receiveItems,
    deleteOrder,
    confirmOrder,
    markAsReceived,
    markAsManuallyPaid,
    fetchOrderPayments,
    deleteManualPayment,

    // Utilitaires
    getStockWithForecasted,
    setCurrentOrder,
  };
}
