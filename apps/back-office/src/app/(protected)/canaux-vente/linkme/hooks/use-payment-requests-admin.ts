/**
 * Hook: usePaymentRequestsAdmin
 * Module unique pour la gestion des demandes de versement côté back-office admin.
 * Consolidé en [BO-LINKME-PR-002] — remplace _components/hooks.ts (supprimé).
 *
 * @module use-payment-requests-admin
 * @since 2025-12-11 · consolidated 2026-05-13
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// Singleton client — pattern standard du repo (cf. use-linkme-enseigne-customers.ts)
// Évite de recréer le client à chaque appel de hook.
const supabase = createClient();

// ============================================================================
// Types
// ============================================================================

export type PaymentRequestStatus =
  | 'pending'
  | 'invoice_received'
  | 'partially_paid'
  | 'paid'
  | 'cancelled';

/** Format camelCase consommé par les composants _components/ */
export interface PaymentRequestAdmin {
  id: string;
  requestNumber: string;
  affiliateId: string;
  affiliateName: string;
  affiliateEmail: string;
  totalAmountHT: number;
  totalAmountTTC: number;
  status: PaymentRequestStatus;
  invoiceFileUrl: string | null;
  invoiceFileName: string | null;
  invoiceReceivedAt: string | null;
  paidAt: string | null;
  paymentReference: string | null;
  createdAt: string;
  /** Somme des paiements déjà enregistrés (calculée depuis linkme_payments) */
  alreadyPaidTTC: number;
}

interface PaymentRequestCounts {
  pending: number;
  invoice_received: number;
  partially_paid: number;
  total_pending: number; // pending + invoice_received + partially_paid
  paid: number;
  cancelled: number;
}

// Type brut retourné par Supabase
interface PaymentRequestRaw {
  id: string;
  request_number: string;
  affiliate_id: string;
  total_amount_ht: number;
  total_amount_ttc: number;
  status: string;
  invoice_file_url: string | null;
  invoice_file_name: string | null;
  invoice_received_at: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  created_at: string;
  linkme_affiliates: {
    display_name: string;
    email: string | null;
  } | null;
  linkme_payments: { amount_ttc: number }[];
}

// Type pour useRecentPaymentRequests (format snake_case étendu)
interface PaymentRequestSnake {
  id: string;
  affiliate_id: string;
  request_number: string;
  total_amount_ht: number;
  total_amount_ttc: number;
  tax_rate: number;
  status: PaymentRequestStatus;
  invoice_file_url: string | null;
  invoice_file_name: string | null;
  invoice_received_at: string | null;
  paid_at: string | null;
  paid_by: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  affiliate?: {
    display_name: string;
    email: string | null;
    enseigne_id: string | null;
    organisation_id: string | null;
  };
}

interface PaymentRequestSnakeRaw {
  id: string;
  affiliate_id: string;
  request_number: string;
  total_amount_ht: number;
  total_amount_ttc: number;
  tax_rate: number;
  status: string;
  invoice_file_url: string | null;
  invoice_file_name: string | null;
  invoice_received_at: string | null;
  paid_at: string | null;
  paid_by: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  linkme_affiliates: {
    display_name: string;
    email: string | null;
    enseigne_id: string | null;
    organisation_id: string | null;
  } | null;
}

/** Paiement individuel enregistré dans linkme_payments */
export interface PaymentRecord {
  id: string;
  amount_ttc: number;
  payment_reference: string;
  payment_date: string;
  payment_proof_url: string | null;
  notes: string | null;
  paid_by: string | null;
  created_at: string;
}

// ============================================================================
// Hook: Compter les demandes par statut (pour badge notification)
// ============================================================================

