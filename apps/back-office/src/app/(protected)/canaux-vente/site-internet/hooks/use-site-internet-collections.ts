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

  return (data ?? []) as Collection[];
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
function computeVisibleChannels(
  currentChannels: string[] | null,
  channelId: string,
  isVisible: boolean
): string[] | null {
  if (currentChannels === null) return isVisible ? null : [];
  if (isVisible) {
    return currentChannels.includes(channelId)
      ? currentChannels
      : [...currentChannels, channelId];
  }
  return currentChannels.filter(id => id !== channelId);
}

async function toggleCollectionVisibilityFn({
  collectionId,
  isVisible,
}: {
  collectionId: string;
  isVisible: boolean;
}) {
  const { data: channel } = await supabase
    .from('sales_channels')
    .select('id')
    .eq('code', 'site_internet')
    .single();
  if (!channel) throw new Error('Canal site_internet non trouvé');

  const { data: collection } = await supabase
    .from('collections')
    .select('visible_channels')
    .eq('id', collectionId)
    .single();
  if (!collection) throw new Error('Collection non trouvée');

  const newVisibleChannels = computeVisibleChannels(
    (collection as Collection).visible_channels,
    channel.id,
    isVisible
  );

  const { error: updateError } = await supabase
    .from('collections')
    .update({
      visible_channels: newVisibleChannels,
      updated_at: new Date().toISOString(),
    })
    .eq('id', collectionId);
  if (updateError) throw updateError;

  return { channelId: channel.id };
}

export function useToggleCollectionVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleCollectionVisibilityFn,
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

              const currentChannels =
                (
                  collection as Collection & {
                    visible_channels?: string[] | null;
                  }
                ).visible_channels ?? null;
              return {
                ...collection,
                visible_channels: computeVisibleChannels(
                  currentChannels,
                  channelId,
                  isVisible
                ),
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
 * Create a new collection
 */
export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      style?: string;
      suitable_rooms?: string[];
      theme_tags?: string[];
      visibility?: string;
      is_active?: boolean;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifie');

      // slug is auto-generated by DB trigger — do NOT send it
      const { error } = await supabase.from('collections').insert({
        name: data.name,
        description: data.description ?? null,
        style: data.style ?? null,
        suitable_rooms: data.suitable_rooms ?? [],
        theme_tags: data.theme_tags ?? [],
        visibility: data.visibility ?? 'private',
        is_active: data.is_active ?? true,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['site-internet-collections'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['site-internet-collections-stats'],
      });
    },
  });
}

/**
 * Update an existing collection
 */
export function useUpdateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      collectionId,
      data,
    }: {
      collectionId: string;
      data: {
        name?: string;
        description?: string;
        style?: string;
        suitable_rooms?: string[];
        theme_tags?: string[];
        visibility?: string;
        is_active?: boolean;
        image_url?: string;
      };
    }) => {
      const { error } = await supabase
        .from('collections')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', collectionId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['site-internet-collections'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['site-internet-collections-stats'],
      });
    },
  });
}

/**
 * Delete a collection (CASCADE deletes collection_products)
 */
export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collectionId: string) => {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['site-internet-collections'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['site-internet-collections-stats'],
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
