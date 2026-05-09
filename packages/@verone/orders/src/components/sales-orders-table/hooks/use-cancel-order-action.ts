import { useToast } from '@verone/common';

// ----------------------------------------------------------------
// Types réponse API cancel (union stricte, zero any)
// Dupliqués ici pour éviter les imports circulaires.
// ----------------------------------------------------------------

export interface CancelApiDoc {
  id: string;
  documentType: 'customer_quote' | 'customer_invoice';
  documentNumber: string | null;
  qontoStatus: string;
}

export type CancelApiResponse =
  | { docsDeleted: number }
  | { reason: string; docsToDelete: CancelApiDoc[] }
  | { error: string };

// ----------------------------------------------------------------

/**
 * Déclenche un refetch de la liste via le CustomEvent écouté par useFetchOrdersList.
 * [BO-PERF-ORDERS-002] Remplace les appels directs fetchOrders(filters) + fetchStats(filters)
 * pour éviter de passer ces fonctions en prop et supprimer les risques de double-fetch.
 */
function dispatchOrdersRefetch(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('verone:orders:refetch'));
}

interface UseCancelOrderActionParams {
  channelId: string | null;
  orderToCancel: string | null;
  /**
   * @deprecated [BO-PERF-ORDERS-002] fetchOrders n'est plus appelé directement ici.
   * On passe par le CustomEvent 'verone:orders:refetch' pour éviter les props drilling
   * et garantir un seul refetch via le listener stable dans useFetchOrdersList.
   * Conservé dans la signature pour rétrocompatibilité avec l'appelant useSalesOrderActions.
   */
  fetchOrders: (filters?: { channel_id: string }) => Promise<void>;
  /**
   * @deprecated fetchStats is a no-op (cf. use-sales-orders-fetch.ts:236).
   */
  fetchStats: (filters?: { channel_id: string }) => Promise<void>;
  onOrderUpdated?: () => void;
  setShowCancelConfirmation: (v: boolean) => void;
  setOrderToCancel: (id: string | null) => void;
  setShowCancelGuardDialog: (v: boolean) => void;
  setCancelGuardData: (
    data: { reason: string; docsToDelete: CancelApiDoc[] } | null
  ) => void;
}

export function useCancelOrderAction({
  // fetchOrders, fetchStats et channelId reçus mais non utilisés —
  // voir jsdoc @deprecated ci-dessus. On passe par CustomEvent à la place.
  fetchOrders: _fetchOrders,
  fetchStats: _fetchStats,
  channelId: _channelId,
  orderToCancel,
  onOrderUpdated,
  setShowCancelConfirmation,
  setOrderToCancel,
  setShowCancelGuardDialog,
  setCancelGuardData,
}: UseCancelOrderActionParams) {
  const { toast } = useToast();

  const handleCancelConfirmed = async () => {
    if (!orderToCancel) return;
    try {
      const response = await fetch(
        `/api/sales-orders/${orderToCancel}/cancel`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ force: false }),
        }
      );

      if (response.status === 409) {
        const data = (await response.json()) as CancelApiResponse;
        if ('docsToDelete' in data) {
          setCancelGuardData({
            reason: data.reason,
            docsToDelete: data.docsToDelete,
          });
          setShowCancelGuardDialog(true);
          setShowCancelConfirmation(false);
        } else if ('error' in data) {
          toast({
            title: 'Erreur',
            description: data.error,
            variant: 'destructive',
          });
        }
        return;
      }

      if (
        response.status === 400 ||
        response.status === 401 ||
        response.status === 404
      ) {
        const data = (await response.json()) as CancelApiResponse;
        toast({
          title: 'Erreur',
          description:
            'error' in data ? data.error : "Impossible d'annuler la commande",
          variant: 'destructive',
        });
        return;
      }

      if (!response.ok) {
        throw new Error('Erreur serveur');
      }

      const data = (await response.json()) as CancelApiResponse;
      toast({
        title: 'Succes',
        description:
          'docsDeleted' in data && data.docsDeleted > 0
            ? `Commande annulee. ${data.docsDeleted} document(s) Qonto supprime(s).`
            : 'Commande annulee avec succes',
      });

      // [BO-PERF-ORDERS-002] Refetch via CustomEvent (listener stable dans useFetchOrdersList)
      // au lieu de fetchOrders(filters) + fetchStats(filters) (7+1 requêtes évitées ici).
      dispatchOrdersRefetch();
      onOrderUpdated?.();
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
      setShowCancelConfirmation(false);
      setOrderToCancel(null);
    }
  };

  const handleCancelGuardConfirmed = async () => {
    if (!orderToCancel) return;
    try {
      const response = await fetch(
        `/api/sales-orders/${orderToCancel}/cancel`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ force: true }),
        }
      );

      if (!response.ok) {
        const data = (await response.json()) as CancelApiResponse;
        throw new Error('error' in data ? data.error : 'Erreur serveur');
      }

      const data = (await response.json()) as CancelApiResponse;
      toast({
        title: 'Succes',
        description:
          'docsDeleted' in data
            ? `Commande annulee. ${data.docsDeleted} document(s) Qonto supprime(s).`
            : 'Commande annulee avec succes',
      });

      // [BO-PERF-ORDERS-002] Refetch via CustomEvent (même pattern que handleCancelConfirmed)
      dispatchOrdersRefetch();
      onOrderUpdated?.();
    } catch (error) {
      console.error('Erreur garde-fou annulation:', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error ? error.message : "Impossible d'annuler",
        variant: 'destructive',
      });
    } finally {
      setShowCancelGuardDialog(false);
      setCancelGuardData(null);
      setOrderToCancel(null);
    }
  };

  return { handleCancelConfirmed, handleCancelGuardConfirmed };
}
