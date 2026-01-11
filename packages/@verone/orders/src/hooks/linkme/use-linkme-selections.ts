/**
 * Hook: useLinkMeSelections
 * Gestion des Sélections LinkMe pour les commandes
 * Copie simplifiée pour le package @verone/orders
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

// ID du canal LinkMe
const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

// Types
export interface SelectionItem {
  id: string;
  selection_id: string;
  product_id: string;
  base_price_ht: number;
  margin_rate: number;
  selling_price_ht: number | null;
  display_order: number | null;
  custom_description: string | null;
  is_featured: boolean | null;
  created_at: string | null;
  product?: {
    id: string;
    name: string;
    sku: string;
    cost_price: number | null;
    product_status: string;
    description?: string | null;
    selling_points?: string[] | null;
    weight_kg?: number | null;
    dimensions_cm?: Record<string, number | string> | null;
    category_name?: string | null;
    supplier_name?: string | null;
  };
  product_image_url?: string | null;
  commission_rate?: number | null;
  catalog_price_ht?: number | null;
  public_price_ht?: number | null;
  min_margin_rate?: number | null;
  max_margin_rate?: number | null;
  suggested_margin_rate?: number | null;
  buffer_rate?: number | null;
  channel_pricing_id?: string | null;
}

export interface SelectionDetail {
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
  archived_at: string | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  affiliate?: {
    id: string;
    display_name: string;
    slug: string;
    enseigne_id: string | null;
    organisation?: {
      enseigne_id: string | null;
    } | null;
  };
  items?: SelectionItem[];
}

export interface SelectionSummary {
  id: string;
  name: string;
  slug: string;
  archived_at: string | null;
  products_count: number | null;
  affiliate_id: string;
  affiliate_name: string;
}

/**
 * Récupère une sélection par ID avec ses produits
 */
async function fetchSelectionById(
  selectionId: string
): Promise<SelectionDetail | null> {
  const { data: selection, error: selectionError } = await supabase
    .from('linkme_selections')
    .select(
      `
      *,
      affiliate:linkme_affiliates(
        id,
        display_name,
        slug,
        enseigne_id,
        organisation:organisations!organisation_id(enseigne_id)
      )
    `
    )
    .eq('id', selectionId)
    .single();

  if (selectionError) {
    console.error('Error fetching selection:', selectionError);
    throw selectionError;
  }

  if (!selection) return null;

  // Récupérer les items de la sélection avec les produits
  const { data: items, error: itemsError } = await (supabase as any)
    .from('linkme_selection_items')
    .select(
      `
      *,
      product:products(
        id, name, sku, cost_price, product_status,
        description, selling_points, weight, dimensions,
        subcategory:subcategories(name),
        supplier:organisations!supplier_id(trade_name, legal_name)
      )
    `
    )
    .eq('selection_id', selectionId)
    .order('display_order', { ascending: true });

  if (itemsError) {
    console.error('Error fetching selection items:', itemsError);
    throw itemsError;
  }

  // Récupérer les images des produits
  const productIds = items?.map((item: SelectionItem) => item.product_id) || [];
  let imagesByProductId: Record<string, string> = {};
  const commissionByProductId: Record<string, number | null> = {};
  const catalogPriceByProductId: Record<string, number | null> = {};
  const channelPricingIdByProductId: Record<string, string | null> = {};
  const channelPricingDataByProductId: Record<
    string,
    {
      public_price_ht: number | null;
      min_margin_rate: number | null;
      max_margin_rate: number | null;
      suggested_margin_rate: number | null;
      buffer_rate: number | null;
    }
  > = {};

  if (productIds.length > 0) {
    const { data: images } = await supabase
      .from('product_images')
      .select('product_id, public_url')
      .in('product_id', productIds)
      .eq('is_primary', true);

    if (images) {
      imagesByProductId = images.reduce(
        (acc: Record<string, string>, img) => {
          if (img.public_url) {
            acc[img.product_id] = img.public_url;
          }
          return acc;
        },
        {} as Record<string, string>
      );
    }

    // Récupérer les données channel_pricing
    const { data: channelPrices } = await (supabase as any)
      .from('channel_pricing')
      .select(
        'id, product_id, channel_commission_rate, custom_price_ht, public_price_ht, min_margin_rate, max_margin_rate, suggested_margin_rate, buffer_rate'
      )
      .eq('channel_id', LINKME_CHANNEL_ID)
      .in('product_id', productIds);

    if (channelPrices) {
      channelPrices.forEach((cp: any) => {
        commissionByProductId[cp.product_id] = cp.channel_commission_rate;
        catalogPriceByProductId[cp.product_id] = cp.custom_price_ht;
        channelPricingIdByProductId[cp.product_id] = cp.id;
        channelPricingDataByProductId[cp.product_id] = {
          public_price_ht: cp.public_price_ht,
          min_margin_rate: cp.min_margin_rate,
          max_margin_rate: cp.max_margin_rate,
          suggested_margin_rate: cp.suggested_margin_rate,
          buffer_rate: cp.buffer_rate,
        };
      });
    }
  }

  // Combiner les données
  const itemsWithImages = (items || []).map((item: any) => {
    const channelData = channelPricingDataByProductId[item.product_id];
    const rawProduct = item.product;
    return {
      ...item,
      product: rawProduct
        ? {
            id: rawProduct.id,
            name: rawProduct.name,
            sku: rawProduct.sku,
            cost_price: rawProduct.cost_price,
            product_status: rawProduct.product_status,
            description: rawProduct.description,
            selling_points: rawProduct.selling_points,
            weight_kg: rawProduct.weight,
            dimensions_cm: rawProduct.dimensions,
            category_name: rawProduct.subcategory?.name || null,
            supplier_name:
              rawProduct.supplier?.trade_name ||
              rawProduct.supplier?.legal_name ||
              null,
          }
        : undefined,
      product_image_url: imagesByProductId[item.product_id] || null,
      channel_pricing_id: channelPricingIdByProductId[item.product_id] ?? null,
      commission_rate: commissionByProductId[item.product_id] ?? null,
      catalog_price_ht: catalogPriceByProductId[item.product_id] ?? null,
      public_price_ht: channelData?.public_price_ht ?? null,
      min_margin_rate: channelData?.min_margin_rate ?? null,
      max_margin_rate: channelData?.max_margin_rate ?? null,
      suggested_margin_rate: channelData?.suggested_margin_rate ?? null,
      buffer_rate: channelData?.buffer_rate ?? null,
    };
  }) as SelectionItem[];

  return {
    ...selection,
    items: itemsWithImages,
  } as SelectionDetail;
}

