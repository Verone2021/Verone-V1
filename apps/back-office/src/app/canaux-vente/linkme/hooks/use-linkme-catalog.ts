/**
 * Hook: useLinkMeCatalog
 * Gestion du catalogue LinkMe (produits disponibles pour les affiliés)
 *
 * ARCHITECTURE : Utilise `channel_pricing` (table générique multi-canaux)
 * Le canal LinkMe a l'ID: 93c68db1-5a30-4168-89ec-6383152be405
 *
 * MIGRATION 2025-12-02:
 * - Remplace linkme_catalog_products (OBSOLÈTE) par channel_pricing
 * - is_enabled → is_active
 * - linkme_commission_rate → channel_commission_rate
 * - selling_price_ht → custom_price_ht
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import type { LinkMeProductDetail } from '../types';

// ID du canal LinkMe dans sales_channels
const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

/**
 * Helper: créer un client Supabase (à l'intérieur des fonctions, pas au niveau module)
 * Évite les problèmes de contexte d'authentification au chargement du module
 */
function getSupabaseClient() {
  return createClient();
}

/**
 * Interface produit catalogue LinkMe
 * Mappé depuis channel_pricing + products
 */
export interface LinkMeCatalogProduct {
  id: string;
  product_id: string;
  is_enabled: boolean; // Mapped from is_active
  is_public_showcase: boolean;
  show_supplier: boolean;
  max_margin_rate: number | null;
  min_margin_rate: number | null;
  suggested_margin_rate: number | null;
  custom_title: string | null;
  custom_description: string | null;
  custom_selling_points: string[] | null;
  linkme_commission_rate: number | null; // Mapped from channel_commission_rate (= channel_commission_rate)
  views_count: number;
  selections_count: number;
  display_order: number;
  is_featured: boolean;
  // Champs Pricing pour complétude (9 champs total)
  public_price_ht: number | null; // Tarif public HT
  channel_commission_rate: number | null; // Commission LinkMe (alias direct)
  buffer_rate: number | null; // Marge de sécurité (décimal, ex: 0.05 = 5%)
  // Champs produit joint
  product_name: string;
  product_reference: string;
  product_price_ht: number; // custom_price_ht ou cost_price fallback
  product_selling_price_ht: number | null; // Prix de vente HT (= custom_price_ht s'il existe)
  product_image_url: string | null;
  product_stock_real: number;
  product_is_active: boolean;
  // Hiérarchie de catégorisation
  subcategory_id: string | null;
  subcategory_name: string | null;
  category_id: string | null;
  category_name: string | null;
  family_id: string | null;
  family_name: string | null;
  /** Chemin complet: "Famille > Catégorie > Sous-catégorie" */
  category_full_path: string | null;
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
 * Fetch produits du catalogue LinkMe depuis channel_pricing
 */
async function fetchLinkMeCatalogProducts(): Promise<LinkMeCatalogProduct[]> {
  const supabase = getSupabaseClient();

  // Requête channel_pricing avec JOIN products
  const { data, error } = await supabase
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
      buffer_rate,
      custom_title,
      custom_description,
      custom_selling_points,
      custom_price_ht,
      public_price_ht,
      views_count,
      selections_count,
      display_order,
      products!inner(
        id,
        sku,
        name,
        cost_price,
        eco_tax_default,
        margin_percentage,
        stock_real,
        product_status,
        subcategory_id,
        supplier_id
      )
    `
    )
    .eq('channel_id', LINKME_CHANNEL_ID)
    .eq('is_active', true);

  if (error) {
    console.error('Erreur fetch catalogue LinkMe:', error);
    throw error;
  }

  if (!data || data.length === 0) return [];

  // Récupérer les images primaires pour ces produits
  const productIds = data.map((cp: any) => cp.product_id);
  const { data: images } = await supabase
    .from('product_images')
    .select('product_id, public_url')
    .in('product_id', productIds)
    .eq('is_primary', true);

  const imageMap = new Map(
    (images || []).map((img: any) => [img.product_id, img.public_url])
  );

  // Récupérer les sous-catégories avec hiérarchie complète (catégorie + famille)
  const subcategoryIds = data
    .map((cp: any) => cp.products?.subcategory_id)
    .filter(Boolean);

  const { data: subcategoriesWithHierarchy } = await supabase
    .from('subcategories')
    .select(
      `
      id,
      name,
      category:categories!inner(
        id,
        name,
        family:families!inner(
          id,
          name
        )
      )
    `
    )
    .in('id', subcategoryIds);

  // Map pour accès rapide à la hiérarchie complète
  interface CategoryHierarchy {
    subcategory_id: string;
    subcategory_name: string;
    category_id: string;
    category_name: string;
    family_id: string;
    family_name: string;
    full_path: string;
  }

  const hierarchyMap = new Map<string, CategoryHierarchy>();
  (subcategoriesWithHierarchy || []).forEach((sc: any) => {
    const familyName = sc.category?.family?.name || '';
    const categoryName = sc.category?.name || '';
    const subcategoryName = sc.name || '';

    hierarchyMap.set(sc.id, {
      subcategory_id: sc.id,
      subcategory_name: subcategoryName,
      category_id: sc.category?.id || null,
      category_name: categoryName,
      family_id: sc.category?.family?.id || null,
      family_name: familyName,
      full_path: [familyName, categoryName, subcategoryName]
        .filter(Boolean)
        .join(' > '),
    });
  });

  // Récupérer les fournisseurs
  const supplierIds = data
    .map((cp: any) => cp.products?.supplier_id)
    .filter(Boolean);
  const { data: suppliers } = await supabase
    .from('organisations')
    .select('id, legal_name')
    .in('id', supplierIds);

  const supplierMap = new Map(
    (suppliers || []).map((s: any) => [s.id, s.legal_name])
  );

  // Mapper les données avec hiérarchie complète
  return data.map((cp: any) => {
    const subcategoryId = cp.products?.subcategory_id;
    const hierarchy = subcategoryId ? hierarchyMap.get(subcategoryId) : null;

    return {
      id: cp.id,
      product_id: cp.product_id,
      is_enabled: cp.is_active ?? true, // Map is_active → is_enabled
      is_public_showcase: cp.is_public_showcase ?? false,
      is_featured: cp.is_featured ?? false,
      show_supplier: cp.show_supplier ?? false,
      min_margin_rate: cp.min_margin_rate ?? null, // null si non défini
      max_margin_rate: cp.max_margin_rate ?? null, // null si non défini
      suggested_margin_rate: cp.suggested_margin_rate ?? null, // null si non défini
      custom_title: cp.custom_title,
      custom_description: cp.custom_description,
      custom_selling_points: cp.custom_selling_points,
      linkme_commission_rate: cp.channel_commission_rate, // Map channel_commission_rate
      // Champs Pricing pour complétude
      public_price_ht: cp.public_price_ht ?? null,
      channel_commission_rate: cp.channel_commission_rate ?? null, // Alias direct
      buffer_rate: cp.buffer_rate ?? null, // Marge de sécurité
      views_count: cp.views_count ?? 0,
      selections_count: cp.selections_count ?? 0,
      display_order: cp.display_order ?? 0,
      product_name: cp.products?.name || '',
      product_reference: cp.products?.sku || '',
      product_price_ht: cp.products?.cost_price ?? 0, // Toujours cost_price (prix d'achat réel)
      // Prix de vente HT = custom_price_ht si défini (null si non défini = pas validé)
      product_selling_price_ht: cp.custom_price_ht ?? null,
      product_image_url: imageMap.get(cp.product_id) || null,
      product_stock_real: cp.products?.stock_real ?? 0,
      product_is_active: cp.products?.product_status === 'active',
      // Hiérarchie de catégorisation
      subcategory_id: hierarchy?.subcategory_id || null,
      subcategory_name: hierarchy?.subcategory_name || null,
      category_id: hierarchy?.category_id || null,
      category_name: hierarchy?.category_name || null,
      family_id: hierarchy?.family_id || null,
      family_name: hierarchy?.family_name || null,
      category_full_path: hierarchy?.full_path || null,
      product_supplier_name: supplierMap.get(cp.products?.supplier_id) || null,
    };
  });
}

/**
 * Fetch tous les produits éligibles (actifs - stock non requis)
 * Note: Tous les produits actifs sont affichés, même sans stock
 */
async function fetchEligibleProducts(): Promise<EligibleProduct[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
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
  const { data: images } = await supabase
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
    price_ht: p.cost_price || 0,
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
 * Utilise fonction RPC SECURITY DEFINER pour bypasser RLS
 */
export function useAddProductsToCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productIds: string[]) => {
      const supabase = getSupabaseClient();
      // Appel RPC SECURITY DEFINER pour bypasser RLS
      // Note: Cast via unknown car fonction RPC custom pas dans types Supabase générés
      const rpcCall = supabase.rpc as unknown as (
        fn: string,
        args: { p_product_ids: string[] }
      ) => Promise<{ data: number | null; error: { message: string } | null }>;

      const { data, error } = await rpcCall('add_products_to_linkme_catalog', {
        p_product_ids: productIds,
      });

      if (error) throw new Error(error.message);

      return data ?? 0;
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
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('channel_pricing')
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
 * Hook: toggle activation produit (is_active dans channel_pricing)
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
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('channel_pricing')
        .update({ is_active: isEnabled }) // Map is_enabled → is_active
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
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('channel_pricing')
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
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('channel_pricing')
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
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('channel_pricing')
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
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('channel_pricing')
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
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('channel_pricing')
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
      const products = await fetchLinkMeCatalogProducts();

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
// HOOKS PAGE DÉTAIL PRODUIT (channel_pricing + products JOIN)
// ============================================================================

// Type LinkMeProductDetail importé depuis ../types

/**
 * Fetch détail d'un produit LinkMe depuis channel_pricing
 * Utilise l'ID de channel_pricing
 */
async function fetchLinkMeProductDetail(
  catalogProductId: string
): Promise<LinkMeProductDetail | null> {
  const supabase = getSupabaseClient();

  // Requête channel_pricing avec JOIN products
  const { data: cpData, error: cpError } = await supabase
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
      buffer_rate,
      custom_title,
      custom_description,
      custom_selling_points,
      custom_price_ht,
      public_price_ht,
      views_count,
      selections_count,
      display_order,
      products!inner(
        id,
        sku,
        name,
        cost_price,
        eco_tax_default,
        margin_percentage,
        stock_real,
        product_status,
        subcategory_id,
        supplier_id,
        weight,
        dimensions,
        suitable_rooms,
        description,
        selling_points
      )
    `
    )
    .eq('id', catalogProductId)
    .single();

