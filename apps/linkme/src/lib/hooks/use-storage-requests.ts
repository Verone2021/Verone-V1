/**
 * Hook: useStorageRequests
 * Gestion des demandes d'envoi de stock par les affilies LinkMe
 *
 * Permet a un affilie de:
 * - Voir ses demandes d'envoi de stock
 * - Creer une nouvelle demande
 * - Annuler une demande en attente
 *
 * @module use-storage-requests
 * @since 2026-02-25
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@verone/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@verone/utils/supabase/client';

import { useAuth } from '../../contexts/AuthContext';

// Types
export interface StorageRequest {
  id: string;
  product_id: string;
  affiliate_id: string;
  quantity: number;
  notes: string | null;
  status:
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'cancelled'
    | 'reception_created';
  rejection_reason: string | null;
  reception_id: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  product_name?: string;
  product_sku?: string;
  product_image_url?: string | null;
  product_cloudflare_image_id?: string | null;
}

export interface CreateStorageRequestInput {
  product_id: string;
  quantity: number;
  notes?: string;
}

/**
 * Hook: recupere les demandes d'envoi de stock de l'affilie
 */
export function useAffiliateStorageRequests() {
  const { linkMeRole } = useAuth();
  const enseigneId = linkMeRole?.enseigne_id;
  const organisationId = linkMeRole?.organisation_id;
  const isOrganisationAdmin = linkMeRole?.role === 'organisation_admin';

  return useQuery({
    queryKey: ['storage-requests', enseigneId, organisationId],
    queryFn: async (): Promise<StorageRequest[]> => {
      const supabase: SupabaseClient<Database> = createClient();

      // Find the affiliate ID for this user
      let affiliateId: string | null = null;

      if (isOrganisationAdmin && organisationId) {
        const { data: affiliate } = await supabase
          .from('linkme_affiliates')
          .select('id')
          .eq('organisation_id', organisationId)
          .maybeSingle<{ id: string }>();
        affiliateId = affiliate?.id ?? null;
      } else if (enseigneId) {
        const { data: affiliate } = await supabase
          .from('linkme_affiliates')
          .select('id')
          .eq('enseigne_id', enseigneId)
          .maybeSingle<{ id: string }>();
        affiliateId = affiliate?.id ?? null;
      }

      if (!affiliateId) return [];

      const { data, error } = await supabase
        .from('affiliate_storage_requests')
        .select(
          'id, product_id, affiliate_id, quantity, notes, status, rejection_reason, reception_id, reviewed_at, created_at, updated_at'
        )
        .eq('affiliate_id', affiliateId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useAffiliateStorageRequests] Error:', error);
        throw error;
      }

      const requests = (data ?? []) as unknown as StorageRequest[];

      // Enrich with product info
      if (requests.length === 0) return requests;

      const productIds = [...new Set(requests.map(r => r.product_id))];
      const { data: products } = await supabase
        .from('products')
        .select('id, name, sku')
        .in('id', productIds);

      const { data: images } = await supabase
        .from('product_images')
        .select('product_id, public_url, cloudflare_image_id, display_order')
        .in('product_id', productIds)
        .order('display_order', { ascending: true });

      const productMap = new Map<string, { name: string; sku: string }>();
      for (const p of products ?? []) {
        productMap.set(p.id, { name: p.name, sku: p.sku ?? '' });
      }

      const imageMap = new Map<
        string,
        { public_url: string; cloudflare_image_id: string | null }
      >();
      for (const img of images ?? []) {
        if (!imageMap.has(img.product_id)) {
          imageMap.set(img.product_id, {
            public_url: img.public_url ?? '',
            cloudflare_image_id: img.cloudflare_image_id ?? null,
          });
        }
      }

      return requests.map(r => ({
        ...r,
        product_name: productMap.get(r.product_id)?.name ?? 'Produit inconnu',
        product_sku: productMap.get(r.product_id)?.sku ?? '',
        product_image_url: imageMap.get(r.product_id)?.public_url ?? null,
        product_cloudflare_image_id:
          imageMap.get(r.product_id)?.cloudflare_image_id ?? null,
      }));
    },
    enabled: !!enseigneId || (isOrganisationAdmin && !!organisationId),
    staleTime: 300_000,
  });
}

/**
 * Hook: creer une demande d'envoi de stock
 */
export function useCreateStorageRequest() {
  const queryClient = useQueryClient();
  const { linkMeRole } = useAuth();
  const enseigneId = linkMeRole?.enseigne_id;
  const organisationId = linkMeRole?.organisation_id;
  const isOrganisationAdmin = linkMeRole?.role === 'organisation_admin';

  return useMutation({
    mutationFn: async (
      input: CreateStorageRequestInput
    ): Promise<StorageRequest> => {
      const supabase: SupabaseClient<Database> = createClient();

      // Find the affiliate for this user
      let affiliateId: string | null = null;
      let ownerEnseigneId: string | null = null;
      let ownerOrganisationId: string | null = null;

      if (isOrganisationAdmin && organisationId) {
        const { data: affiliate } = await supabase
          .from('linkme_affiliates')
          .select('id, enseigne_id, organisation_id')
          .eq('organisation_id', organisationId)
          .maybeSingle<{
            id: string;
            enseigne_id: string | null;
            organisation_id: string | null;
          }>();

        if (!affiliate) throw new Error('Affiliate not found');
        affiliateId = affiliate.id;
        ownerEnseigneId = affiliate.enseigne_id;
        ownerOrganisationId = affiliate.organisation_id;
      } else if (enseigneId) {
        const { data: affiliate } = await supabase
          .from('linkme_affiliates')
          .select('id, enseigne_id, organisation_id')
          .eq('enseigne_id', enseigneId)
          .maybeSingle<{
            id: string;
            enseigne_id: string | null;
            organisation_id: string | null;
          }>();

        if (!affiliate) throw new Error('Affiliate not found');
        affiliateId = affiliate.id;
        ownerEnseigneId = affiliate.enseigne_id;
        ownerOrganisationId = affiliate.organisation_id;
      }

      if (!affiliateId) throw new Error('Affiliate not found');

      type StorageRequestInsert =
        Database['public']['Tables']['affiliate_storage_requests']['Insert'];
      const insertData: StorageRequestInsert = {
        product_id: input.product_id,
        affiliate_id: affiliateId,
        owner_enseigne_id: ownerEnseigneId,
        owner_organisation_id: ownerOrganisationId,
        quantity: input.quantity,
        notes: input.notes ?? null,
      };

      const { data, error } = await supabase
        .from('affiliate_storage_requests')
        .insert(insertData)
        .select(
          'id, product_id, affiliate_id, quantity, notes, status, rejection_reason, reception_id, reviewed_at, created_at, updated_at'
        )
        .single();

      if (error) {
        console.error('[useCreateStorageRequest] Error:', error);
        if (error.code === '23505') {
          throw new Error('Une demande est deja en cours pour ce produit');
        }
        throw error;
      }

      return data as unknown as StorageRequest;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['storage-requests'] });
      await queryClient.invalidateQueries({ queryKey: ['affiliate-products'] });
    },
  });
}

/**
 * Hook: annuler une demande d'envoi de stock (pending seulement)
 */
export function useCancelStorageRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string): Promise<boolean> => {
      const supabase: SupabaseClient<Database> = createClient();

      const { error } = await supabase
        .from('affiliate_storage_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .eq('status', 'pending');

      if (error) {
        console.error('[useCancelStorageRequest] Error:', error);
        throw error;
      }

      return true;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['storage-requests'] });
    },
  });
}
