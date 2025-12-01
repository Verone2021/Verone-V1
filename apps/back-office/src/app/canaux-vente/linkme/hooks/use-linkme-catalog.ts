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
  show_supplier: boolean;
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
  product_supplier_name: string | null;
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
  const { data, error } = await (supabase as any).rpc(
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
  const { data, error } = await (supabase as any)
    .from('products')
    .select(
      `
      id,
      name,
      sku,
      cost_price,
      stock_real,
      product_status,
      subcategory_id,
      subcategories:subcategory_id(name)
    `
    )
    .eq('product_status', 'active')
    .order('name');

  if (error) {
    console.error('Erreur fetch produits éligibles:', error);
    throw error;
  }

  // Récupérer les images primaires pour ces produits
  const productIds = (data || []).map((p: any) => p.id);
  const { data: images } = await (supabase as any)
    .from('product_images')
    .select('product_id, public_url')
    .in('product_id', productIds)
    .eq('is_primary', true);

  const imageMap = new Map(
    (images || []).map((img: any) => [img.product_id, img.public_url])
  );

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
        max_margin_rate: 20.0,
        min_margin_rate: 0.0,
        suggested_margin_rate: 10.0,
      }));

      const { error } = await (supabase as any)
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
      const { error } = await (supabase as any)
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
      const { error } = await (supabase as any)
        .from('linkme_catalog_products')
        .update({ is_enabled: isEnabled })
        .eq('id', catalogProductId);

      if (error) throw error;
    },
    onMutate: async ({ catalogProductId, isEnabled }) => {
      await queryClient.cancelQueries({
        queryKey: ['linkme-catalog-products'],
      });

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
      const { error } = await (supabase as any)
        .from('linkme_catalog_products')
        .update({ is_public_showcase: isPublicShowcase })
        .eq('id', catalogProductId);

      if (error) throw error;
    },
    onMutate: async ({ catalogProductId, isPublicShowcase }) => {
      await queryClient.cancelQueries({
        queryKey: ['linkme-catalog-products'],
      });

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
      const { error } = await (supabase as any)
        .from('linkme_catalog_products')
        .update({ is_featured: isFeatured })
        .eq('id', catalogProductId);

      if (error) throw error;
    },
    onMutate: async ({ catalogProductId, isFeatured }) => {
      await queryClient.cancelQueries({
        queryKey: ['linkme-catalog-products'],
      });

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
 * Hook: toggle affichage fournisseur (show_supplier)
 * Contrôle si le fournisseur de ce produit apparaît dans "Nos partenaires"
 */
export function useToggleShowSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      catalogProductId,
      showSupplier,
    }: {
      catalogProductId: string;
      showSupplier: boolean;
    }) => {
      const { error } = await (supabase as any)
        .from('linkme_catalog_products')
        .update({ show_supplier: showSupplier })
        .eq('id', catalogProductId);

      if (error) throw error;
    },
    onMutate: async ({ catalogProductId, showSupplier }) => {
      await queryClient.cancelQueries({
        queryKey: ['linkme-catalog-products'],
      });

      const previousData = queryClient.getQueryData<LinkMeCatalogProduct[]>([
        'linkme-catalog-products',
      ]);

      if (previousData) {
        queryClient.setQueryData<LinkMeCatalogProduct[]>(
          ['linkme-catalog-products'],
          old =>
            old?.map(product =>
              product.id === catalogProductId
                ? { ...product, show_supplier: showSupplier }
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
      const { error } = await (supabase as any)
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
      const { error } = await (supabase as any)
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
      const { data } = await (supabase as any).rpc(
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
        enabledPercentage:
          products.length > 0 ? (enabled / products.length) * 100 : 0,
      };
    },
    staleTime: 60000,
  });
}

// ============================================================================
// HOOKS PAGE DÉTAIL PRODUIT (channel_pricing unifié)
// ============================================================================

/** ID du canal LinkMe */
const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

/**
 * Interface détail produit pour page [id]
 */
export interface LinkMeProductDetail {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  cost_price: number;
  custom_price_ht: number | null;
  is_active: boolean;
  is_public_showcase: boolean;
  is_featured: boolean;
  show_supplier: boolean;
  min_margin_rate: number;
  max_margin_rate: number;
  suggested_margin_rate: number | null;
  channel_commission_rate: number | null;
  custom_title: string | null;
  custom_description: string | null;
  custom_selling_points: string[] | null;
  primary_image_url: string | null;
  stock_real: number;
  product_is_active: boolean;
  product_family_name: string | null;
  product_category_name: string | null;
  product_supplier_name: string | null;
  views_count: number;
  selections_count: number;
  display_order: number;
}

/**
 * Fetch détail d'un produit LinkMe depuis channel_pricing
 */