/**
 * Récupère les sélections disponibles pour une enseigne
 * Chemin: enseigne → linkme_affiliates (via enseigne_id direct) → linkme_selections
 */
async function fetchSelectionsByEnseigne(
  enseigneId: string
): Promise<SelectionSummary[]> {
  // Récupérer les affiliés de cette enseigne (lien direct via enseigne_id)
  const { data: affiliates, error: affError } = await (supabase as any)
    .from('linkme_affiliates')
    .select('id, display_name')
    .eq('enseigne_id', enseigneId);

  if (affError) {
    console.error('Error fetching affiliates:', affError);
    throw affError;
  }

  if (!affiliates || affiliates.length === 0) {
    return [];
  }

  const affiliateIds = affiliates.map((a: any) => a.id);
  const affiliateNamesById: Record<string, string> = {};
  affiliates.forEach((a: any) => {
    affiliateNamesById[a.id] = a.display_name;
  });

  // Récupérer les sélections actives de ces affiliés (non archivées)
  const { data: selections, error: selError } = await supabase
    .from('linkme_selections')
    .select('id, name, slug, archived_at, products_count, affiliate_id')
    .in('affiliate_id', affiliateIds)
    .is('archived_at', null)
    .order('name', { ascending: true });

  if (selError) {
    console.error('Error fetching selections:', selError);
    throw selError;
  }

  return (selections || []).map(s => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    archived_at: s.archived_at,
    products_count: s.products_count,
    affiliate_id: s.affiliate_id,
    affiliate_name: affiliateNamesById[s.affiliate_id] || '',
  }));
}

/**
 * Hook: Récupérer une sélection par ID
 */
export function useLinkMeSelection(selectionId: string | null) {
  return useQuery({
    queryKey: ['linkme-selection', selectionId],
    queryFn: () => (selectionId ? fetchSelectionById(selectionId) : null),
    enabled: !!selectionId,
    staleTime: 300000, // 5 minutes (was 30s - trop agressif)
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook: Récupérer les sélections d'une enseigne
 */
export function useLinkMeSelectionsByEnseigne(enseigneId: string | null) {
  return useQuery({
    queryKey: ['linkme-selections-by-enseigne', enseigneId],
    queryFn: () => (enseigneId ? fetchSelectionsByEnseigne(enseigneId) : []),
    enabled: !!enseigneId,
    staleTime: 300000, // 5 minutes (was 30s - trop agressif)
    refetchOnWindowFocus: false,
  });
}
