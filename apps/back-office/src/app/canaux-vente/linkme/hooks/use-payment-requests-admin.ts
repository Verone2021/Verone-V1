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
      // Cast temporaire en attendant la régénération des types Supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('linkme_payment_requests')
        .select('status');

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((data as any[]) || []).forEach((item: { status: string }) => {
        if (item.status === 'pending') counts.pending++;
        if (item.status === 'invoice_received') counts.invoice_received++;
        if (item.status === 'paid') counts.paid++;
        if (item.status === 'cancelled') counts.cancelled++;
      });

      counts.total_pending = counts.pending + counts.invoice_received;

      return counts;
    },
    staleTime: 30000, // 30 secondes
    refetchInterval: 60000, // Rafraîchir toutes les minutes
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
      // Cast temporaire en attendant la régénération des types Supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      if (error) {
        console.error('Erreur fetch payment requests admin:', error);
        throw error;
      }

      const typedData = data as PaymentRequestRaw[];

      return (typedData || []).map(item => ({
        ...item,
        status: item.status as PaymentRequestAdmin['status'],
        affiliate: item.linkme_affiliates || undefined,
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

      // Cast temporaire en attendant la régénération des types Supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('linkme_payment_requests')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          paid_by: userData?.user?.id || null,
          payment_reference: input.paymentReference,
        })
        .eq('id', input.requestId);

      if (error) {
        console.error('Erreur marking as paid:', error);
        throw new Error('Erreur lors du marquage comme payée');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests-admin'] });
      queryClient.invalidateQueries({ queryKey: ['payment-requests-counts'] });
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
      // Cast temporaire en attendant la régénération des types Supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('linkme_payment_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .in('status', ['pending', 'invoice_received']);

      if (error) {
        console.error('Erreur cancelling request:', error);
        throw new Error("Erreur lors de l'annulation");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests-admin'] });
      queryClient.invalidateQueries({ queryKey: ['payment-requests-counts'] });
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
      // Cast temporaire en attendant la régénération des types Supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      if (error) {
        console.error('Erreur fetch recent payment requests:', error);
        throw error;
      }

      const typedData = data as PaymentRequestRaw[];

      return (typedData || []).map(item => ({
        ...item,
        status: item.status as PaymentRequestAdmin['status'],
        affiliate: item.linkme_affiliates || undefined,
      }));
    },
    staleTime: 30000,
  });
}