async function fetchLinkMeProductDetail(
  channelPricingId: string
): Promise<LinkMeProductDetail | null> {
  // Requête channel_pricing avec JOIN products
  const { data: cpData, error: cpError } = await (supabase as any)
    .from('channel_pricing')
    .select(
      `
      id,
      product_id,
      is_active,
      is_public_showcase,
      is_featured,
      show_supplier,
      min_margin_rate,
      max_margin_rate,
      suggested_margin_rate,
      channel_commission_rate,
      custom_title,
      custom_description,
      custom_selling_points,
      custom_price_ht,
      views_count,
      selections_count,
      display_order,
      products!inner(
        id,
        sku,
        name,
        cost_price,
        stock_real,
        product_status,
        subcategories:subcategory_id(name),
        supplier:supplier_id(legal_name),
        product_images(public_url, is_primary)
      )
    `
    )
    .eq('id', channelPricingId)
    .eq('channel_id', LINKME_CHANNEL_ID)
    .single();

  if (cpError) {
    console.error('Erreur fetch détail produit LinkMe:', cpError);
    throw cpError;
  }

  if (!cpData) return null;

  const product = cpData.products;

  return {
    id: cpData.id,
    product_id: cpData.product_id,
    sku: product.sku,
    name: product.name,
    cost_price: product.cost_price || 0,
    custom_price_ht: cpData.custom_price_ht,
    is_active: cpData.is_active ?? true,
    is_public_showcase: cpData.is_public_showcase ?? false,
    is_featured: cpData.is_featured ?? false,
    show_supplier: cpData.show_supplier ?? false,
    min_margin_rate: cpData.min_margin_rate ?? 0,
    max_margin_rate: cpData.max_margin_rate ?? 100,
    suggested_margin_rate: cpData.suggested_margin_rate,
    channel_commission_rate: cpData.channel_commission_rate,
    custom_title: cpData.custom_title,
    custom_description: cpData.custom_description,
    custom_selling_points: cpData.custom_selling_points,
    primary_image_url:
      product.product_images?.find(
        (img: { is_primary: boolean }) => img.is_primary
      )?.public_url ||
      product.product_images?.[0]?.public_url ||
      null,
    stock_real: product.stock_real || 0,
    product_is_active: product.product_status === 'active',
    product_family_name: null,
    product_category_name: product.subcategories?.name || null,
    product_supplier_name: product.supplier?.legal_name || null,
    views_count: cpData.views_count ?? 0,
    selections_count: cpData.selections_count ?? 0,
    display_order: cpData.display_order ?? 0,
  };
}

/**
 * Hook: récupère le détail d'un produit LinkMe
 */
export function useLinkMeProductDetail(channelPricingId: string | null) {
  return useQuery({
    queryKey: ['linkme-product-detail', channelPricingId],
    queryFn: () =>
      channelPricingId ? fetchLinkMeProductDetail(channelPricingId) : null,
    enabled: !!channelPricingId,
    staleTime: 30000,
  });
}

/**
 * Hook: mettre à jour pricing produit (channel_pricing)
 */
export function useUpdateLinkMePricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      channelPricingId,
      pricing,
    }: {
      channelPricingId: string;
      pricing: {
        custom_price_ht?: number | null;
        min_margin_rate?: number;
        max_margin_rate?: number;
        suggested_margin_rate?: number | null;
        channel_commission_rate?: number | null;
      };
    }) => {
      const { error } = await (supabase as any)
        .from('channel_pricing')
        .update(pricing)
        .eq('id', channelPricingId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['linkme-product-detail', variables.channelPricingId],
      });
      queryClient.invalidateQueries({ queryKey: ['linkme-catalog-products'] });
    },
  });
}

/**
 * Hook: mettre à jour metadata custom (channel_pricing)
 */
export function useUpdateLinkMeMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      channelPricingId,
      metadata,
    }: {
      channelPricingId: string;
      metadata: {
        custom_title?: string | null;
        custom_description?: string | null;
        custom_selling_points?: string[] | null;
      };
    }) => {
      const { error } = await (supabase as any)
        .from('channel_pricing')
        .update(metadata)
        .eq('id', channelPricingId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['linkme-product-detail', variables.channelPricingId],
      });
      queryClient.invalidateQueries({ queryKey: ['linkme-catalog-products'] });
    },
  });
}

/**
 * Hook: toggle pour page détail (unifié channel_pricing)
 */
export function useToggleLinkMeProductField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      channelPricingId,
      field,
      value,
    }: {
      channelPricingId: string;
      field:
        | 'is_active'
        | 'is_public_showcase'
        | 'is_featured'
        | 'show_supplier';
      value: boolean;
    }) => {
      const { error } = await (supabase as any)
        .from('channel_pricing')
        .update({ [field]: value })
        .eq('id', channelPricingId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['linkme-product-detail', variables.channelPricingId],
      });
      queryClient.invalidateQueries({ queryKey: ['linkme-catalog-products'] });
    },
  });
}
