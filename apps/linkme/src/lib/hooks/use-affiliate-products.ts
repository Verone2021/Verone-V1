/**
 * Hook: useAffiliateProducts
 * Gestion des produits crees par les affilies
 *
 * Permet a un affilie (enseigne) de:
 * - Creer ses propres produits
 * - Les soumettre pour approbation
 * - Voir le statut d'approbation
 *
 * @module use-affiliate-products
 * @since 2025-12-20
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import { useAuth } from '../../contexts/AuthContext';

// Types pour les produits affilies
export type AffiliateProductApprovalStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected';

export interface AffiliateProduct {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  affiliate_payout_ht: number;
  affiliate_commission_rate: number;
  affiliate_approval_status: AffiliateProductApprovalStatus;
  affiliate_rejection_reason: string | null;
  dimensions: {
    length_cm?: number;
    width_cm?: number;
    height_cm?: number;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAffiliateProductInput {
  name: string;
  description?: string;
  affiliate_payout_ht: number;
  store_at_verone?: boolean;
  stock_quantity?: number;
  dimensions?: {
    length_cm?: number;
    width_cm?: number;
    height_cm?: number;
  };
}

export interface AffiliateProductPrice {
  base_price_ht: number;
  margin_rate: number;
  commission_rate: number;
  affiliate_earning: number;
  platform_earning: number;
  final_price_ht: number;
  pricing_model: 'classic' | 'affiliate_created';
}

/**
 * Hook: recupere les produits crees par l'affilié (enseigne ou org independante)
 */
export function useAffiliateProducts() {
  const { linkMeRole } = useAuth();
  const enseigneId = linkMeRole?.enseigne_id;
  const organisationId = linkMeRole?.organisation_id;
  const isOrgIndependante = linkMeRole?.role === 'org_independante';

  return useQuery({
    queryKey: ['affiliate-products', enseigneId, organisationId],
    queryFn: async (): Promise<AffiliateProduct[]> => {
      const supabase = createClient();

      // Pour org_independante, chercher par organisation_id
      if (isOrgIndependante && organisationId) {
        const { data: affiliate } = await (supabase as any)
          .from('linkme_affiliates')
          .select('id')
          .eq('organisation_id', organisationId)
          .maybeSingle();

        if (!affiliate) return [];

        const { data, error } = await (supabase.from('products') as any)
          .select(
            'id, name, sku, description, affiliate_payout_ht, affiliate_commission_rate, affiliate_approval_status, affiliate_rejection_reason, dimensions, created_at, updated_at'
          )
          .eq('created_by_affiliate', affiliate.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching affiliate products:', error);
          throw error;
        }

        return (data || []) as AffiliateProduct[];
      }

      // Pour enseigne_admin, utiliser la RPC existante
      if (!enseigneId) {
        return [];
      }

      const { data, error } = await (supabase.rpc as any)(
        'get_affiliate_products_for_enseigne',
        { p_enseigne_id: enseigneId }
      );

      if (error) {
        console.error('Error fetching affiliate products:', error);
        throw error;
      }

      return (data || []) as AffiliateProduct[];
    },
    enabled: !!enseigneId || (isOrgIndependante && !!organisationId),
    staleTime: 30000,
  });
}

/**
 * Hook: recupere un produit affilie par son ID
 */
export function useAffiliateProduct(productId: string | undefined) {
  const { linkMeRole } = useAuth();
  const enseigneId = linkMeRole?.enseigne_id;

  return useQuery({
    queryKey: ['affiliate-product', productId],
    queryFn: async (): Promise<AffiliateProduct | null> => {
      if (!productId || !enseigneId) {
        return null;
      }

      const supabase = createClient();

      const { data, error } = await (supabase.from('products') as any)
        .select(
          `
          id,
          name,
          sku,
          description,
          affiliate_payout_ht,
          affiliate_commission_rate,
          affiliate_approval_status,
          affiliate_rejection_reason,
          dimensions,
          created_at,
          updated_at
        `
        )
        .eq('id', productId)
        .eq('enseigne_id', enseigneId)
        .not('created_by_affiliate', 'is', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        console.error('Error fetching affiliate product:', error);
        throw error;
      }

      return data as AffiliateProduct;
    },
    enabled: !!productId && !!enseigneId,
  });
}

/**
 * Hook: creer un nouveau produit affilie (enseigne ou org independante)
 */