export function usePaymentRequestsCounts() {
  return useQuery({
    queryKey: ['payment-requests-counts'],
    queryFn: async (): Promise<PaymentRequestCounts> => {
      const { data, error } = await supabase
        .from('linkme_payment_requests')
        .select('status')
        .returns<{ status: string }[]>();

      if (error) {
        console.error('[usePaymentRequestsCounts] fetch error:', error);
        throw error;
      }

      const counts: PaymentRequestCounts = {
        pending: 0,
        invoice_received: 0,
        partially_paid: 0,
        total_pending: 0,
        paid: 0,
        cancelled: 0,
      };

      (data ?? []).forEach(item => {
        if (item.status === 'pending') counts.pending++;
        if (item.status === 'invoice_received') counts.invoice_received++;
        if (item.status === 'partially_paid') counts.partially_paid++;
        if (item.status === 'paid') counts.paid++;
        if (item.status === 'cancelled') counts.cancelled++;
      });

      counts.total_pending =
        counts.pending + counts.invoice_received + counts.partially_paid;

      return counts;
    },
    staleTime: 120_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}

// ============================================================================
// Hook: Liste complète des demandes (format camelCase pour la page admin)
// ============================================================================

export function usePaymentRequestsAdmin(
  statusFilter?: PaymentRequestStatus | 'all'
) {
  return useQuery({
    queryKey: ['payment-requests-admin', statusFilter],
    queryFn: async (): Promise<PaymentRequestAdmin[]> => {
      const baseQuery = supabase
        .from('linkme_payment_requests')
        .select(
          `
          id,
          request_number,
          affiliate_id,
          total_amount_ht,
          total_amount_ttc,
          status,
          invoice_file_url,
          invoice_file_name,
          invoice_received_at,
          paid_at,
          payment_reference,
          created_at,
          linkme_affiliates (
            display_name,
            email
          ),
          linkme_payments ( amount_ttc )
        `
        )
        .order('created_at', { ascending: false });

      const query =
        statusFilter && statusFilter !== 'all'
          ? baseQuery.eq('status', statusFilter)
          : baseQuery;

      const { data, error } = await query.returns<PaymentRequestRaw[]>();

      if (error) {
        console.error('[usePaymentRequestsAdmin] fetch error:', error);
        throw error;
      }

      return (data ?? []).map(item => {
        const affiliate = item.linkme_affiliates;
        const alreadyPaidTTC = (item.linkme_payments ?? []).reduce(
          (sum, p) => sum + (p.amount_ttc ?? 0),
          0
        );
        return {
          id: item.id,
          requestNumber: item.request_number,
          affiliateId: item.affiliate_id,
          affiliateName: affiliate?.display_name ?? 'Affilié',
          affiliateEmail: affiliate?.email ?? '',
          totalAmountHT: item.total_amount_ht ?? 0,
          totalAmountTTC: item.total_amount_ttc ?? 0,
          status: item.status as PaymentRequestStatus,
          invoiceFileUrl: item.invoice_file_url,
          invoiceFileName: item.invoice_file_name,
          invoiceReceivedAt: item.invoice_received_at,
          paidAt: item.paid_at,
          paymentReference: item.payment_reference,
          createdAt: item.created_at,
          alreadyPaidTTC,
        };
      });
    },
    staleTime: 300_000,
  });
}

// ============================================================================
// Hook: Demandes récentes pour dashboard (format snake_case étendu)
// ============================================================================

export function useRecentPaymentRequests(limit: number = 5) {
  return useQuery({
    queryKey: ['payment-requests-recent', limit],
    queryFn: async (): Promise<PaymentRequestSnake[]> => {
      const { data, error } = await supabase
        .from('linkme_payment_requests')
        .select(
          `
          id,
          affiliate_id,
          request_number,
          total_amount_ht,
          total_amount_ttc,
          tax_rate,
          status,
          invoice_file_url,
          invoice_file_name,
          invoice_received_at,
          paid_at,
          paid_by,
          payment_reference,
          notes,
          created_at,
          updated_at,
          linkme_affiliates (
            display_name,
            email,
            enseigne_id,
            organisation_id
          )
        `
        )
        .in('status', ['pending', 'invoice_received', 'partially_paid'])
        .order('created_at', { ascending: false })
        .limit(limit)
        .returns<PaymentRequestSnakeRaw[]>();

      if (error) {
        console.error('[useRecentPaymentRequests] fetch error:', error);
        throw error;
      }

      return (data ?? []).map(item => ({
        ...item,
        status: item.status as PaymentRequestStatus,
        affiliate: item.linkme_affiliates ?? undefined,
      }));
    },
    staleTime: 300_000,
  });
}

// ============================================================================
// Hook: Historique des paiements d'une demande
// ============================================================================

export function usePaymentHistory(requestId: string | null) {
  return useQuery({
    queryKey: ['payment-history', requestId],
    queryFn: async (): Promise<PaymentRecord[]> => {
      if (!requestId) return [];

      const { data, error } = await supabase
        .from('linkme_payments')
        .select(
          'id, amount_ttc, payment_reference, payment_date, payment_proof_url, notes, paid_by, created_at'
        )
        .eq('payment_request_id', requestId)
        .order('payment_date', { ascending: false })
        .order('created_at', { ascending: false })
        .returns<PaymentRecord[]>();

      if (error) {
        console.error('[usePaymentHistory] fetch error:', error);
        throw error;
      }

      return data ?? [];
    },
    enabled: !!requestId,
    staleTime: 60_000,
  });
}

// ============================================================================
// Mutation: Ajouter un paiement (INSERT linkme_payments)
// Le trigger DB recalcule automatiquement le statut de la demande.
// ============================================================================

interface AddPaymentInput {
  payment_request_id: string;
  amount_ttc: number;
  payment_reference: string;
  payment_date: string;
  payment_proof_url?: string;
  notes?: string;
}

export function useAddPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddPaymentInput): Promise<void> => {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase.from('linkme_payments').insert({
        payment_request_id: input.payment_request_id,
        amount_ttc: input.amount_ttc,
        payment_reference: input.payment_reference,
        payment_date: input.payment_date,
        payment_proof_url: input.payment_proof_url ?? null,
        notes: input.notes ?? null,
        paid_by: userData?.user?.id ?? null,
      });

      if (error) {
        console.error('[useAddPayment] insert error:', error);
        throw new Error("Erreur lors de l'enregistrement du paiement");
      }
      // Note: le statut de linkme_payment_requests est mis à jour automatiquement
      // par le trigger recompute_payment_request_status (AFTER INSERT ON linkme_payments).
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['payment-requests-admin'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['payment-requests-counts'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['payment-request-detail', variables.payment_request_id],
      });
      await queryClient.invalidateQueries({
        queryKey: ['payment-history', variables.payment_request_id],
      });
    },
  });
}

