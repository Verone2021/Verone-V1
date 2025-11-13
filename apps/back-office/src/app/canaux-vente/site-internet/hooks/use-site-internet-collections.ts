/**
 * Hook: useSiteInternetCollections
 * Gère visibilité collections pour le canal site internet
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

// Note: Using 'any' type because visible_channels was added via migration
// and TypeScript types may not be fully up-to-date yet
type Collection = any;

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

  // Cast to Collection type (includes visible_channels which was added via migration)
  return (data || []) as any[];
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
  collection: Collection,
  channelId: string
): boolean {
  // Si visible_channels est NULL → visible partout
  if (!collection.visible_channels) {
    return collection.is_active;
  }

  // Si array vide → visible nulle part
  if (collection.visible_channels.length === 0) {
    return false;
  }

  // Sinon check si channel_id dans array
  return (
    collection.is_active && collection.visible_channels.includes(channelId)
  );
}

/**
 * Toggle visibilité collection sur canal site internet
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

      // Cast to any to access visible_channels (added via migration)
      const collectionData = collection as any;

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
          (id: string) => id !== channel.id
        );
      }

      // 4. Update collection
      const { error: updateError } = await supabase
        .from('collections')
        .update({
          visible_channels: newVisibleChannels as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', collectionId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
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
    onSuccess: () => {
      queryClient.invalidateQueries({
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

      // Cast to any to access visible_channels
      const collectionsData = collections as any[];

      const total = collectionsData.length;
      const active = collectionsData.filter((c: any) => c.is_active).length;
      const visible = collectionsData.filter(
        (c: any) =>
          c.is_active &&
          (c.visible_channels === null ||
            c.visible_channels.includes(channel.id))
      ).length;
      const featured = collectionsData.filter((c: any) => c.is_featured).length;

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
