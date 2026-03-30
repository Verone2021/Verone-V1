import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import {
  type PaymentRequestAdmin,
  type PaymentRequestRaw,
  type PaymentRequestStatus,
} from './types';

export function usePaymentRequestsAdmin(
  statusFilter: PaymentRequestStatus | 'all'
) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-payment-requests', statusFilter],
    queryFn: async (): Promise<PaymentRequestAdmin[]> => {
      // Note: Table linkme_payment_requests créée par migration 20251211_001
      // Les types Supabase seront mis à jour après `supabase gen types`
      const baseQuery = supabase
        .from('linkme_payment_requests' as 'linkme_affiliates') // Cast temporaire
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
          )
        `
        )
        .order('created_at', { ascending: false });

      const query =
        statusFilter !== 'all'
          ? baseQuery.eq('status', statusFilter)
          : baseQuery;

      const { data, error } = await query.returns<PaymentRequestRaw[]>();

      if (error) {
        console.error('Erreur fetch payment requests admin:', error);
        throw error;
      }

      return (data ?? []).map(item => {
        const affiliate = item.linkme_affiliates;
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
        };
      });
    },
    staleTime: 300_000,
  });
}

export function useMarkAsPaid() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      paymentReference,
    }: {
      requestId: string;
      paymentReference: string;
    }) => {
      // Cast temporaire en attendant supabase gen types
      const { error } = await supabase
        .from('linkme_payment_requests' as 'linkme_affiliates')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_reference: paymentReference,
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['admin-payment-requests'],
      });
    },
  });
}
