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
  /** Fichier PDF justificatif optionnel (max 10 Mo) */
  proofFile?: File;
  /** Métadonnées de la demande, utilisées pour l'email si la demande devient paid */
  requestMeta?: {
    totalAmountTTC: number;
    requestNumber: string;
    affiliateName: string;
    affiliateEmail: string;
  };
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

      // 2. Upload justificatif PDF si fourni (best-effort, n'échoue pas l'insert)
      let proofUrl: string | null = null;
      if (input.proofFile) {
        const file = input.proofFile;
        if (file.type !== 'application/pdf') {
          throw new Error('Seuls les fichiers PDF sont acceptés');
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('Le justificatif ne doit pas dépasser 10 Mo');
        }
        const timestamp = Date.now();
        const filePath = `${input.payment_request_id}/payment-proof-${timestamp.toString()}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('linkme-invoices')
          .upload(filePath, file, {
            contentType: 'application/pdf',
            upsert: false,
          });
        if (uploadError) {
          // Non-bloquant : on log mais on continue l'insert
          console.error(
            '[useAddPayment] proof upload error (non-blocking):',
            uploadError
          );
        } else {
          proofUrl = filePath;
        }
      }

      // 3. Insérer le virement — le trigger DB se charge du reste
      const { error: insertError } = await supabase
        .from('linkme_payments')
        .insert({
          payment_request_id: input.payment_request_id,
          amount_ttc: input.amount_ttc,
          payment_reference: input.payment_reference,
          payment_date: input.payment_date,
          notes: input.notes ?? null,
          paid_by: user?.id ?? null,
          payment_proof_url: proofUrl,
        });

      if (insertError) {
        console.error('[useAddPayment] insert error:', insertError);
        throw insertError;
      }

      // 4. Vérifier si la demande est désormais intégralement payée
      //    pour envoyer l'email de confirmation (best-effort)
      if (input.requestMeta?.affiliateEmail) {
        const { data: prRow } = await supabase
          .from('linkme_payment_requests' as 'linkme_affiliates')
          .select('status')
          .eq('id', input.payment_request_id)
          .limit(1)
          .returns<{ status: string }[]>();

        const newStatus = prRow?.[0]?.status;
        if (newStatus === 'paid' && input.requestMeta) {
          const meta = input.requestMeta;
          void fetch('/api/emails/payment-request-paid', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              affiliateName: meta.affiliateName,
              affiliateEmail: meta.affiliateEmail,
              requestNumber: meta.requestNumber,
              totalAmountTTC: meta.totalAmountTTC,
              paymentReference: input.payment_reference,
              paymentDate: input.payment_date,
            }),
          }).catch(err => {
            console.error(
              '[useAddPayment] email notification error (non-blocking):',
              err
            );
          });
        }
      }

      // 5. Tentative de rapprochement bancaire (best-effort, n'échoue pas)
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