// ============================================================================
// Mutation: Supprimer un paiement (correction d'une saisie erronée)
// Le trigger recalcule automatiquement le statut de la demande.
// ============================================================================

interface DeletePaymentInput {
  paymentId: string;
  requestId: string;
}

export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeletePaymentInput): Promise<void> => {
      const { error } = await supabase
        .from('linkme_payments')
        .delete()
        .eq('id', input.paymentId);

      if (error) {
        console.error('[useDeletePayment] delete error:', error);
        throw new Error('Erreur lors de la suppression du paiement');
      }
      // Le trigger recompute_payment_request_status recalcule le statut.
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['payment-requests-admin'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['payment-requests-counts'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['payment-request-detail', variables.requestId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['payment-history', variables.requestId],
      });
    },
  });
}

// ============================================================================
// Mutation: Annuler une demande
// ============================================================================

export function useCancelPaymentRequestAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string): Promise<void> => {
      const { error } = await supabase
        .from('linkme_payment_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .in('status', ['pending', 'invoice_received']);

      if (error) {
        console.error('[useCancelPaymentRequestAdmin] error:', error);
        throw new Error("Erreur lors de l'annulation");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['payment-requests-admin'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['payment-requests-counts'],
      });
    },
  });
}

// ============================================================================
// Mutation: Créer une demande de paiement (Admin - au nom d'un affilié)
// ============================================================================