  if (cpError) {
    console.error('Erreur fetch détail produit LinkMe:', cpError);
    throw cpError;
  }

  if (!cpData) return null;

  // Note: buffer_rate et autres colonnes existent en DB mais pas dans les types Git - utiliser any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cp = cpData as any;
  const product = cp.products;

  // Récupérer l'image primaire
  const { data: images } = await supabase
    .from('product_images')
    .select('public_url')
    .eq('product_id', product.id)
    .eq('is_primary', true)
    .limit(1);

  const primaryImageUrl = images?.[0]?.public_url || null;

  // Récupérer la sous-catégorie
  let categoryName: string | null = null;
  if (product.subcategory_id) {
    const { data: subcat } = await supabase
      .from('subcategories')
      .select('name')
      .eq('id', product.subcategory_id)
      .single();
    categoryName = subcat?.name || null;
  }

  // Récupérer le fournisseur
  let supplierName: string | null = null;
  if (product.supplier_id) {
    const { data: supplier } = await supabase
      .from('organisations')
      .select('legal_name')
      .eq('id', product.supplier_id)
      .single();
    supplierName = supplier?.legal_name || null;
  }

  // Calcul du prix minimum de vente: (cost_price + eco_tax) * (1 + margin/100)
  const costPrice = product.cost_price || 0;
  const ecoTax = product.eco_tax_default || 0;
  const marginPct = product.margin_percentage ?? 25; // Défaut 25%
  const minSellingPriceHt =
    costPrice > 0 ? (costPrice + ecoTax) * (1 + marginPct / 100) : null;

