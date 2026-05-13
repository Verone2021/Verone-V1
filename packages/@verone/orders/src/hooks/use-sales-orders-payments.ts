'use client';

/**
 * Sales Orders — Payment operations (mark paid, manual payments, delete payment)
 * Internal helper for use-sales-orders.ts orchestrator
 */

import { useCallback } from 'react';

import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  ManualPaymentType,
  OrderPayment,
} from './types/sales-order.types';

type ToastFn = ReturnType<
  typeof import('@verone/common/hooks').useToast
>['toast'];

interface PaymentDeps {
  supabase: SupabaseClient;
  toastRef: { current: ToastFn };
  fetchOrders: () => Promise<void>;
  fetchOrder: (orderId: string) => Promise<unknown>;
  currentOrderRef: { readonly current: { id: string } | null };
}

export function useSalesOrdersPayments({
  supabase,
  toastRef,
  fetchOrders,
  fetchOrder,
  currentOrderRef,
}: PaymentDeps) {
  const markAsPaid = useCallback(
    async (orderId: string, amount?: number) => {
      try {
        const orderResult = await supabase
          .from('sales_orders')
          .select('total_ttc')
          .eq('id', orderId)
          .single();

        if (!orderResult.data) throw new Error('Commande non trouvée');

        const paidAmount =
          amount ??
          (orderResult.data as unknown as { total_ttc: number }).total_ttc;

        const { error } = await supabase.rpc('mark_payment_received', {
          p_order_id: orderId,
          p_amount: paidAmount,
        });

        if (error) throw error;

        toastRef.current({
          title: 'Succès',
          description: 'Paiement enregistré avec succès',
        });

        await fetchOrders();
        if (currentOrderRef.current?.id === orderId) {
          await fetchOrder(orderId);
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Erreur inconnue';
        console.error("Erreur lors de l'enregistrement du paiement:", error);
        toastRef.current({
          title: 'Erreur',
          description: message ?? "Impossible d'enregistrer le paiement",
          variant: 'destructive',
        });
        throw error;
      }
    },
    [supabase, fetchOrders, fetchOrder, currentOrderRef, toastRef]
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
      try {
        const { error: rpcError } = await supabase.rpc(
          'mark_payment_received',
          {
            p_order_id: orderId,
            p_amount: amount,
            p_payment_type: paymentType,
            p_reference: options?.reference ?? null,
            p_note: options?.note ?? null,
            p_date: options?.date?.toISOString() ?? null,
          }
        );

        if (rpcError) throw rpcError;

        const paymentLabels: Record<ManualPaymentType, string> = {
          cash: 'Espèces',
          check: 'Chèque',
          transfer_other: 'Virement autre banque',
          card: 'Carte bancaire',
          compensation: 'Compensation',
        };

        toastRef.current({
          title: 'Paiement manuel enregistré',
          description: `Type: ${paymentLabels[paymentType]} — ${amount.toFixed(2)} €`,
        });

        await fetchOrders();
        if (currentOrderRef.current?.id === orderId) {
          await fetchOrder(orderId);
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Erreur inconnue';
        console.error('Erreur lors du paiement manuel:', error);
        toastRef.current({
          title: 'Erreur',
          description: message ?? "Impossible d'enregistrer le paiement manuel",
          variant: 'destructive',
        });
        throw error;
      }
    },
    [supabase, fetchOrders, fetchOrder, currentOrderRef, toastRef]
  );

  const fetchOrderPayments = useCallback(
    async (orderId: string): Promise<OrderPayment[]> => {
      const { data, error } = await supabase
        .from('order_payments')
        .select(
          'id, payment_type, amount, payment_date, reference, note, created_at'
        )
        .eq('sales_order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching order payments:', error);
        return [];
      }
      return (data ?? []) as OrderPayment[];
    },
    [supabase]
  );

  const deleteManualPayment = useCallback(
    async (paymentId: string) => {
      const { error } = await supabase.rpc('delete_order_payment', {
        p_payment_id: paymentId,
      });

      if (error) {
        console.error('Error deleting payment:', error);
        toastRef.current({
          title: 'Erreur',
          description: 'Impossible de supprimer le paiement',
          variant: 'destructive',
        });
        throw error;
      }

      toastRef.current({
        title: 'Paiement supprimé',
        description: 'Le paiement manuel a été supprimé',
      });

      await fetchOrders();
    },
    [supabase, fetchOrders, toastRef]
  );

  return {
    markAsPaid,
    markAsManuallyPaid,
    fetchOrderPayments,
    deleteManualPayment,
  };
}
