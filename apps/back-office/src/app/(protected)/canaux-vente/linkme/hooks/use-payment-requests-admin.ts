/**
 * Hook: usePaymentRequestsAdmin
 * Gestion des demandes de versement côté back-office
 *
 * @module use-payment-requests-admin
 * @since 2025-12-11
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// Types
interface PaymentRequestAdmin {
  id: string;
  affiliate_id: string;
  request_number: string;
  total_amount_ht: number;
  total_amount_ttc: number;
  tax_rate: number;
  status: 'pending' | 'invoice_received' | 'paid' | 'cancelled';
  invoice_file_url: string | null;
  invoice_file_name: string | null;
  invoice_received_at: string | null;
  paid_at: string | null;
  paid_by: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  affiliate?: {
    display_name: string;
    email: string | null;
    enseigne_id: string | null;
    organisation_id: string | null;
  };
}

interface PaymentRequestCounts {
  pending: number;
  invoice_received: number;
  total_pending: number; // pending + invoice_received
  paid: number;
  cancelled: number;
}

// Type pour les données brutes de la requête
interface PaymentRequestRaw {
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

// ============================================================================
// Hook: Compter les demandes par statut (pour badge notification)
// ============================================================================

export function usePaymentRequestsCounts() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['payment-requests-counts'],
    queryFn: async (): Promise<PaymentRequestCounts> => {
      /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
      const { data, error } = await (supabase as any)
        .from('linkme_payment_requests')
        .select('status');
      /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

      if (error) {
        console.error('Erreur fetch payment requests counts:', error);
        throw error;
      }

      const counts: PaymentRequestCounts = {
        pending: 0,
        invoice_received: 0,
        total_pending: 0,
        paid: 0,
        cancelled: 0,
      };

      ((data as any[]) ?? []).forEach((item: { status: string }) => {
        if (item.status === 'pending') counts.pending++;
        if (item.status === 'invoice_received') counts.invoice_received++;
        if (item.status === 'paid') counts.paid++;
        if (item.status === 'cancelled') counts.cancelled++;
      });

      counts.total_pending = counts.pending + counts.invoice_received;

      return counts;
    },
    staleTime: 120000, // 2 minutes
    refetchInterval: 60000, // Rafraîchir toutes les minutes
    refetchIntervalInBackground: false,
  });
}

// ============================================================================
// Hook: Liste complète des demandes (pour page admin)
// ============================================================================

export function usePaymentRequestsAdmin(statusFilter?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['payment-requests-admin', statusFilter],
    queryFn: async (): Promise<PaymentRequestAdmin[]> => {
      /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
      let query = (supabase as any)
        .from('linkme_payment_requests')
        .select(
          `
          *,
          linkme_affiliates (
            display_name,
            email,
            enseigne_id,
            organisation_id
          )
        `
        )
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

      if (error) {
        console.error('Erreur fetch payment requests admin:', error);
        throw error;
      }

      const typedData = data as PaymentRequestRaw[];

      return (typedData ?? []).map(item => ({
        ...item,
        status: item.status as PaymentRequestAdmin['status'],
        affiliate: item.linkme_affiliates ?? undefined,
      }));
    },
    staleTime: 30000,
  });
}

// ============================================================================
// Mutation: Marquer comme payée
// ============================================================================

interface MarkAsPaidInput {
  requestId: string;
  paymentReference: string;
}

export function useMarkAsPaid() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (input: MarkAsPaidInput): Promise<void> => {
      const { data: userData } = await supabase.auth.getUser();

      /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
      const { error } = await (supabase as any)
        .from('linkme_payment_requests')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          paid_by: userData?.user?.id ?? null,
          payment_reference: input.paymentReference,
        })
        .eq('id', input.requestId);
      /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

      if (error) {
        console.error('Erreur marking as paid:', error);
        throw new Error('Erreur lors du marquage comme payée');
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
// Mutation: Annuler une demande
// ============================================================================

export function useCancelPaymentRequestAdmin() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (requestId: string): Promise<void> => {
      /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
      const { error } = await (supabase as any)
        .from('linkme_payment_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .in('status', ['pending', 'invoice_received']);
      /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

      if (error) {
        console.error('Erreur cancelling request:', error);
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

export function useCreatePaymentRequestAdmin() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (
      input: CreatePaymentRequestAdminInput
    ): Promise<PaymentRequestAdmin> => {
      const { affiliateId, commissionIds } = input;

      /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
      // 1. Récupérer les commissions sélectionnées pour calculer le total
      const { data: commissions, error: commError } = await (supabase as any)
        .from('linkme_commissions')
        .select('id, affiliate_commission_ttc, affiliate_commission, status')
        .in('id', commissionIds)
        .eq('affiliate_id', affiliateId)
        .eq('status', 'validated'); // Seulement les validées
      /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

      if (commError) {
        console.error('Erreur récupération commissions:', commError);
        throw new Error(
          'Erreur lors de la récupération des commissions sélectionnées'
        );
      }

      if (!commissions || commissions.length === 0) {
        throw new Error(
          'Aucune commission validée sélectionnée. Seules les commissions avec le statut "Validée" peuvent être demandées.'
        );
      }

      // Vérifier que tous les IDs sont bien présents
      if (commissions.length !== commissionIds.length) {
        throw new Error(
          `Seules ${commissions.length} commission(s) sur ${commissionIds.length} sont éligibles (statut "Validée")`
        );
      }

      // Calculer les totaux
      const totalTTC = commissions.reduce(
        (sum: number, c: { affiliate_commission_ttc: number }) =>
          sum + (c.affiliate_commission_ttc ?? 0),
        0
      );
      const totalHT = commissions.reduce(
        (sum: number, c: { affiliate_commission: number }) =>
          sum + (c.affiliate_commission ?? 0),
        0
      );

      /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
      // 2. Créer la demande
      const { data: request, error: createError } = await (supabase as any)
        .from('linkme_payment_requests')
        .insert({
          affiliate_id: affiliateId,
          total_amount_ht: totalHT,
          total_amount_ttc: totalTTC,
          status: 'pending',
        })
        .select()
        .single();
      /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

      if (createError) {
        console.error('Erreur création demande:', createError);
        throw new Error(
          'Erreur lors de la création de la demande de versement'
        );
      }

      // 3. Créer les items (liaison avec commissions)
      const items = commissions.map(
        (c: { id: string; affiliate_commission_ttc: number }) => ({
          payment_request_id: request.id,
          commission_id: c.id,
          commission_amount_ttc: c.affiliate_commission_ttc ?? 0,
        })
      );

      /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
      const { error: itemsError } = await (supabase as any)
        .from('linkme_payment_request_items')
        .insert(items);

      if (itemsError) {
        console.error('Erreur création items:', itemsError);
        // Rollback: supprimer la demande
        await (supabase as any)
          .from('linkme_payment_requests')
          .delete()
          .eq('id', request.id);
        throw new Error(
          'Erreur lors de la liaison des commissions à la demande'
        );
      }

      // 4. Mettre à jour les commissions avec le statut 'requested'
      await (supabase as any)
        .from('linkme_commissions')
        .update({ status: 'requested' })
        .in('id', commissionIds);
      /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

      return {
        ...request,
        status: request.status as PaymentRequestAdmin['status'],
      };
    },
    onSuccess: async () => {
      // Invalider les caches
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

// ============================================================================
// Hook: Demandes récentes pour dashboard
// ============================================================================

export function useRecentPaymentRequests(limit: number = 5) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['payment-requests-recent', limit],
    queryFn: async (): Promise<PaymentRequestAdmin[]> => {
      /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
      const { data, error } = await (supabase as any)
        .from('linkme_payment_requests')
        .select(
          `
          *,
          linkme_affiliates (
            display_name,
            email,
            enseigne_id,
            organisation_id
          )
        `
        )
        .in('status', ['pending', 'invoice_received'])
        .order('created_at', { ascending: false })
        .limit(limit);
      /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

      if (error) {
        console.error('Erreur fetch recent payment requests:', error);
        throw error;
      }

      const typedData = data as PaymentRequestRaw[];

      return (typedData ?? []).map(item => ({
        ...item,
        status: item.status as PaymentRequestAdmin['status'],
        affiliate: item.linkme_affiliates ?? undefined,
      }));
    },
    staleTime: 30000,
  });
}
