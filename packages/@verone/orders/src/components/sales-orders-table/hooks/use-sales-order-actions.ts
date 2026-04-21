import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useSearchParams, useRouter } from 'next/navigation';

import { useToast } from '@verone/common';
import { createClient } from '@verone/utils/supabase/client';

import type {
  SalesOrder,
  SalesOrderStatus,
} from '../../../hooks/use-sales-orders';
import type { CancelApiDoc } from './use-cancel-order-action';
import { useCancelOrderAction } from './use-cancel-order-action';

// ----------------------------------------------------------------

interface UseSalesOrderActionsParams {
  channelId: string | null;
  preloadedOrders: SalesOrder[] | undefined;
  orders: SalesOrder[];
  fetchOrders: (filters?: { channel_id: string }) => Promise<void>;
  fetchStats: (filters?: { channel_id: string }) => Promise<void>;
  updateStatus: (orderId: string, newStatus: SalesOrderStatus) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  updateStatusAction?: (
    orderId: string,
    newStatus: SalesOrderStatus,
    userId: string
  ) => Promise<{ success: boolean; error?: string }>;
  onOrderUpdated?: () => void;
  // Modal state needed by URL-based auto-open + close
  showOrderDetail: boolean;
  dismissedOrderId: string | null;
  setSelectedOrder: (order: SalesOrder | null) => void;
  setShowOrderDetail: (v: boolean) => void;
  setDismissedOrderId: (id: string | null) => void;
  // Confirmation modal state
  setShowValidateConfirmation: (v: boolean) => void;
  setOrderToValidate: (id: string | null) => void;
  setShowDevalidateConfirmation: (v: boolean) => void;
  setOrderToDevalidate: (id: string | null) => void;
  orderToValidate: string | null;
  orderToDevalidate: string | null;
  orderToDelete: string | null;
  orderToCancel: string | null;
  setShowDeleteConfirmation: (v: boolean) => void;
  setOrderToDelete: (id: string | null) => void;
  setShowCancelConfirmation: (v: boolean) => void;
  setOrderToCancel: (id: string | null) => void;
  // Cancel guard modal state
  setShowCancelGuardDialog: (v: boolean) => void;
  setCancelGuardData: (
    data: { reason: string; docsToDelete: CancelApiDoc[] } | null
  ) => void;
}

