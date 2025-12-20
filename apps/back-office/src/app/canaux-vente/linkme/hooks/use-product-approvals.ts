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
    staleTime: 30000,
    refetchInterval: 60000, // Refresh every minute
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
        enseigne_name: (product.enseigne as { name?: string })?.name || null,
        affiliate_display_name:
          (product.linkme_affiliates as { display_name?: string })
            ?.display_name || null,
      })) as PendingProduct[];
    },
    staleTime: 30000,
  });
}

/**
 * Hook: recupere tous les produits affilies (tous statuts)
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

      return (data || []).map((product: Record<string, unknown>) => ({
        ...product,
        enseigne_name: (product.enseigne as { name?: string })?.name || null,
        affiliate_display_name:
          (product.linkme_affiliates as { display_name?: string })
            ?.display_name || null,
      })) as PendingProduct[];
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
 * Hook: approuver un produit avec commission obligatoire
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
    }): Promise<boolean> => {
      const supabase = createClient();

      const { data, error } = await supabase.rpc('approve_affiliate_product', {
        p_product_id: productId,
        p_commission_rate: commissionRate,
      });

      if (error) {
        console.error('Error approving product:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals-count'] });
      queryClient.invalidateQueries({ queryKey: ['all-affiliate-products'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals-count'] });
      queryClient.invalidateQueries({ queryKey: ['all-affiliate-products'] });
    },
  });
}
