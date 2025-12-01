/**
 * Hook: useLinkMeCatalog
 * Gestion du catalogue LinkMe (produits disponibles pour les affiliés)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

/**
 * Interface produit catalogue LinkMe
 */
export interface LinkMeCatalogProduct {
  id: string;
  product_id: string;
  is_enabled: boolean;
  is_public_showcase: boolean;
  max_margin_rate: number;
  min_margin_rate: number;
  suggested_margin_rate: number;
  custom_title: string | null;
  custom_description: string | null;
  custom_selling_points: string[] | null;
  linkme_commission_rate: number | null;
  views_count: number;
  selections_count: number;
  display_order: number;
  is_featured: boolean;
  // Champs produit joint
  product_name: string;
  product_reference: string;
  product_price_ht: number;
  product_image_url: string | null;
  product_stock_real: number;
  product_is_active: boolean;
  product_family_name: string | null;
  product_category_name: string | null;
}

/**
 * Interface produit éligible (non encore dans le catalogue LinkMe)
 */
export interface EligibleProduct {
  id: string;
  name: string;
  reference: string;
  price_ht: number;
  primary_image_url: string | null;
  stock_real: number;
  is_active: boolean;
  family_name: string | null;
  category_name: string | null;
}

/**
 * Fetch produits du catalogue LinkMe
 */
async function fetchLinkMeCatalogProducts(): Promise<LinkMeCatalogProduct[]> {
  const { data, error } = await supabase.rpc(
    'get_linkme_catalog_products_for_affiliate' as any
  );

  if (error) {
    console.error('Erreur fetch catalogue LinkMe:', error);
    throw error;
  }

  return (data as unknown as LinkMeCatalogProduct[]) || [];
}

/**
 * Fetch tous les produits éligibles (actifs - stock non requis)
 * Note: Tous les produits actifs sont affichés, même sans stock
 */
