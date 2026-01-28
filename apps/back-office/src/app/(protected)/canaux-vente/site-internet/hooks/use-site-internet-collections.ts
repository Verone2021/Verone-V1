/**
 * Hook: useSiteInternetCollections
 * Gère visibilité collections pour le canal site internet
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import type { Collection } from '../types';

const supabase = createClient();

/**
 * Fetch toutes collections
 */
async function fetchCollections() {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Erreur fetch collections:', error);
    throw error;
  }

  return (data || []) as Collection[];
}

/**
 * Hook principal: récupère collections
 */
export function useSiteInternetCollections() {
  return useQuery({
    queryKey: ['site-internet-collections'],
    queryFn: fetchCollections,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Check si collection visible sur canal site internet
 */
export function isCollectionVisibleOnChannel(
  collection: Collection & { visible_channels?: string[] | null },
  channelId: string
): boolean {
  // Si visible_channels est NULL → visible partout
  if (!collection.visible_channels) {
    return collection.is_active === true;
  }

  // Si array vide → visible nulle part
  if (collection.visible_channels.length === 0) {
    return false;
  }

  // Sinon check si channel_id dans array
  return (
    collection.is_active === true &&
    collection.visible_channels.includes(channelId)
  );
}

/**
 * Toggle visibilité collection sur canal site internet (avec optimistic update)
 */
export function useToggleCollectionVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      collectionId,
      isVisible,
    }: {
      collectionId: string;
      isVisible: boolean;
    }) => {
      // 1. Récupérer canal site_internet id
      const { data: channel } = await supabase
        .from('sales_channels')
        .select('id')
        .eq('code', 'site_internet')
        .single();

      if (!channel) throw new Error('Canal site_internet non trouvé');

      // 2. Récupérer collection actuelle
      const { data: collection } = await supabase
        .from('collections')
        .select('visible_channels')
        .eq('id', collectionId)
        .single();

      if (!collection) throw new Error('Collection non trouvée');

      const collectionData = collection as unknown as Collection & {
        visible_channels: string[] | null;
      };

      // 3. Calculer nouveau array visible_channels
      let newVisibleChannels: string[] | null;

      if (collectionData.visible_channels === null) {
        // Si NULL (visible partout) → créer array avec seulement ce canal si on désactive
        newVisibleChannels = isVisible ? null : [];
      } else if (isVisible) {
        // Ajouter canal si pas déjà présent
        newVisibleChannels = collectionData.visible_channels.includes(
          channel.id
        )
          ? collectionData.visible_channels
          : [...collectionData.visible_channels, channel.id];
      } else {
        // Retirer canal
        newVisibleChannels = collectionData.visible_channels.filter(
          id => id !== channel.id
        );
      }

      // 4. Update collection
      const { error: updateError } = await supabase
        .from('collections')
        .update({
          visible_channels: newVisibleChannels,
          updated_at: new Date().toISOString(),
        })
        .eq('id', collectionId);

      if (updateError) throw updateError;

      return { channelId: channel.id };
    },
    onMutate: async ({ collectionId, isVisible }) => {
      // 1. Cancel ongoing queries
      await queryClient.cancelQueries({
        queryKey: ['site-internet-collections'],
      });

      // 2. Snapshot previous value
      const previousData = queryClient.getQueryData<Collection[]>([
        'site-internet-collections',
      ]);

      // 3. Get channel id (from cache or fallback)
      const channelData = await supabase
        .from('sales_channels')
        .select('id')
        .eq('code', 'site_internet')
        .single();
      const channelId = channelData.data?.id;

      if (!channelId) return { previousData };

      // 4. Optimistically update cache
      if (previousData) {
        queryClient.setQueryData<Collection[]>(
          ['site-internet-collections'],
          old =>
            old?.map(collection => {
              if (collection.id !== collectionId) return collection;

              const collectionWithChannels = collection as Collection & {
                visible_channels?: string[] | null;
              };
              const currentChannels = collectionWithChannels.visible_channels;

              let newVisibleChannels: string[] | null;

              if (currentChannels === null || currentChannels === undefined) {
                newVisibleChannels = isVisible ? null : [];
              } else if (isVisible) {
                newVisibleChannels = currentChannels.includes(channelId)
                  ? currentChannels
                  : [...currentChannels, channelId];
              } else {
                newVisibleChannels = currentChannels.filter(
                  id => id !== channelId
                );
              }

              return {
                ...collection,
                visible_channels: newVisibleChannels,
              } as Collection;
            }) ?? []
        );
      }

      // 5. Return context for rollback
      return { previousData };
    },
    onError: (err, variables, context) => {
      // 6. Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          ['site-internet-collections'],
          context.previousData
        );
      }
    },
    onSettled: async () => {
      // 7. Refetch to sync with server
      await queryClient.invalidateQueries({
        queryKey: ['site-internet-collections'],
      });
    },
  });
}

/**
 * Mettre à jour ordre affichage collection
 */
export function useUpdateCollectionOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      collectionId,
      displayOrder,
    }: {
      collectionId: string;
      displayOrder: number;
    }) => {
      const { error } = await supabase
        .from('collections')
        .update({
          display_order: displayOrder,
          updated_at: new Date().toISOString(),
        })
        .eq('id', collectionId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['site-internet-collections'],
      });
    },
  });
}

/**
 * Stats collections site internet
 */
export function useSiteInternetCollectionsStats() {
  return useQuery({
    queryKey: ['site-internet-collections-stats'],
    queryFn: async () => {
      // Récupérer canal id
      const { data: channel } = await supabase
        .from('sales_channels')
        .select('id')
        .eq('code', 'site_internet')
        .single();

      if (!channel) return null;

      // Récupérer collections
      const { data: collections } = await supabase
        .from('collections')
        .select('*');

      if (!collections) return null;

      const collectionsData = collections as (Collection & {
        visible_channels: string[] | null;
      })[];

      const total = collectionsData.length;
      const active = collectionsData.filter(c => c.is_active).length;
      const visible = collectionsData.filter(
        c =>
          c.is_active &&
          (c.visible_channels === null ||
            c.visible_channels.includes(channel.id))
      ).length;
      const featured = collectionsData.filter(c => c.is_featured).length;

      return {
        total,
        active,
        visible,
        featured,
        visiblePercentage: total > 0 ? (visible / total) * 100 : 0,
      };
    },
    staleTime: 60000, // 1 minute
  });
}