  return {
    id: cp.id,
    product_id: cp.product_id,
    sku: product.sku,
    name: product.name,
    selling_price_ht: cp.custom_price_ht ?? minSellingPriceHt, // custom_price_ht ou prix minimum calculé
    public_price_ht: cp.public_price_ht ?? null, // Tarif public (éditable)
    cost_price: product.cost_price || 0,
    min_selling_price_ht: minSellingPriceHt, // Prix minimum calculé (lecture seule)
    is_enabled: cp.is_active ?? true, // Map is_active → is_enabled
    is_public_showcase: cp.is_public_showcase ?? false,
    is_featured: cp.is_featured ?? false,
    show_supplier: cp.show_supplier ?? false,
    min_margin_rate: cp.min_margin_rate ?? 0,
    max_margin_rate: cp.max_margin_rate ?? 100,
    suggested_margin_rate: cp.suggested_margin_rate,
    linkme_commission_rate: cp.channel_commission_rate, // Map channel_commission_rate
    buffer_rate: cp.buffer_rate ?? 0.05, // Marge de sécurité (défaut 5%)
    custom_title: cp.custom_title,
    custom_description: cp.custom_description,
    custom_selling_points: cp.custom_selling_points,
    // Valeurs source depuis produit (pour système de validation "copier")
    source_description: product.description || null,
    source_selling_points: Array.isArray(product.selling_points)
      ? product.selling_points
      : null,
    primary_image_url: primaryImageUrl,
    stock_real: product.stock_real || 0,
    product_is_active: product.product_status === 'active',
    product_family_name: null,
    product_category_name: categoryName,
    product_supplier_name: supplierName,
    subcategory_id: product.subcategory_id,
    supplier_id: product.supplier_id,
    weight_kg: product.weight || null,
    dimensions_cm: product.dimensions || null,
    room_types: product.suitable_rooms || null,
    views_count: cp.views_count ?? 0,
    selections_count: cp.selections_count ?? 0,
    display_order: cp.display_order ?? 0,
  };
}