export function useSalesOrderActions({
  channelId,
  preloadedOrders,
  orders,
  fetchOrders,
  fetchStats,
  updateStatus,
  deleteOrder,
  updateStatusAction,
  onOrderUpdated,
  showOrderDetail,
  dismissedOrderId,
  setSelectedOrder,
  setShowOrderDetail,
  setDismissedOrderId,
  setShowValidateConfirmation,
  setOrderToValidate,
  setShowDevalidateConfirmation,
  setOrderToDevalidate,
  orderToValidate,
  orderToDevalidate,
  orderToDelete,
  orderToCancel,
  setShowDeleteConfirmation,
  setOrderToDelete,
  setShowCancelConfirmation,
  setOrderToCancel,
  setShowCancelGuardDialog,
  setCancelGuardData,
}: UseSalesOrderActionsParams) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // FIX: Refs stables pour eviter re-fetch en StrictMode
  const fetchOrdersRef = useRef(fetchOrders);
  fetchOrdersRef.current = fetchOrders;
  const fetchStatsRef = useRef(fetchStats);
  fetchStatsRef.current = fetchStats;

  // Fetch initial avec filtre canal (StrictMode safe + retry on total failure)
  useEffect(() => {
    // OPTIMISE: Ne pas fetch si preloadedOrders fourni (evite double fetch)
    if (preloadedOrders) return;

    let stale = false;
    const filters = channelId ? { channel_id: channelId } : undefined;

    // Retry logic: if fetchOrders fails completely (main query), retry up to 2 times with 3s delay
    const fetchWithRetry = async (retries = 2) => {
      try {
        await fetchOrdersRef.current(filters);
      } catch (err: unknown) {
        console.error(
          `[SalesOrdersTable] fetchOrders failed (retries left: ${retries}):`,
          err
        );
        if (retries > 0 && !stale) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          if (!stale) {
            await fetchWithRetry(retries - 1);
          }
        }
      }
    };

    if (!stale) {
      void fetchWithRetry().catch((err: unknown) => {
        console.error(
          '[SalesOrdersTable] fetchOrders failed after retries:',
          err
        );
      });
      void fetchStatsRef.current(filters).catch((err: unknown) => {
        console.error('[SalesOrdersTable] fetchStats failed:', err);
      });
    }
    return () => {
      stale = true;
    };
  }, [channelId, preloadedOrders]);

  // Ouvrir automatiquement le modal si query param ?id= present
  useEffect(() => {
    const orderId = searchParams.get('id');
    if (
      orderId &&
      orders.length > 0 &&
      !showOrderDetail &&
      orderId !== dismissedOrderId
    ) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setShowOrderDetail(true);
      }
    }
  }, [
    searchParams,
    orders,
    showOrderDetail,
    dismissedOrderId,
    setSelectedOrder,
    setShowOrderDetail,
  ]);

  // Fermeture du modal detail : nettoyer ?id= de l'URL pour eviter la boucle de reouverture
  const handleCloseOrderDetail = useCallback(() => {
    setShowOrderDetail(false);
    setSelectedOrder(null);
    const orderId = searchParams.get('id');
    if (orderId) {
      setDismissedOrderId(orderId);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('id');
      const newUrl = params.toString()
        ? `?${params.toString()}`
        : window.location.pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [
    searchParams,
    router,
    setShowOrderDetail,
    setSelectedOrder,
    setDismissedOrderId,
  ]);

  const handleStatusChange = async (
    orderId: string,
    newStatus: SalesOrderStatus
  ) => {
    if (newStatus === 'validated') {
      setOrderToValidate(orderId);
      setShowValidateConfirmation(true);
      return;
    }

    if (newStatus === 'draft') {
      setOrderToDevalidate(orderId);
      setShowDevalidateConfirmation(true);
      return;
    }

    try {
      await updateStatus(orderId, newStatus);
      toast({
        title: 'Succes',
        description: 'Commande mise a jour avec succes',
      });
      onOrderUpdated?.();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  const handleDevalidateConfirmed = async () => {
    if (!orderToDevalidate) return;

    try {
      await updateStatus(orderToDevalidate, 'draft');
      toast({
        title: 'Succes',
        description:
          'Commande devalidee avec succes. Elle est de nouveau en brouillon.',
      });
      onOrderUpdated?.();
    } catch (error) {
      console.error('Erreur lors de la devalidation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de devalider la commande',
        variant: 'destructive',
      });
    } finally {
      setShowDevalidateConfirmation(false);
      setOrderToDevalidate(null);
    }
  };

  const handleValidateConfirmed = async () => {
    if (!orderToValidate) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        throw new Error('Utilisateur non authentifie');
      }

      // Utiliser la Server Action si fournie, sinon le hook
      if (updateStatusAction) {
        const result = await updateStatusAction(
          orderToValidate,
          'validated',
          user.id
        );
        if (!result.success) {
          throw new Error(result.error ?? 'Erreur lors de la validation');
        }
      } else {
        await updateStatus(orderToValidate, 'validated');
      }

      toast({
        title: 'Succes',
        description: 'Commande validee avec succes',
      });

      setShowValidateConfirmation(false);
      setOrderToValidate(null);

      // Rafraichir la liste
      const filters = channelId ? { channel_id: channelId } : undefined;
      await fetchOrders(filters);
      onOrderUpdated?.();
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de valider la commande',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!orderToDelete) return;
    try {
      await deleteOrder(orderToDelete);
      onOrderUpdated?.();
      toast({
        title: 'Succes',
        description: 'Commande supprimee avec succes',
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de supprimer la commande',
        variant: 'destructive',
      });
    } finally {
      setShowDeleteConfirmation(false);
      setOrderToDelete(null);
    }
  };

  const { handleCancelConfirmed, handleCancelGuardConfirmed } =
    useCancelOrderAction({
      channelId,
      orderToCancel,
      fetchOrders,
      fetchStats,
      onOrderUpdated,
      setShowCancelConfirmation,
      setOrderToCancel,
      setShowCancelGuardDialog,
      setCancelGuardData,
    });

  return {
    handleCloseOrderDetail,
    handleStatusChange,
    handleDevalidateConfirmed,
    handleValidateConfirmed,
    handleDeleteConfirmed,
    handleCancelConfirmed,
    handleCancelGuardConfirmed,
  };
}
