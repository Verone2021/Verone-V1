/**
 * Hook: useUserSelection
 * Gestion de la sélection de l'utilisateur connecté
 *
 * L'utilisateur est lié à un affilié via:
 * - enseigne_id (si enseigne_admin ou enseigne_collaborateur)
 * - organisation_id (si organisation_admin)
 *
 * @module use-user-selection
 * @since 2025-12-04
 * @updated 2026-04-14 - Refactoring: extraction sous-modules
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@verone/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@verone/utils/supabase/client';

import { useUserAffiliate } from './use-user-affiliate';

// Re-exports pour compatibilité avec les imports existants
export type { UserAffiliate } from './use-user-affiliate';
export { useUserAffiliate } from './use-user-affiliate';
export type { SelectionItem } from './use-selection-items';
export {
  useSelectionItems,
  useSelectionProductIds,
  useAddToSelection,
  useAddToSelectionWithMargin,
  useRemoveFromSelection,
  useUpdateItemMargin,
  useReorderProducts,
  useUpdateAffiliateProductPrice,
} from './use-selection-items';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Interface sélection
 * Note: is_public est dérivé de published_at (published_at !== null = publié)
 */
export interface UserSelection {
  id: string;
  affiliate_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  /** @deprecated Utiliser published_at !== null à la place */
  is_public: boolean;
  share_token: string | null;
  products_count: number;
  views_count: number;
  orders_count: number;
  total_revenue: number;
  published_at: string | null;
  /** Mode d'affichage des prix pour cette sélection (HT ou TTC) */
  price_display_mode: 'HT' | 'TTC';
  created_at: string;
  updated_at: string;
}

interface LinkMeSelectionRow {
  id: string;
  affiliate_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  share_token: string | null;
  products_count: number | null;
  views_count: number | null;
  orders_count: number | null;
  total_revenue: number | null;
  published_at: string | null;
  price_display_mode: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// HOOKS
// ============================================================================

export function useUserSelections() {
  const { data: affiliate } = useUserAffiliate();

  return useQuery({
    queryKey: ['user-selections', affiliate?.id],
    queryFn: async (): Promise<UserSelection[]> => {
      if (!affiliate) return [];

      const supabase: SupabaseClient<Database> = createClient();
      const { data, error } = await supabase
        .from('linkme_selections')
        .select(
          'id, affiliate_id, name, slug, description, image_url, share_token, products_count, views_count, orders_count, total_revenue, published_at, price_display_mode, created_at, updated_at'
        )
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false })
        .returns<LinkMeSelectionRow[]>();

      if (error) {
        console.error('Erreur fetch selections:', error);
        throw error;
      }

      return (data ?? []).map(s => ({
        id: s.id,
        affiliate_id: s.affiliate_id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        image_url: s.image_url,
        is_public: s.published_at !== null,
        share_token: s.share_token,
        products_count: s.products_count ?? 0,
        views_count: s.views_count ?? 0,
        orders_count: s.orders_count ?? 0,
        total_revenue: s.total_revenue ?? 0,
        published_at: s.published_at,
        price_display_mode: (s.price_display_mode ?? 'TTC') as 'HT' | 'TTC',
        created_at: s.created_at,
        updated_at: s.updated_at,
      }));
    },
    enabled: !!affiliate,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
}

export function useCreateSelection() {
  const queryClient = useQueryClient();
  const { data: affiliate } = useUserAffiliate();

  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      if (!affiliate) throw new Error('Aucun compte affilié trouvé');

      const supabase: SupabaseClient<Database> = createClient();

      const baseSlug = input.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

      const { data, error } = await supabase
        .from('linkme_selections')
        .insert({
          affiliate_id: affiliate.id,
          name: input.name,
          slug: uniqueSlug,
          description: input.description ?? null,
          published_at: null,
          products_count: 0,
          views_count: 0,
          orders_count: 0,
          total_revenue: 0,
        })
        .select(
          'id, affiliate_id, name, slug, description, image_url, share_token, products_count, views_count, orders_count, total_revenue, published_at, price_display_mode, created_at, updated_at'
        )
        .single<LinkMeSelectionRow>();

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user-selections'] });
    },
  });
}

export function useToggleSelectionPublished() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { selectionId: string; isPublic: boolean }) => {
      const supabase: SupabaseClient<Database> = createClient();
      const { error } = await supabase
        .from('linkme_selections')
        .update({
          published_at: input.isPublic ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.selectionId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user-selections'] });
    },
  });
}

export function useUpdateSelectionPriceDisplayMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      selectionId: string;
      priceDisplayMode: 'HT' | 'TTC';
    }) => {
      const supabase: SupabaseClient<Database> = createClient();
      const { error } = await supabase
        .from('linkme_selections')
        .update({
          price_display_mode: input.priceDisplayMode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.selectionId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user-selections'] });
    },
  });
}