/**
 * Hook: récupère le détail d'un produit LinkMe
 * @param catalogProductId - ID de channel_pricing
 */
export function useLinkMeProductDetail(catalogProductId: string | null) {
  return useQuery({
    queryKey: ['linkme-product-detail', catalogProductId],
    queryFn: () =>
      catalogProductId ? fetchLinkMeProductDetail(catalogProductId) : null,
    enabled: !!catalogProductId,
    staleTime: 30000,
  });
}

/**
 * Hook: mettre à jour marges produit LinkMe (channel_pricing)
 */
export function useUpdateLinkMePricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      catalogProductId,
      pricing,
    }: {
      catalogProductId: string;
      pricing: {
        min_margin_rate?: number;
        max_margin_rate?: number;
        suggested_margin_rate?: number | null;
        channel_commission_rate?: number | null; // Correct column name
        buffer_rate?: number | null; // Marge de sécurité (décimal)
        custom_price_ht?: number | null; // Prix de vente canal
        public_price_ht?: number | null; // Tarif public HT
      };
    }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('channel_pricing')
        .update(pricing)
        .eq('id', catalogProductId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['linkme-product-detail', variables.catalogProductId],
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
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('channel_pricing')
        .update(metadata)
        .eq('id', catalogProductId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['linkme-product-detail', variables.catalogProductId],
      });
      queryClient.invalidateQueries({ queryKey: ['linkme-catalog-products'] });
    },
  });
}

