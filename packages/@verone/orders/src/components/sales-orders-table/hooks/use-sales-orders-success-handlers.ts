import { useToast } from '@verone/common';

import type { SalesOrder } from '../../../hooks/use-sales-orders';

interface UseSalesOrdersSuccessHandlersParams {
  channelId: string | null;
  fetchOrders: (filters?: { channel_id: string }) => Promise<void>;
  /**
   * @deprecated fetchStats is a no-op (cf. use-sales-orders-fetch.ts:236).
   * Kept in the signature only to avoid breaking the SalesOrdersTable parent.
   */
  fetchStats?: (filters?: { channel_id: string }) => Promise<void>;
  onOrderCreated?: () => void;
  onOrderUpdated?: () => void;
  setShowCreateModal: (v: boolean) => void;
  setShowEditModal: (v: boolean) => void;
  setEditingOrderId: (id: string | null) => void;
  setShowShipmentModal: (v: boolean) => void;
  setOrderToShip: (order: SalesOrder | null) => void;
  setShowLinkTransactionModal: (v: boolean) => void;
  setSelectedOrderForLink: (order: SalesOrder | null) => void;
}

export function useSalesOrdersSuccessHandlers({
  channelId,
  fetchOrders,
  onOrderCreated,
  onOrderUpdated,
  setShowCreateModal,
  setShowEditModal,
  setEditingOrderId,
  setShowShipmentModal,
  setOrderToShip,
  setShowLinkTransactionModal,
  setSelectedOrderForLink,
}: UseSalesOrdersSuccessHandlersParams) {
  const { toast } = useToast();

  const handleShipmentSuccess = () => {
    setShowShipmentModal(false);
    setOrderToShip(null);
    const filters = channelId ? { channel_id: channelId } : undefined;
    void fetchOrders(filters).catch((err: unknown) => {
      console.error('[SalesOrdersTable] fetchOrders failed:', err);
    });
    toast({
      title: 'Succes',
      description: 'Expedition enregistree avec succes',
    });
    onOrderUpdated?.();
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    const filters = channelId ? { channel_id: channelId } : undefined;
    void fetchOrders(filters).catch((err: unknown) => {
      console.error('[SalesOrdersTable] fetchOrders failed:', err);
    });
    onOrderCreated?.();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingOrderId(null);
    const filters = channelId ? { channel_id: channelId } : undefined;
    void fetchOrders(filters).catch((err: unknown) => {
      console.error('[SalesOrdersTable] fetchOrders failed:', err);
    });
    onOrderUpdated?.();
  };

  const handleLinkTransactionSuccess = () => {
    toast({
      title: 'Commande liee',
      description: 'La transaction a ete liee a la commande.',
    });
    const filters = channelId ? { channel_id: channelId } : undefined;
    void fetchOrders(filters).catch((err: unknown) => {
      console.error('[SalesOrdersTable] fetchOrders failed:', err);
    });
    setShowLinkTransactionModal(false);
    setSelectedOrderForLink(null);
  };

  return {
    handleShipmentSuccess,
    handleCreateSuccess,
    handleEditSuccess,
    handleLinkTransactionSuccess,
  };
}