interface CreatePaymentRequestAdminInput {
  affiliateId: string;
  commissionIds: string[];
}

interface CommissionForPayment {
  id: string;
  affiliate_commission_ttc: number;
  affiliate_commission: number;
  total_payout_ht: number | null;
  total_payout_ttc: number | null;
  status: string;
}

function validateCommissions(
  commissions: CommissionForPayment[] | null,
  expectedCount: number
) {
  if (!commissions || commissions.length === 0) {
    throw new Error(
      'Aucune commission validée sélectionnée. Seules les commissions avec le statut "Validée" peuvent être demandées.'
    );
  }
  if (commissions.length !== expectedCount) {
    throw new Error(
      `Seules ${commissions.length} commission(s) sur ${expectedCount} sont éligibles (statut "Validée")`
    );
  }
}

function computePaymentTotals(commissions: CommissionForPayment[]) {
  const totalTTC = commissions.reduce(
    (sum, c) => sum + (c.total_payout_ttc ?? c.affiliate_commission_ttc ?? 0),
    0
  );
  const totalHT = commissions.reduce(
    (sum, c) => sum + (c.total_payout_ht ?? c.affiliate_commission ?? 0),
    0
  );
  return { totalHT, totalTTC };
}

async function createPaymentRequestFn(
  input: CreatePaymentRequestAdminInput
): Promise<PaymentRequestSnake> {
  const { affiliateId, commissionIds } = input;

  const { data: commissions, error: commError } = await supabase
    .from('linkme_commissions')
    .select(
      'id, affiliate_commission_ttc, affiliate_commission, total_payout_ht, total_payout_ttc, status'
    )
    .in('id', commissionIds)
    .eq('affiliate_id', affiliateId)
    .eq('status', 'validated')
    .returns<CommissionForPayment[]>();

  if (commError) {
    console.error('[createPaymentRequestFn] commissions error:', commError);
    throw new Error(
      'Erreur lors de la récupération des commissions sélectionnées'
    );
  }

  validateCommissions(commissions, commissionIds.length);
  const { totalHT, totalTTC } = computePaymentTotals(commissions);

  const { data: request, error: createError } = await supabase
    .from('linkme_payment_requests')
    .insert({
      affiliate_id: affiliateId,
      request_number: '',
      total_amount_ht: totalHT,
      total_amount_ttc: totalTTC,
      status: 'pending',
    })
    .select(
      'id, affiliate_id, request_number, total_amount_ht, total_amount_ttc, tax_rate, status, invoice_file_url, invoice_file_name, invoice_received_at, paid_at, paid_by, payment_reference, notes, created_at, updated_at'
    )
    .single()
    .returns<PaymentRequestSnakeRaw>();

  if (createError) {
    console.error('[createPaymentRequestFn] create error:', createError);
    throw new Error('Erreur lors de la création de la demande de versement');
  }

  const items = commissions.map(c => ({
    payment_request_id: request.id,
    commission_id: c.id,
    commission_amount_ttc:
      c.total_payout_ttc ?? c.affiliate_commission_ttc ?? 0,
  }));

  const { error: itemsError } = await supabase
    .from('linkme_payment_request_items')
    .insert(items);

  if (itemsError) {
    console.error('[createPaymentRequestFn] items error:', itemsError);
    await supabase
      .from('linkme_payment_requests')
      .delete()
      .eq('id', request.id);
    throw new Error('Erreur lors de la liaison des commissions à la demande');
  }

  await supabase
    .from('linkme_commissions')
    .update({ status: 'requested' })
    .in('id', commissionIds);

  return {
    ...request,
    status: request.status as PaymentRequestStatus,
  };
}

export function useCreatePaymentRequestAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPaymentRequestFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['payment-requests-admin'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['payment-requests-counts'],
      });
      await queryClient.invalidateQueries({ queryKey: ['linkme-commissions'] });
    },
  });
}