/**
 * Hook: toggle pour page détail (channel_pricing)
 * Supporte 'is_enabled' qui est mappé vers 'is_active' dans channel_pricing
 */
export function useToggleLinkMeProductField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      catalogProductId,
      field,
      value,
    }: {
      catalogProductId: string;
      field:
        | 'is_enabled' // UI field, mapped to is_active
        | 'is_active'
        | 'is_public_showcase'
        | 'is_featured'
        | 'show_supplier';
      value: boolean;
    }) => {
      const supabase = getSupabaseClient();
      // Map is_enabled to is_active (column name in channel_pricing)
      const dbField = field === 'is_enabled' ? 'is_active' : field;

      const { error } = await supabase
        .from('channel_pricing')
        .update({ [dbField]: value })
        .eq('id', catalogProductId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['linkme-product-detail', variables.catalogProductId],
      });
      queryClient.invalidateQueries({ queryKey: ['linkme-catalog-products'] });
    },
  });
}

/**
 * Interface variante produit
 */
export interface ProductVariant {
  id: string;
  sku: string | null;
  name: string | null;
  variant_attributes: Record<string, string> | null;
  stock_real: number;
  cost_price: number | null;
  /** URL image principale de la variante */
  image_url: string | null;
}

/**
 * Hook: récupérer les variantes d'un produit présentes dans le catalogue LinkMe
 * Note: Filtre les variantes pour n'afficher que celles qui sont dans channel_pricing
 */
export function useLinkMeProductVariants(productId: string | null) {
  return useQuery({
    queryKey: ['linkme-product-variants', productId],
    queryFn: async (): Promise<ProductVariant[]> => {
      if (!productId) return [];

      const supabase = getSupabaseClient();

      // 1. Récupérer le variant_group_id du produit principal
      const { data: mainProduct, error: mainError } = await supabase
        .from('products')
        .select('variant_group_id')
        .eq('id', productId)
        .single();

      if (mainError || !mainProduct?.variant_group_id) {
        return [];
      }

      // 2. Récupérer toutes les variantes du même groupe
      const { data: allVariants, error } = await supabase
        .from('products')
        .select(
          `
          id,
          sku,
          name,
          variant_attributes,
          stock_real,
          cost_price
        `
        )
        .eq('variant_group_id', mainProduct.variant_group_id)
        .neq('id', productId) // Exclure le produit principal
        .order('variant_position');

      if (error) {
        console.error('Erreur fetch variantes produit:', error);
        return [];
      }

      if (!allVariants || allVariants.length === 0) return [];

      // 3. Filtrer par présence dans channel_pricing (catalogue LinkMe)
      const variantIds = allVariants.map((v: any) => v.id);
      const { data: catalogEntries } = await supabase
        .from('channel_pricing')
        .select('product_id')
        .eq('channel_id', LINKME_CHANNEL_ID)
        .in('product_id', variantIds);

      // Set des product_id présents dans le catalogue LinkMe
      const catalogProductIds = new Set(
        (catalogEntries || []).map((e: any) => e.product_id)
      );

      // Filtrer les variantes pour ne garder que celles dans le catalogue
      const variantsInCatalog = allVariants.filter((v: any) =>
        catalogProductIds.has(v.id)
      );

      if (variantsInCatalog.length === 0) return [];

      // 4. Récupérer les images primaires pour les variantes filtrées
      const filteredIds = variantsInCatalog.map((v: any) => v.id);
      const { data: images } = await supabase
        .from('product_images')
        .select('product_id, public_url')
        .in('product_id', filteredIds)
        .eq('is_primary', true);

      // Map des images par product_id
      const imageMap = new Map(
        (images || []).map((img: any) => [img.product_id, img.public_url])
      );

      return variantsInCatalog.map((v: any) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        variant_attributes: v.variant_attributes,
        stock_real: v.stock_real || 0,
        cost_price: v.cost_price,
        image_url: imageMap.get(v.id) || null,
      }));
    },
    enabled: !!productId,
    staleTime: 60000,
  });
}