export function useCreateAffiliateProduct() {
  const queryClient = useQueryClient();
  const { linkMeRole } = useAuth();
  const enseigneId = linkMeRole?.enseigne_id;
  const organisationId = linkMeRole?.organisation_id;
  const isOrgIndependante = linkMeRole?.role === 'org_independante';

  return useMutation({
    mutationFn: async (
      input: CreateAffiliateProductInput
    ): Promise<AffiliateProduct> => {
      const supabase = createClient();

      let affiliate: { id: string } | null = null;
      let targetEnseigneId: string | null = null;

      // Pour org_independante, chercher l'affiliate par organisation_id
      if (isOrgIndependante && organisationId) {
        const { data: affData, error: affError } = await (supabase as any)
          .from('linkme_affiliates')
          .select('id, enseigne_id')
          .eq('organisation_id', organisationId)
          .maybeSingle();

        if (affError) {
          console.error('Error fetching affiliate:', affError);
          throw new Error('Error fetching affiliate');
        }
        if (!affData) {
          throw new Error('Affiliate not found for this organisation');
        }
        affiliate = { id: affData.id };
        targetEnseigneId = affData.enseigne_id; // Can be null for org_independante
      } else if (enseigneId) {
        // Pour enseigne_admin
        const { data: affData, error: affError } = await (supabase as any)
          .from('linkme_affiliates')
          .select('id')
          .eq('enseigne_id', enseigneId)
          .maybeSingle();

        if (affError) {
          console.error('Error fetching affiliate:', affError);
          throw new Error('Error fetching affiliate');
        }
        if (!affData) {
          throw new Error('Affiliate not found for this enseigne');
        }
        affiliate = affData;
        targetEnseigneId = enseigneId;
      } else {
        throw new Error('Enseigne ID or Organisation ID required');
      }

      // Securite TypeScript: affiliate est garanti non-null a ce point
      if (!affiliate) {
        throw new Error('Affiliate not found');
      }

      // Generate a unique SKU
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      const sku = `AFF-${timestamp}-${random}`;

      // Create the product
      // Note: affiliate_commission_rate sera definie par le back-office lors de l'approbation
      // Note: store_at_verone et stock_quantity ajoutés conditionnellement pour éviter erreur cache PostgREST
      const insertData: Record<string, unknown> = {
        name: input.name,
        sku,
        description: input.description || null,
        affiliate_payout_ht: input.affiliate_payout_ht,
        affiliate_approval_status: 'draft',
        dimensions: input.dimensions || null,
        enseigne_id: targetEnseigneId,
        created_by_affiliate: affiliate.id,
        product_status: 'draft',
      };

      // Ajouter store_at_verone seulement si true (évite erreur cache si colonne pas encore visible)
      if (input.store_at_verone) {
        insertData.store_at_verone = true;
        if (input.stock_quantity) {
          insertData.stock_quantity = input.stock_quantity;
        }
      }

      const { data, error } = await (supabase.from('products') as any)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating affiliate product:', error);
        throw error;
      }

      return data as AffiliateProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-products'] });
    },
  });
}

/**
 * Hook: mettre a jour un produit affilie (draft seulement)
 */
export function useUpdateAffiliateProduct() {
  const queryClient = useQueryClient();
  const { linkMeRole } = useAuth();
  const enseigneId = linkMeRole?.enseigne_id;

  return useMutation({
    mutationFn: async ({
      productId,
      updates,
    }: {
      productId: string;
      updates: Partial<CreateAffiliateProductInput>;
    }): Promise<AffiliateProduct> => {
      if (!enseigneId) {
        throw new Error('Enseigne ID required');
      }

      const supabase = createClient();

      // Build update object (commission_rate gere par back-office uniquement)
      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined)
        updateData.description = updates.description;
      if (updates.affiliate_payout_ht !== undefined)
        updateData.affiliate_payout_ht = updates.affiliate_payout_ht;
      if (updates.dimensions !== undefined)
        updateData.dimensions = updates.dimensions;

      const { data, error } = await (supabase.from('products') as any)
        .update(updateData)
        .eq('id', productId)
        .eq('enseigne_id', enseigneId)
        .eq('affiliate_approval_status', 'draft')
        .select()
        .single();

      if (error) {
        console.error('Error updating affiliate product:', error);
        throw error;
      }

      return data as AffiliateProduct;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-products'] });
      queryClient.invalidateQueries({
        queryKey: ['affiliate-product', variables.productId],
      });
    },
  });
}

/**
 * Hook: soumettre un produit pour approbation
 */
export function useSubmitForApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string): Promise<boolean> => {
      const supabase = createClient();

      const { data, error } = await (supabase.rpc as any)(
        'submit_affiliate_product_for_approval',
        { p_product_id: productId }
      );

      if (error) {
        console.error('Error submitting for approval:', error);
        throw error;
      }

      return data as boolean;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-products'] });
    },
  });
}

/**
 * Hook: calculer le prix d'un produit affilie
 */
export function useAffiliateProductPrice(
  productId: string | undefined,
  marginRate?: number
) {
  return useQuery({
    queryKey: ['affiliate-product-price', productId, marginRate],
    queryFn: async (): Promise<AffiliateProductPrice | null> => {
      if (!productId) {
        return null;
      }

      const supabase = createClient();

      const { data, error } = await (supabase.rpc as any)(
        'calculate_affiliate_product_price',
        {
          p_product_id: productId,
          p_margin_rate: marginRate || null,
        }
      );

      if (error) {
        console.error('Error calculating price:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return null;
      }

      return data[0] as AffiliateProductPrice;
    },
    enabled: !!productId,
    staleTime: 60000,
  });
}

/**
 * Hook: revert un produit rejete en draft pour modification
 */
export function useRevertToDraft() {
  const queryClient = useQueryClient();
  const { linkMeRole } = useAuth();
  const enseigneId = linkMeRole?.enseigne_id;

  return useMutation({
    mutationFn: async (productId: string): Promise<boolean> => {
      if (!enseigneId) {
        throw new Error('Enseigne ID required');
      }

      const supabase = createClient();

      const { error } = await (supabase.from('products') as any)
        .update({
          affiliate_approval_status: 'draft',
          affiliate_rejection_reason: null,
        })
        .eq('id', productId)
        .eq('enseigne_id', enseigneId)
        .eq('affiliate_approval_status', 'rejected');

      if (error) {
        console.error('Error reverting to draft:', error);
        throw error;
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-products'] });
    },
  });
}
