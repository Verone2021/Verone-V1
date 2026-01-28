/**
 * Hook: useProductApprovals
 * Gestion de la queue d'approbation des produits affilies
 *
 * @module use-product-approvals
 * @since 2025-12-20
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// Types
export type AffiliateProductApprovalStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected';

export interface PendingProduct {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  affiliate_payout_ht: number;
  affiliate_commission_rate: number;
  affiliate_approval_status: AffiliateProductApprovalStatus;
  dimensions: {
    length_cm?: number;
    width_cm?: number;
    height_cm?: number;
  } | null;
  created_at: string;
  updated_at: string;
  // Joined data
  enseigne_name?: string;
  affiliate_display_name?: string;
  // Storage info
  affiliate_storage_type: 'verone' | 'self';
  affiliate_stock_quantity: number | null;
}

/**
 * Hook: compte le nombre de produits en attente d'approbation
 */
export function usePendingApprovalsCount() {
  return useQuery({
    queryKey: ['pending-approvals-count'],
    queryFn: async (): Promise<number> => {
      const supabase = createClient();

      const { data, error } = await supabase.rpc('get_pending_approvals_count');

      if (error) {
        console.error('Error fetching pending count:', error);
        throw error;
      }

      return data || 0;
    },
    staleTime: 120000, // 2 minutes
    refetchInterval: 60000, // Refresh every minute
    refetchIntervalInBackground: false,
  });
}

/**
 * Hook: recupere la liste des produits en attente d'approbation
 */
export function usePendingApprovals() {
  return useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async (): Promise<PendingProduct[]> => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('products')
        .select(
          `
          id,
          name,
          sku,
          description,
          affiliate_payout_ht,
          affiliate_commission_rate,
          affiliate_approval_status,
          dimensions,
          created_at,
          updated_at,
          enseigne:enseigne_id (
            name
          ),
          linkme_affiliates:created_by_affiliate (
            display_name
          )
        `
        )
        .eq('affiliate_approval_status', 'pending_approval')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending approvals:', error);
        throw error;
      }

      // Map data to flat structure
      return (data || []).map((product: Record<string, unknown>) => ({
        ...product,
        enseigne_name: (product.enseigne as { name?: string })?.name ?? null,
        affiliate_display_name:
          (product.linkme_affiliates as { display_name?: string })
            ?.display_name ?? null,
      })) as PendingProduct[];
    },
    staleTime: 30000,
  });
}

/**
 * Hook: recupere tous les produits affilies (tous statuts)
 * Inclut les informations de stockage depuis purchase_order_receptions
 */
export function useAllAffiliateProducts(
  status?: AffiliateProductApprovalStatus
) {
  return useQuery({
    queryKey: ['all-affiliate-products', status],
    queryFn: async (): Promise<PendingProduct[]> => {
      const supabase = createClient();

      let query = supabase
        .from('products')
        .select(
          `
          id,
          name,
          sku,
          description,
          affiliate_payout_ht,
          affiliate_commission_rate,
          affiliate_approval_status,
          dimensions,
          created_at,
          updated_at,
          enseigne:enseigne_id (
            name
          ),
          linkme_affiliates:created_by_affiliate (
            display_name
          ),
          purchase_order_receptions (
            id,
            quantity_expected,
            status,
            reference_type
          )
        `
        )
        .not('created_by_affiliate', 'is', null)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('affiliate_approval_status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching affiliate products:', error);
        throw error;
      }

      // Map data and determine storage type from receptions
      return (data || []).map((product: Record<string, unknown>) => {
        const receptions =
          (product.purchase_order_receptions as Array<{
            id: string;
            quantity_expected: number;
            status: string;
            reference_type: string;
          }>) || [];

        // Find affiliate reception (indicates storage by Vérone)
        const affiliateReception = receptions.find(
          r => r.reference_type === 'affiliate_product'
        );

        return {
          ...product,
          enseigne_name: (product.enseigne as { name?: string })?.name ?? null,
          affiliate_display_name:
            (product.linkme_affiliates as { display_name?: string })
              ?.display_name ?? null,
          // Storage info: if there's an affiliate_product reception, it's stored at Vérone
          affiliate_storage_type: affiliateReception ? 'verone' : 'self',
          affiliate_stock_quantity:
            affiliateReception?.quantity_expected ?? null,
        };
      }) as PendingProduct[];
    },
    staleTime: 30000,
  });
}

/**
 * Taux de commission autorises pour les produits affilies
 */
