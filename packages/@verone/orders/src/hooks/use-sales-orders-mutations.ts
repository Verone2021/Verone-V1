'use client';

/**
 * Sales Orders — Status/lifecycle mutations (updateOrder, updateStatus, shipItems, deleteOrder)
 * Internal helper for use-sales-orders.ts orchestrator
 */

import { useCallback } from 'react';

import type {
  SalesOrderStatus,
  SalesOrder,
  UpdateSalesOrderData,
  ShipItemData,
} from './types/sales-order.types';
import { validateStatusTransition } from './utils/sales-order-fsm';
import {
  useSalesOrdersWriteMutations,
  type WriteMutationDeps,
} from './use-sales-orders-mutations-write';

export interface MutationDeps extends WriteMutationDeps {
  setCurrentOrder: (order: SalesOrder | null) => void;
}

export function useSalesOrdersMutations({
  supabase,
  toastRef,
  setLoading,
  setCurrentOrder,
  fetchOrders,
  fetchOrder,
  currentOrderRef,
  checkStockAvailability,
  getAvailableStock,
}: MutationDeps) {
  const { createOrder, updateOrderWithItems } = useSalesOrdersWriteMutations({
    supabase,
    toastRef,
    setLoading,
    fetchOrders,
    fetchOrder,
    currentOrderRef,
    checkStockAvailability,
    getAvailableStock,
  });

  const updateOrder = useCallback(
    async (orderId: string, data: UpdateSalesOrderData) => {
      setLoading(true);
      try {
        // [BO-FIN-009 Phase 3 — R6 finance.md] Aucun champ modifiable hors draft.
        // Pour corriger : dévalider (validated → draft), modifier, revalider.
        const { data: existing, error: fetchError } = await supabase
          .from('sales_orders')
          .select('status, order_number')
          .eq('id', orderId)
          .single();
        if (fetchError) throw fetchError;
        if (!existing) throw new Error('Commande non trouvée');
        const existingOrder = existing as unknown as {
          status: string | null;
          order_number: string;
        };
        if (existingOrder.status !== 'draft') {
          throw new Error(
            `Commande ${existingOrder.order_number} en statut "${existingOrder.status ?? 'inconnu'}" : dévalidez-la d'abord (retour en brouillon) pour modifier, puis revalidez-la après modification.`
          );
        }

        const { error } = await supabase
          .from('sales_orders')
          .update(data)
          .eq('id', orderId);
        if (error) throw error;

        toastRef.current({
          title: 'Succès',
          description: 'Commande mise à jour avec succès',
        });
        await fetchOrders();
        if (currentOrderRef.current?.id === orderId) await fetchOrder(orderId);
      } catch (error: unknown) {
        console.error('Erreur lors de la mise à jour:', error);
        toastRef.current({
          title: 'Erreur',
          description:
            error instanceof Error
              ? error.message
              : 'Impossible de mettre à jour la commande',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, fetchOrders, fetchOrder, currentOrderRef, toastRef, setLoading]
  );

  const updateStatus = useCallback(
    async (orderId: string, newStatus: SalesOrderStatus) => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.id) throw new Error('Utilisateur non authentifié');

        const { data: currentOrderData, error: fetchError } = await supabase
          .from('sales_orders')
          .select('status')
          .eq('id', orderId)
          .single();
        if (fetchError) throw fetchError;
        if (!currentOrderData) throw new Error('Commande introuvable');

        const currentStatus = currentOrderData.status as SalesOrderStatus;
        validateStatusTransition(currentStatus, newStatus);

        if (currentStatus === 'validated' && newStatus === 'draft') {
          const { data: items } = await supabase
            .from('sales_order_items')
            .select('quantity_shipped')
            .eq('sales_order_id', orderId);
          if (items?.some(item => (item.quantity_shipped ?? 0) > 0)) {
            throw new Error(
              'Impossible de dévalider : des expéditions ont déjà été effectuées'
            );
          }
          const { data: invoices } = await supabase
            .from('financial_documents')
            .select('id, document_number, status')
            .eq('sales_order_id', orderId)
            .eq('document_type', 'customer_invoice')
            .in('status', ['sent', 'paid'])
            .is('deleted_at', null)
            .limit(1);
          if (invoices && invoices.length > 0) {
            const inv = invoices[0];
            throw new Error(
              `Impossible de dévalider : la facture ${inv.document_number} est ${inv.status === 'paid' ? 'payée' : 'définitive'}. Créez d'abord un avoir pour annuler cette facture.`
            );
          }
        }

        const updateFields: Record<string, string | null> = {
          status: newStatus,
          updated_at: new Date().toISOString(),
        };
        if (newStatus === 'draft') {
          updateFields.confirmed_at = null;
          updateFields.confirmed_by = null;
        }

        const { error: updateError } = await supabase
          .from('sales_orders')
          .update(updateFields)
          .eq('id', orderId);
        if (updateError)
          throw new Error(
            updateError.message ?? 'Erreur lors de la mise à jour du statut'
          );

        if (newStatus === 'cancelled' || newStatus === 'draft') {
          const userId = (await supabase.auth.getUser()).data.user?.id;
          await supabase
            .from('stock_reservations')
            .update({
              released_at: new Date().toISOString(),
              released_by: userId,
            })
            .eq('reference_type', 'sales_order')
            .eq('reference_id', orderId)
            .is('released_at', null);
        }

        toastRef.current({
          title: 'Succès',
          description: `Commande marquée comme ${newStatus}`,
        });
        await fetchOrders();
        if (currentOrderRef.current?.id === orderId) await fetchOrder(orderId);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('stock-alerts-refresh'));
        }
      } catch (error: unknown) {
        console.error('Erreur lors du changement de statut:', error);
        toastRef.current({
          title: 'Erreur',
          description:
            error instanceof Error
              ? error.message
              : 'Impossible de changer le statut',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, fetchOrders, fetchOrder, currentOrderRef, toastRef, setLoading]
  );

  const shipItems = useCallback(
    async (orderId: string, itemsToShip: ShipItemData[]) => {
      setLoading(true);
      try {
        for (const item of itemsToShip) {
          const itemResult = await supabase
            .from('sales_order_items')
            .select('quantity_shipped')
            .eq('id', item.item_id)
            .single();
          if (itemResult.error) throw itemResult.error;
          const currentShipped =
            (itemResult.data as unknown as { quantity_shipped: number | null })
              .quantity_shipped ?? 0;
          const { error: updateError } = await supabase
            .from('sales_order_items')
            .update({
              quantity_shipped: currentShipped + item.quantity_shipped,
            })
            .eq('id', item.item_id);
          if (updateError) throw updateError;
        }

        const checkResult = await supabase
          .from('sales_order_items')
          .select('quantity, quantity_shipped')
          .eq('sales_order_id', orderId);
        if (checkResult.error) throw checkResult.error;

        const orderItems = checkResult.data as unknown as Array<{
          quantity: number;
          quantity_shipped: number;
        }> | null;
        const isFullyShipped = orderItems?.every(
          item => item.quantity_shipped >= item.quantity
        );
        const isPartiallyShipped = orderItems?.some(
          item => item.quantity_shipped > 0
        );

        let newStatus: SalesOrderStatus = 'validated';
        if (isFullyShipped) newStatus = 'shipped';
        else if (isPartiallyShipped) newStatus = 'partially_shipped';

        await updateStatus(orderId, newStatus);
        toastRef.current({
          title: 'Succès',
          description: 'Expédition enregistrée avec succès',
        });
      } catch (error: unknown) {
        console.error("Erreur lors de l'expédition:", error);
        toastRef.current({
          title: 'Erreur',
          description:
            error instanceof Error
              ? error.message
              : "Impossible d'enregistrer l'expédition",
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, updateStatus, toastRef, setLoading]
  );

  const deleteOrder = useCallback(
    async (orderId: string) => {
      setLoading(true);
      try {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        await supabase
          .from('stock_reservations')
          .update({
            released_at: new Date().toISOString(),
            released_by: userId,
          })
          .eq('reference_type', 'sales_order')
          .eq('reference_id', orderId)
          .is('released_at', null);

        const { data: order, error: fetchError } = await supabase
          .from('sales_orders')
          .select('status')
          .eq('id', orderId)
          .single();
        if (fetchError) throw fetchError;
        if (order.status !== 'draft' && order.status !== 'cancelled')
          throw new Error(
            'Seules les commandes en brouillon ou annulées peuvent être supprimées'
          );

        const { data, error } = await supabase
          .from('sales_orders')
          .delete()
          .eq('id', orderId)
          .select('id');
        if (error) throw error;
        if (!data || data.length === 0)
          throw new Error(
            'Impossible de supprimer : permissions insuffisantes (RLS policy).'
          );

        toastRef.current({
          title: 'Succès',
          description: 'Commande supprimée avec succès',
        });
        await fetchOrders();
        if (currentOrderRef.current?.id === orderId) setCurrentOrder(null);
      } catch (error: unknown) {
        console.error('Erreur lors de la suppression:', error);
        toastRef.current({
          title: 'Erreur',
          description:
            error instanceof Error
              ? error.message
              : 'Impossible de supprimer la commande',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [
      supabase,
      fetchOrders,
      currentOrderRef,
      setCurrentOrder,
      toastRef,
      setLoading,
    ]
  );

  return {
    createOrder,
    updateOrder,
    updateOrderWithItems,
    updateStatus,
    shipItems,
    deleteOrder,
  };
}
