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

interface UseCancelOrderActionParams {
  channelId: string | null;
  orderToCancel: string | null;
  fetchOrders: (filters?: { channel_id: string }) => Promise<void>;
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
  channelId,
  orderToCancel,
  fetchOrders,
  fetchStats,
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

      const filters = channelId ? { channel_id: channelId } : undefined;
      await fetchOrders(filters);
      await fetchStats(filters);
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

      const filters = channelId ? { channel_id: channelId } : undefined;
      await fetchOrders(filters);
      await fetchStats(filters);
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
