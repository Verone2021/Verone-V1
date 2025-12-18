/**
 * Hook: useLinkMeCatalog
 * Récupère les produits du catalogue LinkMe pour le front-end
 *
 * Source: table `channel_pricing` avec channel_id = LINKME_CHANNEL_ID
 * Aligné avec le CMS back-office
 *
 * @module use-linkme-catalog
 * @since 2025-12-04
 */

import * as React from 'react';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

// ID du canal LinkMe dans sales_channels (même que back-office)
const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

/**
 * Interface produit catalogue LinkMe (front-end)
 * Version simplifiée pour affichage utilisateur
 */
export interface LinkMeCatalogProduct {
  id: string; // channel_pricing.id
  product_id: string;
  name: string;
  reference: string;
  description: string | null;
  custom_title: string | null;
  custom_description: string | null;
  custom_selling_points: string[] | null;
  selling_price_ht: number; // Prix de vente HT (custom_price_ht ou calculé)
  public_price_ht: number | null; // Tarif public HT
  channel_commission_rate: number | null; // Commission LinkMe % (pour calcul prix client)
  image_url: string | null;
  is_featured: boolean;
  subcategory_id: string | null;
  subcategory_name: string | null;
  category_name: string | null;
  family_name: string | null;
  supplier_name: string | null;
  stock_real: number;
  // Produits sur mesure
  enseigne_id: string | null; // Produit exclusif à une enseigne
  assigned_client_id: string | null; // Produit exclusif à une organisation
  is_custom: boolean; // true si enseigne_id OU assigned_client_id
}

/**
 * Interface résultat catégorisation produits
 */
export interface CategorizedProducts {
  customProducts: LinkMeCatalogProduct[]; // Produits sur mesure
  generalProducts: LinkMeCatalogProduct[]; // Catalogue général
}

/**
 * Interface filtres catalogue
 */
export interface CatalogFilters {
  search?: string;
  category?: string;
  subcategory?: string;
  featured?: boolean;
}

/**
 * Fetch les produits du catalogue LinkMe
 * Uniquement les produits actifs (is_active = true)
 */