async function fetchEligibleProducts(): Promise<EligibleProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      sku,
      cost_price,
      stock_real,
      product_status,
      subcategory_id,
      subcategories:subcategory_id(name)
    `)
    .eq('product_status', 'active')
    .order('name');

  if (error) {
    console.error('Erreur fetch produits éligibles:', error);
    throw error;
  }

  // Récupérer les images primaires pour ces produits
  const productIds = (data || []).map((p: any) => p.id);
  const { data: images } = await supabase
    .from('product_images')
    .select('product_id, public_url')
    .in('product_id', productIds)
    .eq('is_primary', true);

  const imageMap = new Map((images || []).map((img: any) => [img.product_id, img.public_url]));

  // Mapper les données
  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    reference: p.sku,
    price_ht: p.cost_price,
    primary_image_url: imageMap.get(p.id) || null,
    stock_real: p.stock_real,
    is_active: p.product_status === 'active',
    family_name: null,
    category_name: p.subcategories?.name || null,
  }));
}

/**
 * Hook: récupère les produits du catalogue LinkMe
 */
export function useLinkMeCatalogProducts() {
  return useQuery({
    queryKey: ['linkme-catalog-products'],
    queryFn: fetchLinkMeCatalogProducts,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook: récupère les produits éligibles (tous produits actifs)
 */
export function useEligibleProducts() {
  return useQuery({
    queryKey: ['linkme-eligible-products'],
    queryFn: fetchEligibleProducts,
    staleTime: 60000,
  });
}

/**
 * Hook: ajouter des produits au catalogue LinkMe
 */
export function useAddProductsToCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productIds: string[]) => {
      const productsToInsert = productIds.map(productId => ({
        product_id: productId,
        is_enabled: true,
        is_public_showcase: false,
        max_margin_rate: 20.00,
        min_margin_rate: 0.00,
        suggested_margin_rate: 10.00,
      }));

      const { error } = await supabase
        .from('linkme_catalog_products')
        .upsert(productsToInsert, { onConflict: 'product_id' });

      if (error) throw error;

      return productIds.length;
    },
    onSuccess: count => {
      queryClient.invalidateQueries({ queryKey: ['linkme-catalog-products'] });
      console.log(`✅ ${count} produits ajoutés au catalogue LinkMe`);
    },
  });
}

/**
 * Hook: supprimer un produit du catalogue LinkMe
 */
export function useRemoveProductFromCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (catalogProductId: string) => {
      const { error } = await supabase
        .from('linkme_catalog_products')
        .delete()
        .eq('id', catalogProductId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkme-catalog-products'] });
    },
  });
}

/**
 * Hook: toggle activation produit (is_enabled)
 */
export function useToggleProductEnabled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      catalogProductId,
      isEnabled,
    }: {
      catalogProductId: string;
      isEnabled: boolean;
    }) => {
      const { error } = await supabase
        .from('linkme_catalog_products')
        .update({ is_enabled: isEnabled })
        .eq('id', catalogProductId);

      if (error) throw error;
    },
    onMutate: async ({ catalogProductId, isEnabled }) => {
      await queryClient.cancelQueries({ queryKey: ['linkme-catalog-products'] });

      const previousData = queryClient.getQueryData<LinkMeCatalogProduct[]>([
        'linkme-catalog-products',
      ]);

      if (previousData) {
        queryClient.setQueryData<LinkMeCatalogProduct[]>(
          ['linkme-catalog-products'],
          old =>
            old?.map(product =>
              product.id === catalogProductId
                ? { ...product, is_enabled: isEnabled }
                : product
            ) ?? []
        );
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ['linkme-catalog-products'],
          context.previousData
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['linkme-catalog-products'] });
    },
  });
}

/**
 * Hook: toggle visibilité vitrine (is_public_showcase)
 */
export function useToggleProductShowcase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      catalogProductId,
      isPublicShowcase,
    }: {
      catalogProductId: string;
      isPublicShowcase: boolean;
    }) => {
      const { error } = await supabase
        .from('linkme_catalog_products')
        .update({ is_public_showcase: isPublicShowcase })
        .eq('id', catalogProductId);

      if (error) throw error;
    },
    onMutate: async ({ catalogProductId, isPublicShowcase }) => {
      await queryClient.cancelQueries({ queryKey: ['linkme-catalog-products'] });

      const previousData = queryClient.getQueryData<LinkMeCatalogProduct[]>([
        'linkme-catalog-products',
      ]);

      if (previousData) {
        queryClient.setQueryData<LinkMeCatalogProduct[]>(
          ['linkme-catalog-products'],
          old =>
            old?.map(product =>
              product.id === catalogProductId
                ? { ...product, is_public_showcase: isPublicShowcase }
                : product
            ) ?? []
        );
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ['linkme-catalog-products'],
          context.previousData
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['linkme-catalog-products'] });
    },
  });
}

/**
 * Hook: toggle produit vedette (is_featured)
 */
export function useToggleProductFeatured() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      catalogProductId,
      isFeatured,
    }: {
      catalogProductId: string;
      isFeatured: boolean;
    }) => {
      const { error } = await supabase
        .from('linkme_catalog_products')
        .update({ is_featured: isFeatured })
        .eq('id', catalogProductId);

      if (error) throw error;
    },
    onMutate: async ({ catalogProductId, isFeatured }) => {
      await queryClient.cancelQueries({ queryKey: ['linkme-catalog-products'] });

      const previousData = queryClient.getQueryData<LinkMeCatalogProduct[]>([
        'linkme-catalog-products',
      ]);

      if (previousData) {
        queryClient.setQueryData<LinkMeCatalogProduct[]>(
          ['linkme-catalog-products'],
          old =>
            old?.map(product =>
              product.id === catalogProductId
                ? { ...product, is_featured: isFeatured }
                : product
            ) ?? []
        );
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ['linkme-catalog-products'],
          context.previousData
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['linkme-catalog-products'] });
    },
  });
}

/**
 * Hook: mettre à jour les paramètres de marge
 */
export function useUpdateMarginSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      catalogProductId,
      marginSettings,
    }: {
      catalogProductId: string;
      marginSettings: {
        min_margin_rate?: number;
        max_margin_rate?: number;
        suggested_margin_rate?: number;
      };
    }) => {
      const { error } = await supabase
        .from('linkme_catalog_products')
        .update(marginSettings)
        .eq('id', catalogProductId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkme-catalog-products'] });
    },
  });
}

/**
 * Hook: mettre à jour les métadonnées custom
 */
export function useUpdateCustomMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      catalogProductId,
      metadata,
    }: {
      catalogProductId: string;
      metadata: {
        custom_title?: string | null;
        custom_description?: string | null;
        custom_selling_points?: string[] | null;
      };
    }) => {
      const { error } = await supabase
        .from('linkme_catalog_products')
        .update(metadata)
        .eq('id', catalogProductId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkme-catalog-products'] });
    },
  });
}

/**
 * Hook: statistiques du catalogue
 */
export function useLinkMeCatalogStats() {
  return useQuery({
    queryKey: ['linkme-catalog-stats'],
    queryFn: async () => {
      const { data } = await supabase.rpc(
        'get_linkme_catalog_products_for_affiliate' as any
      );
      const products = data as unknown as LinkMeCatalogProduct[];

      if (!products) return null;

      const enabled = products.filter(p => p.is_enabled).length;
      const showcase = products.filter(p => p.is_public_showcase).length;
      const featured = products.filter(p => p.is_featured).length;

      return {
        total: products.length,
        enabled,
        showcase,
        featured,
        enabledPercentage: products.length > 0 ? (enabled / products.length) * 100 : 0,
      };
    },
    staleTime: 60000,
  });
}
