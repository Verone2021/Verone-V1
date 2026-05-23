import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// ============================================================================
// Hook: Générer une signed URL pour consulter la facture d'une demande
// ============================================================================

interface InvoiceSignedUrlResponse {
  signedUrl: string;
  expiresAt: string;
}

export function useLinkmeInvoiceSignedUrl(requestId: string | null) {
  return useQuery({
    queryKey: ['linkme-invoice-signed-url', requestId],
    queryFn: async (): Promise<InvoiceSignedUrlResponse> => {
      const response = await fetch(
        `/api/linkme/invoices/${requestId}/signed-url`
      );
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? 'Erreur lors de la génération du lien');
      }
      return response.json() as Promise<InvoiceSignedUrlResponse>;
    },
    enabled: !!requestId,
    // Ne pas mettre en cache plus de 55 minutes (signed URL expire en 1h)
    staleTime: 55 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

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
          invoice_received,
          financial_document_id,
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
          invoiceReceived: item.invoice_received ?? false,
          financialDocumentId: item.financial_document_id ?? null,
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

// ============================================================================
// Hook: Upload facture côté back-office (cas où l'affilié envoie par email)
// ============================================================================

export function useUploadInvoiceAdmin() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      file,
    }: {
      requestId: string;
      file: File;
    }): Promise<string> => {
      if (file.type !== 'application/pdf') {
        throw new Error('Seuls les fichiers PDF sont acceptés');
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Le fichier ne doit pas dépasser 10 Mo');
      }

      const filePath = `${requestId}/${Date.now()}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('linkme-invoices')
        .upload(filePath, file, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (uploadError) {
        console.error('[useUploadInvoiceAdmin] upload:', uploadError);
        throw new Error("Erreur lors de l'upload du fichier");
      }

      const { error: updateError } = await supabase
        .from('linkme_payment_requests')
        .update({
          invoice_file_url: filePath,
          invoice_file_name: file.name,
          invoice_received_at: new Date().toISOString(),
          invoice_received: true,
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('[useUploadInvoiceAdmin] update:', updateError);
        throw new Error('Erreur lors de la mise à jour de la demande');
      }

      return filePath;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['admin-payment-requests'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['admin-payment-request-detail'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['linkme-invoice-signed-url'],
      });
    },
  });
}