async function fetchCatalogProducts(): Promise<LinkMeCatalogProduct[]> {
  // Requête channel_pricing avec JOIN products
  const { data, error } = await (supabase as any)
    .from('channel_pricing')
    .select(
      `
      id,
      product_id,
      is_featured,
      custom_title,
      custom_description,
      custom_selling_points,
      custom_price_ht,
      public_price_ht,
      channel_commission_rate,
      products!inner(
        id,
        sku,
        name,
        description,
        cost_price,
        eco_tax_default,
        margin_percentage,
        stock_real,
        product_status,
        subcategory_id,
        supplier_id,
        enseigne_id,
        assigned_client_id
      )
    `
    )
    .eq('channel_id', LINKME_CHANNEL_ID)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Erreur fetch catalogue LinkMe:', error);
    throw error;
  }

  if (!data || data.length === 0) return [];

  // Récupérer les IDs pour les jointures
  const productIds = data.map((cp: any) => cp.product_id);
  const subcategoryIds = data
    .map((cp: any) => cp.products?.subcategory_id)
    .filter(Boolean);
  const supplierIds = data
    .map((cp: any) => cp.products?.supplier_id)
    .filter(Boolean);

  // Fetch images primaires
  const { data: images } = await (supabase as any)
    .from('product_images')
    .select('product_id, public_url')
    .in('product_id', productIds)
    .eq('is_primary', true);

  const imageMap = new Map(
    (images || []).map((img: any) => [img.product_id, img.public_url])
  );

  // Fetch sous-catégories avec hiérarchie
  const { data: subcategories } = await (supabase as any)
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

  interface CategoryData {
    subcategory_name: string;
    category_name: string;
    family_name: string;
  }

  const categoryMap = new Map<string, CategoryData>();
  (subcategories || []).forEach((sc: any) => {
    categoryMap.set(sc.id, {
      subcategory_name: sc.name || '',
      category_name: sc.category?.name || '',
      family_name: sc.category?.family?.name || '',
    });
  });

  // Fetch fournisseurs
  const { data: suppliers } = await (supabase as any)
    .from('organisations')
    .select('id, legal_name, trade_name')
    .in('id', supplierIds);

  const supplierMap = new Map(
    (suppliers || []).map((s: any) => [s.id, s.trade_name || s.legal_name])
  );

  // Mapper les données
  return data.map((cp: any) => {
    const product = cp.products;
    const subcategoryId = product?.subcategory_id;
    const categoryData = subcategoryId ? categoryMap.get(subcategoryId) : null;

    // Calcul prix de vente: custom_price_ht ou (cost + eco_tax) * (1 + margin%)
    const costPrice = product?.cost_price || 0;
    const ecoTax = product?.eco_tax_default || 0;
    const marginPct = product?.margin_percentage ?? 25;
    const calculatedPrice =
      costPrice > 0 ? (costPrice + ecoTax) * (1 + marginPct / 100) : 0;
    const sellingPrice = cp.custom_price_ht ?? calculatedPrice;

    const enseigneId = product?.enseigne_id || null;
    const assignedClientId = product?.assigned_client_id || null;
    const isCustom = !!(enseigneId || assignedClientId);

    return {
      id: cp.id,
      product_id: cp.product_id,
      name: product?.name || '',
      reference: product?.sku || '',
      description: product?.description || null,
      custom_title: cp.custom_title,
      custom_description: cp.custom_description,
      custom_selling_points: cp.custom_selling_points,
      selling_price_ht: sellingPrice,
      public_price_ht: cp.public_price_ht,
      channel_commission_rate: cp.channel_commission_rate ?? null,
      image_url: imageMap.get(cp.product_id) || null,
      is_featured: cp.is_featured ?? false,
      subcategory_id: subcategoryId,
      subcategory_name: categoryData?.subcategory_name || null,
      category_name: categoryData?.category_name || null,
      family_name: categoryData?.family_name || null,
      supplier_name: supplierMap.get(product?.supplier_id) || null,
      stock_real: product?.stock_real || 0,
      // Produits sur mesure
      enseigne_id: enseigneId,
      assigned_client_id: assignedClientId,
      is_custom: isCustom,
    };
  });
}

/**
 * Hook: récupère les produits du catalogue LinkMe
 * Utilisé par la page /catalogue
 */
