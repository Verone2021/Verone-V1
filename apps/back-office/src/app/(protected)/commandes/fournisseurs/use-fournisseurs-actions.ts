'use client';

import type { PurchaseOrder, PurchaseOrderStatus } from '@verone/orders';
import { useToast } from '@verone/common';
import { createClient } from '@verone/utils/supabase/client';

import { updatePurchaseOrderStatus } from '@/app/actions/purchase-orders';

import type {
  ShortageDetail,
  CancelRemainderItem,
  PurchaseOrderRow,
} from './types';

// =====================================================================
// TYPES PARAMÈTRES
// =====================================================================

export interface FournisseursActionsState {
  currentUserId: string | null;
  orderToValidate: string | null;
  orderToDevalidate: string | null;
  orderToDelete: string | null;
  orderToCancel: string | null;
  shortageDetails: ShortageDetail[];
}

export interface FournisseursActionsSetters {
  setShowValidateConfirmation: (v: boolean) => void;
  setOrderToValidate: (v: string | null) => void;
  setShowDevalidateConfirmation: (v: boolean) => void;
  setOrderToDevalidate: (v: string | null) => void;
  setShowDeleteConfirmation: (v: boolean) => void;
  setOrderToDelete: (v: string | null) => void;
  setShowCancelConfirmation: (v: boolean) => void;
  setOrderToCancel: (v: string | null) => void;
  setShowShortageWarning: (v: boolean) => void;
  setShortageDetails: (v: ShortageDetail[]) => void;
  setShowEditModal: (v: boolean) => void;
  setOrderToEdit: (v: PurchaseOrderRow | null) => void;
  setShowReceptionModal: (v: boolean) => void;
  setShowOrderDetail: (v: boolean) => void;
  setSelectedOrder: (v: PurchaseOrder | null) => void;
  setInitialPaymentOpen: (v: boolean) => void;
  setShowCancelRemainderModal: (v: boolean) => void;
  setCancelRemainderOrder: (v: PurchaseOrder | null) => void;
  setCancelRemainderItems: (v: CancelRemainderItem[]) => void;
}

interface UseFournisseursActionsParams {
  state: FournisseursActionsState;
  setters: FournisseursActionsSetters;
  fetchOrders: () => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
}

// =====================================================================
// HOOK ACTIONS — handlers métier + navigation
// =====================================================================

