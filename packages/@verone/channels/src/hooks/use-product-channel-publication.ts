'use client';

/**
 * Hook: useProductChannelPublication
 *
 * Retourne les canaux éligibles pour un produit (filtrés par ses brand_ids),
 * le statut is_published_on_channel par canal, et une mutation togglePublication.
 *
 * Logique de filtrage :
 *   - Canaux multi-marques (brand_id IS NULL) → toujours inclus si is_active
 *   - Canaux mono-marque (brand_id IS NOT NULL) → inclus si brand_id ∈ productBrandIds
 *   - Si productBrandIds est null/[] → seuls les canaux multi-marques sont retournés
 *
 * Contexte : BO-BRAND-003b — UI toggles publication par canal.
 * La route POST /api/channel-pricing/toggle-publication est créée au commit 4.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutateFunction } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import { createClient } from '@verone/utils/supabase/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChannelPublicationEntry {
  channel_id: string;
  channel_code: string;
  channel_name: string;
  channel_brand_id: string | null;
  /** Icône du canal (sales_channels.icon_name) */
  channel_icon_name: string | null;
  is_published_on_channel: boolean;
}

export interface TogglePublicationInput {
  channel_id: string;
  is_published: boolean;
}

export interface TogglePublicationResult {
  ok: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Query key
// ---------------------------------------------------------------------------

export const productChannelPublicationQueryKey = (productId: string) =>
  ['product-channel-publication', productId] as const;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useProductChannelPublication(
  productId: string | null | undefined,
  productBrandIds: string[] | null | undefined
): {
  eligibleChannels: ChannelPublicationEntry[];
  isLoading: boolean;
  togglePublication: UseMutateFunction<
    TogglePublicationResult,
    Error,
    TogglePublicationInput,
    unknown
  >;
  isToggling: boolean;
  canPublish: boolean;
} {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // -------------------------------------------------------------------------
  // Computed helpers
  // -------------------------------------------------------------------------

  const hasBrands = productBrandIds != null && productBrandIds.length > 0;

  // Build the OR filter for Supabase PostgREST.
  // Always include multi-brand channels (brand_id IS NULL).
  // If the product has brands, also include channels matching those brands.
  const buildChannelFilter = (): string => {
    if (!hasBrands) {
      // Only multi-brand channels
      return 'brand_id.is.null';
    }
    // brand_id IS NULL OR brand_id IN (uuid1, uuid2, ...)
    // PostgREST canonical form: no quotes around UUIDs (they have no reserved chars).
    const brandList = productBrandIds.join(',');
    return `brand_id.is.null,brand_id.in.(${brandList})`;
  };

  // -------------------------------------------------------------------------
  // Query
  // -------------------------------------------------------------------------

  const { data = [], isLoading } = useQuery({
    enabled: !!productId,
    queryKey: productChannelPublicationQueryKey(productId ?? ''),
    staleTime: 30_000,
    queryFn: async (): Promise<ChannelPublicationEntry[]> => {
      if (!productId) return [];

      // 1. Fetch eligible channels
      const channelFilter = buildChannelFilter();

      const { data: channels, error: channelsError } = await supabase
        .from('sales_channels')
        .select('id, code, name, brand_id, icon_name')
        .eq('is_active', true)
        .or(channelFilter)
        .order('name');

      if (channelsError) {
        throw new Error(`Canaux éligibles: ${channelsError.message}`);
      }

      if (!channels || channels.length === 0) {
        return [];
      }

      const channelIds = channels.map(c => c.id);

      // 2. Fetch publication statuses for this product (explicit columns only)
      const { data: pricingRows, error: pricingError } = await supabase
        .from('channel_pricing')
        .select('channel_id, is_published_on_channel')
        .eq('product_id', productId)
        .in('channel_id', channelIds);

      if (pricingError) {
        throw new Error(`Statuts publication canal: ${pricingError.message}`);
      }

      // 3. Map channels with their publication status
      const pricingMap = new Map<string, boolean>();
      for (const row of pricingRows ?? []) {
        pricingMap.set(row.channel_id, row.is_published_on_channel ?? false);
      }

      return channels.map(channel => ({
        channel_id: channel.id,
        channel_code: channel.code,
        channel_name: channel.name,
        channel_brand_id: channel.brand_id ?? null,
        channel_icon_name: channel.icon_name ?? null,
        is_published_on_channel: pricingMap.get(channel.id) ?? false,
      }));
    },
  });

  // -------------------------------------------------------------------------
  // Mutation
  // -------------------------------------------------------------------------

  const { mutate: togglePublication, isPending: isToggling } = useMutation<
    TogglePublicationResult,
    Error,
    TogglePublicationInput
  >({
    mutationFn: async (input: TogglePublicationInput) => {
      const response = await fetch('/api/channel-pricing/toggle-publication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          channel_id: input.channel_id,
          is_published: input.is_published,
        }),
      });

      const body = (await response.json()) as TogglePublicationResult;

      if (!response.ok || !body.ok) {
        throw new Error(
          body.error ?? `Échec toggle publication (HTTP ${response.status})`
        );
      }

      return body;
    },
    onSuccess: async (_result, variables) => {
      if (!productId) return;

      await queryClient.invalidateQueries({
        queryKey: productChannelPublicationQueryKey(productId),
      });

      toast.success(
        variables.is_published
          ? 'Produit publié sur le canal'
          : 'Produit dépublié du canal'
      );
    },
    onError: (error: Error) => {
      toast.error(`Erreur publication: ${error.message}`);
    },
  });

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    eligibleChannels: data,
    isLoading,
    togglePublication,
    isToggling,
    canPublish: hasBrands,
  };
}