export function useLinkMeCatalogProducts() {
  return useQuery({
    queryKey: ['linkme-catalog-products'],
    queryFn: fetchCatalogProducts,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook: récupère les produits vedettes uniquement
 * Utilisé pour affichage sur page d'accueil (section vedettes)
 */
export function useFeaturedCatalogProducts() {
  return useQuery({
    queryKey: ['linkme-catalog-featured'],
    queryFn: async () => {
      const products = await fetchCatalogProducts();
      return products.filter(p => p.is_featured);
    },
    staleTime: 60000,
  });
}

/**
 * Hook: récupère un produit par ID
 */
export function useCatalogProduct(catalogId: string | null) {
  return useQuery({
    queryKey: ['linkme-catalog-product', catalogId],
    queryFn: async () => {
      if (!catalogId) return null;

      const { data, error } = await (supabase as any)
        .from('channel_pricing')
        .select(
          `
          id,
          product_id,
          is_featured,
          custom_title,
          custom_description,
          custom_selling_points,
          custom_price_ht,
          public_price_ht,
          min_margin_rate,
          max_margin_rate,
          suggested_margin_rate,
          products!inner(
            id,
            sku,
            name,
            description,
            selling_points,
            cost_price,
            eco_tax_default,
            margin_percentage,
            stock_real,
            product_status,
            subcategory_id,
            supplier_id,
            weight,
            dimensions
          )
        `
        )
        .eq('id', catalogId)
        .eq('channel_id', LINKME_CHANNEL_ID)
        .single();

      if (error) {
        console.error('Erreur fetch produit:', error);
        throw error;
      }

      if (!data) return null;

      const product = data.products;

      // Fetch image primaire
      const { data: images } = await (supabase as any)
        .from('product_images')
        .select('public_url')
        .eq('product_id', data.product_id)
        .eq('is_primary', true)
        .limit(1);

      // Calcul prix de vente
      const costPrice = product?.cost_price || 0;
      const ecoTax = product?.eco_tax_default || 0;
      const marginPct = product?.margin_percentage ?? 25;
      const calculatedPrice =
        costPrice > 0 ? (costPrice + ecoTax) * (1 + marginPct / 100) : 0;

      return {
        id: data.id,
        product_id: data.product_id,
        name: product?.name || '',
        reference: product?.sku || '',
        description: data.custom_description || product?.description || null,
        selling_points:
          data.custom_selling_points || product?.selling_points || null,
        selling_price_ht: data.custom_price_ht ?? calculatedPrice,
        public_price_ht: data.public_price_ht,
        image_url: images?.[0]?.public_url || null,
        is_featured: data.is_featured ?? false,
        stock_real: product?.stock_real || 0,
        min_margin_rate: data.min_margin_rate,
        max_margin_rate: data.max_margin_rate,
        suggested_margin_rate: data.suggested_margin_rate,
      };
    },
    enabled: !!catalogId,
    staleTime: 30000,
  });
}

/**
 * Helper: filtrer les produits localement
 */
export function filterCatalogProducts(
  products: LinkMeCatalogProduct[],
  filters: CatalogFilters
): LinkMeCatalogProduct[] {
  return products.filter(product => {
    // Filtre recherche
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchName = product.name.toLowerCase().includes(search);
      const matchRef = product.reference.toLowerCase().includes(search);
      const matchDesc = product.description?.toLowerCase().includes(search);
      if (!matchName && !matchRef && !matchDesc) return false;
    }

    // Filtre catégorie
    if (filters.category && product.category_name !== filters.category) {
      return false;
    }

    // Filtre sous-catégorie
    if (filters.subcategory && product.subcategory_id !== filters.subcategory) {
      return false;
    }

    // Filtre vedettes
    if (filters.featured && !product.is_featured) {
      return false;
    }

    return true;
  });
}

/**
 * Catégorise les produits en "sur mesure" vs "catalogue général"
 *
 * Logique:
 * - Si product.enseigne_id != null ET == userEnseigneId → sur mesure
 * - Si product.assigned_client_id != null ET == userOrganisationId → sur mesure
 * - Si product n'a pas d'attribution exclusive → catalogue général
 * - Si product a attribution mais pas pour cet utilisateur → FILTRÉ (invisible)
 */
export function categorizeProducts(
  products: LinkMeCatalogProduct[],
  userEnseigneId: string | null,
  userOrganisationId: string | null
): CategorizedProducts {
  const customProducts: LinkMeCatalogProduct[] = [];
  const generalProducts: LinkMeCatalogProduct[] = [];

  for (const product of products) {
    // Produit exclusif à une enseigne
    if (product.enseigne_id) {
      // Visible uniquement si c'est l'enseigne de l'utilisateur
      if (product.enseigne_id === userEnseigneId) {
        customProducts.push(product);
      }
      // Sinon: produit invisible pour cet utilisateur
      continue;
    }

    // Produit exclusif à une organisation (org_independante)
    if (product.assigned_client_id) {
      // Visible uniquement si c'est l'organisation de l'utilisateur
      if (product.assigned_client_id === userOrganisationId) {
        customProducts.push(product);
      }
      // Sinon: produit invisible pour cet utilisateur
      continue;
    }

    // Pas d'attribution exclusive → catalogue général (visible par tous)
    generalProducts.push(product);
  }

  return { customProducts, generalProducts };
}

/**
 * Hook: récupère les produits catégorisés (sur mesure + général)
 * Filtre selon l'enseigne ou organisation de l'utilisateur
 */
export function useCategorizedCatalogProducts(
  userEnseigneId: string | null,
  userOrganisationId: string | null
) {
  const { data: products, isLoading, error } = useLinkMeCatalogProducts();

  const categorized = React.useMemo(() => {
    if (!products) return { customProducts: [], generalProducts: [] };
    return categorizeProducts(products, userEnseigneId, userOrganisationId);
  }, [products, userEnseigneId, userOrganisationId]);

  return {
    customProducts: categorized.customProducts,
    generalProducts: categorized.generalProducts,
    allProducts: products || [],
    isLoading,
    error,
  };
}
