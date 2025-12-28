/**
 * Hook: usePaymentRequests
 * Gestion des demandes de versement des commissions
 *
 * @module use-payment-requests
 * @since 2025-12-11
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

import { useUserAffiliate } from './use-user-selection';
import type {
  PaymentRequest,
  PaymentRequestStatus,
  CommissionItem,
} from '../../types/analytics';

// ============================================================================
// Types internes
// ============================================================================

interface CreatePaymentRequestInput {
  commissionIds: string[];
}

interface UploadInvoiceInput {
  requestId: string;
  file: File;
}

interface PaymentRequestWithCommissions extends PaymentRequest {
  commissions: CommissionItem[];
}

// ============================================================================
// Hook: Liste des demandes de l'affilié
// ============================================================================

export function useAffiliatePaymentRequests() {
  const { data: affiliate } = useUserAffiliate();

  return useQuery({
    queryKey: ['payment-requests', affiliate?.id],
    queryFn: async (): Promise<PaymentRequest[]> => {
      if (!affiliate) return [];

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
          payment_proof_url,
          notes,
          created_at,
          updated_at
        `
        )
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur fetch payment requests:', error);
        throw error;
      }

      return (data || []).map(mapPaymentRequest);
    },
    enabled: !!affiliate,
    staleTime: 30000,
  });
}

// ============================================================================
// Hook: Détail d'une demande avec commissions
// ============================================================================

export function usePaymentRequestDetail(requestId: string | null) {
  const { data: affiliate } = useUserAffiliate();

  return useQuery({
    queryKey: ['payment-request-detail', requestId],
    queryFn: async (): Promise<PaymentRequestWithCommissions | null> => {
      if (!requestId || !affiliate) return null;

      // Récupérer la demande
      const { data: request, error: requestError } = await supabase
        .from('linkme_payment_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) {
        console.error('Erreur fetch payment request detail:', requestError);
        throw requestError;
      }

      // Récupérer les items avec les commissions
      const { data: items, error: itemsError } = await supabase
        .from('linkme_payment_request_items')
        .select(
          `
          commission_id,
          commission_amount_ttc,
          linkme_commissions (
            id,
            order_number,
            order_amount_ht,
            affiliate_commission,
            affiliate_commission_ttc,
            status,
            created_at,
            linkme_selections (name)
          )
        `
        )
        .eq('payment_request_id', requestId);

      if (itemsError) {
        console.error('Erreur fetch payment request items:', itemsError);
        throw itemsError;
      }

      // Mapper les commissions
      const commissions: CommissionItem[] = (items || []).map(item => {
        const comm = item.linkme_commissions as unknown as {
          id: string;
          order_number: string;
          order_amount_ht: number;
          affiliate_commission: number;
          affiliate_commission_ttc: number;
          status: string;
          created_at: string;
          linkme_selections: { name: string };
        };
        return {
          id: comm.id,
          orderNumber: comm.order_number || '',
          orderAmountHT: comm.order_amount_ht || 0,
          affiliateCommission: comm.affiliate_commission || 0,
          affiliateCommissionTTC: comm.affiliate_commission_ttc || 0,
          linkmeCommission: 0,
          marginRateApplied: 0,
          status: comm.status as 'pending' | 'validated' | 'paid' | 'cancelled',
          createdAt: comm.created_at || '',
          validatedAt: null,
          paidAt: null,
          selectionName: comm.linkme_selections?.name || 'Sélection inconnue',
        };
      });

      return {
        ...mapPaymentRequest(request),
        commissions,
      };
    },
    enabled: !!requestId && !!affiliate,
  });
}

// ============================================================================
// Mutation: Créer une demande de versement
// ============================================================================

export function useCreatePaymentRequest() {
  const queryClient = useQueryClient();
  const { data: affiliate } = useUserAffiliate();

  return useMutation({
    mutationFn: async (
      input: CreatePaymentRequestInput
    ): Promise<PaymentRequest> => {
      if (!affiliate) {
        throw new Error('Affilié non trouvé');
      }

      // 1. Récupérer les commissions sélectionnées pour calculer le total
      const { data: commissions, error: commError } = await supabase
        .from('linkme_commissions')
        .select('id, affiliate_commission_ttc, affiliate_commission, status')
        .in('id', input.commissionIds)
        .eq('affiliate_id', affiliate.id)
        .eq('status', 'validated'); // Seulement les validées

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
      if (commissions.length !== input.commissionIds.length) {
        throw new Error(
          `Seules ${commissions.length} commission(s) sur ${input.commissionIds.length} sont éligibles (statut "Validée")`
        );
      }

      // Calculer les totaux
      const totalTTC = commissions.reduce(
        (sum, c) => sum + (c.affiliate_commission_ttc || 0),
        0
      );
      const totalHT = commissions.reduce(
        (sum, c) => sum + (c.affiliate_commission || 0),
        0
      );

      // 2. Créer la demande
      const { data: request, error: createError } = await supabase
        .from('linkme_payment_requests')
        .insert({
          affiliate_id: affiliate.id,
          total_amount_ht: totalHT,
          total_amount_ttc: totalTTC,
          status: 'pending',
          request_number: '', // Auto-generated by trigger
        })
        .select()
        .single();

      if (createError) {
        console.error('Erreur création demande:', createError);
        throw new Error(
          'Erreur lors de la création de la demande de versement'
        );
      }

      // 3. Créer les items (liaison avec commissions)
      const items = commissions.map(c => ({
        payment_request_id: request.id,
        commission_id: c.id,
        commission_amount_ttc: c.affiliate_commission_ttc || 0,
      }));

      const { error: itemsError } = await supabase
        .from('linkme_payment_request_items')
        .insert(items);

      if (itemsError) {
        console.error('Erreur création items:', itemsError);
        // Rollback: supprimer la demande
        await supabase
          .from('linkme_payment_requests')
          .delete()
          .eq('id', request.id);
        throw new Error(
          'Erreur lors de la liaison des commissions à la demande'
        );
      }

      return mapPaymentRequest(request);
    },
    onSuccess: () => {
      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-commissions'] });
    },
  });
}

// ============================================================================
// Mutation: Upload facture PDF
// ============================================================================

export function useUploadInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UploadInvoiceInput): Promise<string> => {
      const { requestId, file } = input;

      // Vérifier le type de fichier
      if (file.type !== 'application/pdf') {
        throw new Error('Seuls les fichiers PDF sont acceptés');
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Le fichier ne doit pas dépasser 5 Mo');
      }

      // Générer un nom de fichier unique
      const timestamp = Date.now();
      const fileName = `invoice_${requestId}_${timestamp}.pdf`;
      const filePath = `invoices/${fileName}`;

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('linkme-invoices')
        .upload(filePath, file, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (uploadError) {
        console.error('Erreur upload facture:', uploadError);
        throw new Error("Erreur lors de l'upload du fichier");
      }

      // Récupérer l'URL publique
      const { data: urlData } = supabase.storage
        .from('linkme-invoices')
        .getPublicUrl(filePath);

      const fileUrl = urlData.publicUrl;

      // Mettre à jour la demande
      const { error: updateError } = await supabase
        .from('linkme_payment_requests')
        .update({
          invoice_file_url: fileUrl,
          invoice_file_name: file.name,
          invoice_received_at: new Date().toISOString(),
          status: 'invoice_received',
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('Erreur mise à jour demande:', updateError);
        throw new Error('Erreur lors de la mise à jour de la demande');
      }

      return fileUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
      queryClient.invalidateQueries({ queryKey: ['payment-request-detail'] });
    },
  });
}

// ============================================================================
// Mutation: Annuler une demande (affilié)
// ============================================================================

export function useCancelPaymentRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string): Promise<void> => {
      const { error } = await supabase
        .from('linkme_payment_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .in('status', ['pending', 'invoice_received']); // Seulement si pas encore payé

      if (error) {
        console.error('Erreur annulation demande:', error);
        throw new Error("Erreur lors de l'annulation de la demande");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-commissions'] });
    },
  });
}

// ============================================================================
// Helper: Mapper les données DB vers le type PaymentRequest
// ============================================================================

function mapPaymentRequest(data: Record<string, unknown>): PaymentRequest {
  return {
    id: data.id as string,
    affiliateId: data.affiliate_id as string,
    requestNumber: data.request_number as string,
    totalAmountHT: (data.total_amount_ht as number) || 0,
    totalAmountTTC: (data.total_amount_ttc as number) || 0,
    taxRate: (data.tax_rate as number) || 0.2,
    status: data.status as PaymentRequestStatus,
    invoiceFileUrl: (data.invoice_file_url as string) || null,
    invoiceFileName: (data.invoice_file_name as string) || null,
    invoiceReceivedAt: (data.invoice_received_at as string) || null,
    paidAt: (data.paid_at as string) || null,
    paidBy: (data.paid_by as string) || null,
    paymentReference: (data.payment_reference as string) || null,
    paymentProofUrl: (data.payment_proof_url as string) || null,
    notes: (data.notes as string) || null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}
