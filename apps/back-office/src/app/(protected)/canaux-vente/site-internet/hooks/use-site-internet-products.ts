/**
 * Hook: useSiteInternetProducts
 * Récupère produits publiés site internet via RPC get_site_internet_products()
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import type { SiteInternetProduct } from '../types';

const supabase = createClient();

/**
 * Fetch produits site internet
 */
async function fetchSiteInternetProducts(): Promise<SiteInternetProduct[]> {
  const { data, error } = await supabase.rpc(
    'get_site_internet_products' as any
  );

  if (error) {
    console.error('Erreur fetch produits site internet:', error);
    throw error;
  }

  return (data as unknown as SiteInternetProduct[]) ?? [];
}

/**
 * Hook principal: récupère produits site internet
 */
export function useSiteInternetProducts() {
  return useQuery({
    queryKey: ['site-internet-products'],
    queryFn: fetchSiteInternetProducts,
    staleTime: 30000, // 30 secondes
    refetchOnWindowFocus: true,
  });
}

/**
 * Toggle publication produit (avec optimistic update)
 */
export function useToggleProductPublication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      isPublished,
    }: {
      productId: string;
      isPublished: boolean;
    }) => {
      const { error } = await supabase
        .from('products')
        .update({
          is_published_online: isPublished,
          publication_date: isPublished ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (error) throw error;
    },
    onMutate: async ({ productId, isPublished }) => {
      // 1. Cancel ongoing queries
      await queryClient.cancelQueries({
        queryKey: ['site-internet-products'],
      });

      // 2. Snapshot previous value
      const previousData = queryClient.getQueryData<SiteInternetProduct[]>([
        'site-internet-products',
      ]);

      // 3. Optimistically update cache
      if (previousData) {
        queryClient.setQueryData<SiteInternetProduct[]>(
          ['site-internet-products'],
          old =>
            old?.map(product =>
              product.product_id === productId
                ? { ...product, is_published: isPublished }
                : product
            ) ?? []
        );
      }

      // 4. Return context for rollback
      return { previousData };
    },
    onError: (err, variables, context) => {
      // 5. Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          ['site-internet-products'],
          context.previousData
        );
      }
    },
    onSettled: async () => {
      // 6. Refetch to sync with server
      await queryClient.invalidateQueries({
        queryKey: ['site-internet-products'],
      });
    },
  });
}

/**
 * Ajouter produits au canal site internet
 */
export function useAddProductsToSiteInternet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productIds: string[]) => {
      // 1. Récupérer canal site_internet id
      const { data: channel } = await supabase
        .from('sales_channels')
        .select('id')
        .eq('code', 'site_internet')
        .single();

      if (!channel) throw new Error('Canal site_internet non trouvé');

      // 2. Créer métadonnées canal pour chaque produit (si n'existe pas)
      const { error: metadataError } = await supabase
        .from('channel_product_metadata')
        .upsert(
          productIds.map(productId => ({
            product_id: productId,
            channel_id: channel.id,
            metadata: {},
          })),
          { onConflict: 'product_id,channel_id' }
        );

      if (metadataError) throw metadataError;

      // 3. Publier produits
      const { error: publishError } = await supabase
        .from('products')
        .update({
          is_published_online: true,
          publication_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .in('id', productIds);

      if (publishError) throw publishError;

      return productIds.length;
    },
    onSuccess: async count => {
      await queryClient.invalidateQueries({
        queryKey: ['site-internet-products'],
      });
      console.warn(`✅ ${count} produits ajoutés au site internet`);
    },
  });
}

/**
 * Supprimer produit du canal site internet
 */
export function useRemoveProductFromSiteInternet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      // 1. Dépublier produit
      const { error: unpublishError } = await supabase
        .from('products')
        .update({
          is_published_online: false,
          unpublication_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (unpublishError) throw unpublishError;

      // Note: On ne supprime PAS les métadonnées canal (historique)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['site-internet-products'],
      });
    },
  });
}

/**
 * Mettre à jour métadonnées SEO produit
 */
export function useUpdateProductMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      metadata,
    }: {
      productId: string;
      metadata: {
        custom_title?: string;
        custom_description?: string;
        metadata?: Record<string, any>;
      };
    }) => {
      // Récupérer canal site_internet id
      const { data: channel } = await supabase
        .from('sales_channels')
        .select('id')
        .eq('code', 'site_internet')
        .single();

      if (!channel) throw new Error('Canal site_internet non trouvé');

      // Upsert métadonnées
      const { error } = await supabase.from('channel_product_metadata').upsert(
        {
          product_id: productId,
          channel_id: channel.id,
          ...metadata,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'product_id,channel_id' }
      );

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['site-internet-products'],
      });
    },
  });
}

/**
 * Stats produits site internet
 */
export function useSiteInternetProductsStats() {
  return useQuery({
    queryKey: ['site-internet-products-stats'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_site_internet_products' as any);
      const products = data as unknown as SiteInternetProduct[];

      if (!products) return null;

      const published = products.filter(p => p.is_published).length;
      const eligible = products.filter(p => p.is_eligible).length;
      const withVariants = products.filter(p => p.has_variants).length;

      return {
        total: products.length,
        published,
        eligible,
        withVariants,
        publishedPercentage: (published / products.length) * 100,
      };
    },
    staleTime: 60000, // 1 minute
  });
}
