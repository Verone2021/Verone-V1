'use client';

/**
 * Hooks TanStack Query — Paiements LinkMe (back-office)
 * Gère le détail d'une demande, les items/commissions liés,
 * l'ajout de virements partiels et l'historique des virements.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';
import type { PaymentRequestStatus } from '../_components/types';

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
// Types — Détail de la demande
// ============================================================================

export interface PaymentRequestDetail {
  id: string;
  request_number: string;
  affiliate_id: string;
  affiliate_name: string;
  affiliate_email: string;
  total_amount_ht: number;
  total_amount_ttc: number;
  status: PaymentRequestStatus;
  invoice_received: boolean;
  invoice_file_name: string | null;
  invoice_received_at: string | null;
  financial_document_id: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  created_at: string;
  notes: string | null;
}

export interface CommissionRow {
  order_number: string;
  order_date: string | null;
  order_amount_ht: number;
  total_payout_ht: number;
  total_payout_ttc: number;
}

interface PRRaw {
  id: string;
  request_number: string;
  affiliate_id: string;
  total_amount_ht: number;
  total_amount_ttc: number;
  status: string;
  invoice_received: boolean;
  invoice_file_name: string | null;
  invoice_received_at: string | null;
  financial_document_id: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  created_at: string;
  notes: string | null;
  linkme_affiliates: {
    display_name: string;
    email: string | null;
  } | null;
}

interface ItemRow {
  commission_amount_ttc: number;
  linkme_commissions: {
    order_number: string;
    order_date: string | null;
    order_amount_ht: number;
    total_payout_ht: number;
    total_payout_ttc: number;
  } | null;
}

// ============================================================================
// usePaymentRequestDetail — détail complet d'une demande (header)
// ============================================================================

export function usePaymentRequestDetail(id: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-payment-request-detail', id],
    queryFn: async (): Promise<PaymentRequestDetail> => {
      if (!id) throw new Error('Missing id');

      const { data: prRows, error: prError } = await supabase
        .from('linkme_payment_requests')
        .select(
          `id, request_number, affiliate_id, total_amount_ht, total_amount_ttc, status,
           invoice_received, invoice_file_name, invoice_received_at, financial_document_id,
           payment_reference, paid_at, created_at, notes,
           linkme_affiliates ( display_name, email )`
        )
        .eq('id', id)
        .limit(1)
        .returns<PRRaw[]>();

      if (prError) throw prError;

      const raw = prRows?.[0];
      if (!raw) throw new Error('Not found');

      return {
        id: raw.id,
        request_number: raw.request_number,
        affiliate_id: raw.affiliate_id,
        affiliate_name: raw.linkme_affiliates?.display_name ?? 'Affilié',
        affiliate_email: raw.linkme_affiliates?.email ?? '',
        total_amount_ht: raw.total_amount_ht ?? 0,
        total_amount_ttc: raw.total_amount_ttc ?? 0,
        status: raw.status as PaymentRequestStatus,
        invoice_received: raw.invoice_received ?? false,
        invoice_file_name: raw.invoice_file_name,
        invoice_received_at: raw.invoice_received_at,
        financial_document_id: raw.financial_document_id,
        payment_reference: raw.payment_reference,
        paid_at: raw.paid_at,
        created_at: raw.created_at,
        notes: raw.notes,
      };
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

// ============================================================================
// usePaymentRequestCommissions — commissions/items liés à une demande
// ============================================================================

export function usePaymentRequestCommissions(id: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-payment-request-commissions', id],
    queryFn: async (): Promise<CommissionRow[]> => {
      if (!id) return [];

      const { data: itemsData, error: itemsError } = await supabase
        .from('linkme_payment_request_items')
        .select(
          `commission_amount_ttc,
           linkme_commissions (
             order_number, order_date, order_amount_ht,
             total_payout_ht, total_payout_ttc
           )`
        )
        .eq('payment_request_id', id)
        .returns<ItemRow[]>();

      if (itemsError) throw itemsError;

      return (itemsData ?? [])
        .filter(r => r.linkme_commissions !== null)
        .map(r => r.linkme_commissions as CommissionRow)
        .sort((a, b) => (a.order_date ?? '').localeCompare(b.order_date ?? ''));
    },
    enabled: !!id,
    staleTime: 60_000,
  });
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
          .from('linkme_payment_requests')
          .select('status')
          .eq('id', input.payment_request_id)
          .limit(1);

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