export function useFournisseursActions({
  state,
  setters,
  fetchOrders,
  deleteOrder,
}: UseFournisseursActionsParams) {
  const { toast } = useToast();

  const checkOrderShortages = async (
    orderId: string
  ): Promise<ShortageDetail[]> => {
    const supabase = createClient();

    type OrderItemWithProduct = {
      id: string;
      quantity: number;
      products: {
        name: string;
        sku: string;
        min_stock: number | null;
        stock_real: number | null;
      } | null;
    };

    const { data: orderItems, error } = await supabase
      .from('purchase_order_items')
      .select('id, quantity, products ( name, sku, min_stock, stock_real )')
      .eq('purchase_order_id', orderId)
      .returns<OrderItemWithProduct[]>();

    if (error) {
      console.error('Erreur vérification shortages:', error);
      return [];
    }

    return (orderItems ?? [])
      .map(item => {
        const product = item.products;
        if (!product?.min_stock || product.min_stock === 0) return null;
        const stockReal = product.stock_real ?? 0;
        const besoin = Math.max(0, product.min_stock - stockReal);
        if (item.quantity >= besoin) return null;
        return {
          itemId: item.id,
          productName: product.name,
          sku: product.sku,
          quantityOrdered: item.quantity,
          minStock: product.min_stock,
          stockReal,
          shortage: besoin - item.quantity,
          newQuantity: besoin,
        };
      })
      .filter(Boolean) as ShortageDetail[];
  };

  const handleAutoAdjustQuantities = async () => {
    const { orderToValidate, shortageDetails } = state;
    if (!orderToValidate || shortageDetails.length === 0) return;
    const supabase = createClient();
    try {
      for (const item of shortageDetails) {
        const { error } = await supabase
          .from('purchase_order_items')
          .update({ quantity: item.newQuantity })
          .eq('id', item.itemId);
        if (error) throw error;
      }
      setters.setShowShortageWarning(false);
      setters.setShortageDetails([]);
      await fetchOrders();
      toast({
        title: 'Quantités ajustées',
        description: `${shortageDetails.length} produit(s) mis à jour pour atteindre les seuils minimum`,
      });
    } catch (error) {
      console.error('Erreur ajustement quantités:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'ajuster les quantités",
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (
    orderId: string,
    newStatus: PurchaseOrderStatus
  ) => {
    if (newStatus === 'validated') {
      const shortages = await checkOrderShortages(orderId);
      if (shortages.length > 0) {
        setters.setOrderToValidate(orderId);
        setters.setShortageDetails(shortages);
        setters.setShowShortageWarning(true);
        return;
      }
      setters.setOrderToValidate(orderId);
      setters.setShowValidateConfirmation(true);
      return;
    }
    if (newStatus === 'draft') {
      setters.setOrderToDevalidate(orderId);
      setters.setShowDevalidateConfirmation(true);
      return;
    }
    try {
      if (!state.currentUserId) {
        toast({
          title: 'Erreur',
          description: 'Utilisateur non authentifié',
          variant: 'destructive',
        });
        return;
      }
      const result = await updatePurchaseOrderStatus(
        orderId,
        newStatus,
        state.currentUserId
      );
      if (!result.success)
        throw new Error(result.error ?? 'Erreur lors de la mise à jour');
      toast({
        title: 'Succès',
        description: `Commande marquée comme ${newStatus}`,
      });
      await fetchOrders();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de changer le statut',
        variant: 'destructive',
      });
    }
  };

  const handleValidateConfirmed = async () => {
    if (!state.orderToValidate) return;
    try {
      if (!state.currentUserId) {
        toast({
          title: 'Erreur',
          description: 'Utilisateur non authentifié',
          variant: 'destructive',
        });
        return;
      }
      const result = await updatePurchaseOrderStatus(
        state.orderToValidate,
        'validated',
        state.currentUserId
      );
      if (!result.success)
        throw new Error(result.error ?? 'Erreur lors de la confirmation');
      toast({
        title: 'Succès',
        description: 'Commande fournisseur confirmée avec succès',
      });
      setters.setShowValidateConfirmation(false);
      setters.setOrderToValidate(null);
      await fetchOrders();
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de confirmer la commande',
        variant: 'destructive',
      });
    }
  };

  const handleDevalidateConfirmed = async () => {
    if (!state.orderToDevalidate) return;
    try {
      if (!state.currentUserId) {
        toast({
          title: 'Erreur',
          description: 'Utilisateur non authentifié',
          variant: 'destructive',
        });
        return;
      }
      const result = await updatePurchaseOrderStatus(
        state.orderToDevalidate,
        'draft',
        state.currentUserId
      );
      if (!result.success)
        throw new Error(result.error ?? 'Erreur lors de la devalidation');
      toast({
        title: 'Succès',
        description:
          'Commande fournisseur devalidee avec succes. Elle est de nouveau en brouillon.',
      });
      await fetchOrders();
    } catch (error) {
      console.error('Erreur lors de la devalidation:', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de devalider la commande',
        variant: 'destructive',
      });
    } finally {
      setters.setShowDevalidateConfirmation(false);
      setters.setOrderToDevalidate(null);
    }
  };

  const handleDelete = (orderId: string) => {
    setters.setOrderToDelete(orderId);
    setters.setShowDeleteConfirmation(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!state.orderToDelete) return;
    try {
      await deleteOrder(state.orderToDelete);
      toast({ title: 'Succès', description: 'Commande supprimée avec succès' });
      await fetchOrders();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la commande',
        variant: 'destructive',
      });
    } finally {
      setters.setShowDeleteConfirmation(false);
      setters.setOrderToDelete(null);
    }
  };

  const handleCancel = (orderId: string) => {
    setters.setOrderToCancel(orderId);
    setters.setShowCancelConfirmation(true);
  };

  const handleCancelConfirmed = async () => {
    if (!state.orderToCancel) return;
    try {
      if (!state.currentUserId) {
        toast({
          title: 'Erreur',
          description: 'Utilisateur non authentifié',
          variant: 'destructive',
        });
        return;
      }
      const result = await updatePurchaseOrderStatus(
        state.orderToCancel,
        'cancelled',
        state.currentUserId
      );
      if (!result.success)
        throw new Error(result.error ?? "Erreur lors de l'annulation");
      toast({ title: 'Succès', description: 'Commande annulée avec succès' });
      await fetchOrders();
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : "Impossible d'annuler la commande",
        variant: 'destructive',
      });
    } finally {
      setters.setShowCancelConfirmation(false);
      setters.setOrderToCancel(null);
    }
  };

  // Navigation handlers
  const openOrderDetail = (order: PurchaseOrder) => {
    setters.setInitialPaymentOpen(false);
    setters.setSelectedOrder(order);
    setters.setShowOrderDetail(true);
  };

  const openOrderDetailWithPayment = (order: PurchaseOrder) => {
    setters.setInitialPaymentOpen(true);
    setters.setSelectedOrder(order);
    setters.setShowOrderDetail(true);
  };

  const openEditModal = (order: PurchaseOrder) => {
    setters.setOrderToEdit(order as PurchaseOrderRow);
    setters.setShowEditModal(true);
  };

  const openReceptionModal = (order: PurchaseOrder) => {
    setters.setSelectedOrder(order);
    setters.setShowReceptionModal(true);
  };

  const openCancelRemainderModal = (order: PurchaseOrder) => {
    const items = order.purchase_order_items ?? [];
    const remainderItems = items
      .filter(item => (item.quantity ?? 0) > (item.quantity_received ?? 0))
      .map(item => ({
        product_name: item.products?.name ?? 'Produit inconnu',
        product_sku: item.products?.sku ?? 'N/A',
        quantity_remaining:
          (item.quantity ?? 0) - (item.quantity_received ?? 0),
      }));
    setters.setCancelRemainderOrder(order);
    setters.setCancelRemainderItems(remainderItems);
    setters.setShowCancelRemainderModal(true);
  };

  return {
    handleStatusChange,
    handleAutoAdjustQuantities,
    handleValidateConfirmed,
    handleDevalidateConfirmed,
    handleDelete,
    handleDeleteConfirmed,
    handleCancel,
    handleCancelConfirmed,
    openOrderDetail,
    openOrderDetailWithPayment,
    openEditModal,
    openReceptionModal,
    openCancelRemainderModal,
  };
}
