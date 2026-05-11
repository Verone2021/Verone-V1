import { useToast } from '@verone/common';

import type { SalesOrder } from '../../../hooks/use-sales-orders';

/**
 * Déclenche un refetch de la liste via le CustomEvent écouté par useFetchOrdersList.
 * Plus découplé que passer fetchOrders en prop — évite les doubles appels.
 */
function dispatchOrdersRefetch(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('verone:orders:refetch'));
}

interface UseSalesOrdersSuccessHandlersParams {
  channelId: string | null;
  /**
   * @deprecated [BO-PERF-ORDERS-002] fetchOrders n'est plus appelé ici pour les
   * actions create/edit/ship — les hooks profonds (mutations, write) le font déjà.
   * Supprimer ce doublon évite 7 requêtes × N actions par session.
   * Conservé dans la signature pour rétrocompatibilité avec SalesOrdersTable.
   */
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
  // fetchOrders reçu mais non utilisé ici — voir jsdoc @deprecated ci-dessus.
  // Les hooks profonds (createOrder, updateOrderWithItems, updateStatus, shipItems)
  // appellent déjà fetchOrders en interne. Appeler fetchOrders ici causerait
  // un double refetch (7 requêtes × 2 = 14 requêtes) inutile.
  fetchOrders: _fetchOrders,
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

  // [BO-PERF-ORDERS-002] shipItems → updateStatus → fetchOrders() est déjà déclenché
  // dans le hook profond use-sales-orders-mutations.ts. Ne pas re-appeler fetchOrders ici.
  const handleShipmentSuccess = () => {
    setShowShipmentModal(false);
    setOrderToShip(null);
    toast({
      title: 'Succes',
      description: 'Expedition enregistree avec succes',
    });
    onOrderUpdated?.();
  };

  // [BO-PERF-ORDERS-002] createOrder → fetchOrders() est déjà déclenché
  // dans le hook profond use-sales-orders-mutations-write.ts.
  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    onOrderCreated?.();
  };

  // [BO-PERF-ORDERS-002] updateOrderWithItems → fetchOrders() est déjà déclenché
  // dans le hook profond use-sales-orders-mutations-write.ts.
  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingOrderId(null);
    onOrderUpdated?.();
  };

  // [BO-PERF-ORDERS-002] lien transaction : aucun hook profond ne fetch ici.
  // On passe par le CustomEvent pour découpler et appeler fetchOrders() une seule fois
  // via le listener stable dans useFetchOrdersList (ref pattern).
  const handleLinkTransactionSuccess = () => {
    toast({
      title: 'Commande liee',
      description: 'La transaction a ete liee a la commande.',
    });
    dispatchOrdersRefetch();
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
