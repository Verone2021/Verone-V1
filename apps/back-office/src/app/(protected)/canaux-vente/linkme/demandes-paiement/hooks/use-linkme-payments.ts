'use client';

/**
 * Hooks TanStack Query — Paiements LinkMe (back-office)
 * Gère l'ajout de virements partiels et l'historique des virements.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

// ============================================================================
// Types
// ============================================================================

export interface PaymentHistoryItem {
  id: string;
  amountTTC: number;
  paymentReference: string;
  paymentDate: string;
  notes: string | null;
  paidBy: string | null;
  createdAt: string;
}

export interface AddPaymentInput {
  payment_request_id: string;
  amount_ttc: number;
  payment_reference: string;
  payment_date: string;
  notes?: string;
}

interface LinkResult {
  linked: boolean;
  reason?: string;
}

// ============================================================================
// usePaymentHistory — liste des virements d'une demande
// ============================================================================

export function usePaymentHistory(requestId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['linkme-payment-history', requestId],
    queryFn: async (): Promise<PaymentHistoryItem[]> => {
      if (!requestId) return [];

      const { data, error } = await supabase
        .from('linkme_payments')
        .select(
          'id, amount_ttc, payment_reference, payment_date, notes, paid_by, created_at'
        )
        .eq('payment_request_id', requestId)
        .order('payment_date', { ascending: true });

      if (error) {
        console.error('[usePaymentHistory] fetch error:', error);
        throw error;
      }

      return (data ?? []).map(row => ({
        id: row.id,
        amountTTC: row.amount_ttc,
        paymentReference: row.payment_reference,
        paymentDate: row.payment_date,
        notes: row.notes,
        paidBy: row.paid_by,
        createdAt: row.created_at,
      }));
    },
    enabled: !!requestId,
    staleTime: 60_000,
  });
}

// ============================================================================
// useAddPayment — insère un virement dans linkme_payments
// Le trigger DB recompute_payment_request_status recalcule le statut tout seul.
// ============================================================================

export function useAddPayment() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (input: AddPaymentInput): Promise<LinkResult> => {
      // 1. Récupérer l'auth user pour paid_by
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 2. Insérer le virement — le trigger DB se charge du reste
      const { error: insertError } = await supabase
        .from('linkme_payments')
        .insert({
          payment_request_id: input.payment_request_id,
          amount_ttc: input.amount_ttc,
          payment_reference: input.payment_reference,
          payment_date: input.payment_date,
          notes: input.notes ?? null,
          paid_by: user?.id ?? null,
        });

      if (insertError) {
        console.error('[useAddPayment] insert error:', insertError);
        throw insertError;
      }

      // 3. Tentative de rapprochement bancaire (best-effort, n'échoue pas)
      if (input.payment_reference.trim()) {
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          'link_linkme_payment_to_bank_transaction',
          {
            p_payment_request_id: input.payment_request_id,
            p_payment_reference: input.payment_reference.trim(),
          }
        );

        if (rpcError) {
          console.error(
            '[useAddPayment] reconciliation RPC error (non-blocking):',
            rpcError
          );
          return { linked: false, reason: 'rpc_error' };
        }

        // Le RPC renvoie un jsonb { linked, reason, ... }
        if (rpcData && typeof rpcData === 'object' && !Array.isArray(rpcData)) {
          const obj = rpcData as Record<string, unknown>;
          return {
            linked: Boolean(obj.linked),
            reason: typeof obj.reason === 'string' ? obj.reason : undefined,
          };
        }
        return { linked: false };
      }

      return { linked: false, reason: 'no_reference' };
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['admin-payment-requests'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['admin-payment-request-detail'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['linkme-payment-history', variables.payment_request_id],
      });
    },
  });
}