export const COMMISSION_RATES = [5, 10, 15] as const;
export type CommissionRate = (typeof COMMISSION_RATES)[number];

/**
 * Résultat de l'approbation d'un produit affilié
 */
interface ApprovalResult {
  success: boolean;
  product_id: string;
  product_name: string;
  status: string;
  commission_rate: number;
  reception_id: string | null;
  reception_status: string | null;
  stock_quantity_expected: number;
  message: string;
}

/**
 * Hook: approuver un produit avec commission obligatoire
 * Crée une réception en attente si stock_quantity > 0 (le mouvement de stock est créé à la confirmation)
 */
export function useApproveProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      commissionRate,
    }: {
      productId: string;
      commissionRate: CommissionRate;
    }): Promise<ApprovalResult> => {
      const supabase = createClient();

      const { data, error } = await supabase.rpc('approve_affiliate_product', {
        p_product_id: productId,
        p_commission_rate: commissionRate,
      });

      if (error) {
        console.error('Error approving product:', error);
        throw error;
      }

      return data as unknown as ApprovalResult;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      await queryClient.invalidateQueries({
        queryKey: ['pending-approvals-count'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['all-affiliate-products'],
      });
    },
  });
}

/**
 * Hook: rejeter un produit
 */
export function useRejectProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      reason,
    }: {
      productId: string;
      reason: string;
    }): Promise<boolean> => {
      const supabase = createClient();

      const { data, error } = await supabase.rpc('reject_affiliate_product', {
        p_product_id: productId,
        p_reason: reason,
      });

      if (error) {
        console.error('Error rejecting product:', error);
        throw error;
      }

      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      await queryClient.invalidateQueries({
        queryKey: ['pending-approvals-count'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['all-affiliate-products'],
      });
    },
  });
}

// ============================================
// NOUVELLES FONCTIONS - Mise a jour produits affilies
// Ajoutees: 2026-01-09
// ============================================

/**
 * Interface pour la mise a jour d'un produit affilie
 */
export interface UpdateAffiliateProductParams {
  productId: string;
  commissionRate?: number;
  payoutHt?: number;
  changeReason?: string;
}

/**
 * Resultat de la mise a jour
 */
export interface UpdateAffiliateProductResult {
  success: boolean;
  product_id?: string;
  old_commission_rate?: number;
  new_commission_rate?: number;
  old_payout_ht?: number;
  new_payout_ht?: number;
  error?: string;
}

/**
 * Hook: mettre a jour un produit affilie approuve
 * Permet de modifier la commission et/ou le payout
 */
export function useUpdateAffiliateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      commissionRate,
      payoutHt,
      changeReason,
    }: UpdateAffiliateProductParams): Promise<UpdateAffiliateProductResult> => {
      const supabase = createClient();

      // Note: RPC function 'update_affiliate_product' - types will be available after migration
      const { data, error } = await (supabase.rpc as any)(
        'update_affiliate_product',
        {
          p_product_id: productId,
          p_commission_rate: commissionRate ?? null,
          p_payout_ht: payoutHt ?? null,
          p_change_reason: changeReason ?? null,
        }
      );

      if (error) {
        console.error('Error updating affiliate product:', error);
        throw error;
      }

      const result = data as unknown as UpdateAffiliateProductResult;

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la mise a jour');
      }

      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['all-affiliate-products'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['product-commission-history'],
      });
    },
  });
}

/**
 * Interface pour l'historique des commissions
 */
export interface CommissionHistoryEntry {
  id: string;
  old_commission_rate: number | null;
  new_commission_rate: number | null;
  old_payout_ht: number | null;
  new_payout_ht: number | null;
  change_reason: string | null;
  change_type: 'approval' | 'update' | 'system';
  modified_by: string | null;
  modified_by_email: string | null;
  modified_at: string;
}

/**
 * Hook: recuperer l'historique des modifications de commission d'un produit
 */
export function useProductCommissionHistory(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-commission-history', productId],
    queryFn: async (): Promise<CommissionHistoryEntry[]> => {
      if (!productId) return [];

      const supabase = createClient();

      // Note: RPC function 'get_product_commission_history' - types will be available after migration
      const { data, error } = await (supabase.rpc as any)(
        'get_product_commission_history',
        {
          p_product_id: productId,
        }
      );

      if (error) {
        console.error('Error fetching commission history:', error);
        throw error;
      }

      return (data || []) as unknown as CommissionHistoryEntry[];
    },
    enabled: !!productId,
    staleTime: 30000,
  });
}
