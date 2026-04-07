'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import type {
  SelectionDetail,
  SelectionItem,
  SelectionSummary,
  SourcedProduct,
} from './use-linkme-selections.types';

const supabase = createClient();

// ID du canal LinkMe
const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

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

  const { data: items, error: itemsError } = await supabase
    .from('linkme_selection_items')
    .select(
      `
      *,
      product:products(
        id, name, sku, cost_price, product_status, stock_real,
        description, selling_points, weight, dimensions,
        subcategory_id,
        subcategory:subcategories(id, name),
        supplier:organisations!supplier_id(trade_name, legal_name),
        created_by_affiliate,
        affiliate_commission_rate,
        affiliate_payout_ht
      )
    `
    )
    .eq('selection_id', selectionId)
    .order('display_order', { ascending: true });

  if (itemsError) {
    console.error('Error fetching selection items:', itemsError);
    throw itemsError;
  }

  const productIds = items?.map((item: SelectionItem) => item.product_id) ?? [];
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

    const { data: channelPrices } = await supabase
      .from('channel_pricing')
      .select(
        'id, product_id, channel_commission_rate, custom_price_ht, public_price_ht, min_margin_rate, max_margin_rate, suggested_margin_rate, buffer_rate'
      )
      .eq('channel_id', LINKME_CHANNEL_ID)
      .in('product_id', productIds);

    if (channelPrices) {
      channelPrices.forEach(cp => {
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

  const itemsWithImages = (items ?? []).map(item => {
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
            stock_real: rawProduct.stock_real ?? null,
            description: rawProduct.description,
            selling_points: rawProduct.selling_points,
            weight_kg: rawProduct.weight,
            dimensions_cm: rawProduct.dimensions,
            subcategory_id:
              rawProduct.subcategory_id ?? rawProduct.subcategory?.id ?? null,
            category_name: rawProduct.subcategory?.name ?? null,
            supplier_name:
              rawProduct.supplier?.trade_name ??
              rawProduct.supplier?.legal_name ??
              null,
            created_by_affiliate: rawProduct.created_by_affiliate ?? null,
            affiliate_commission_rate:
              rawProduct.affiliate_commission_rate ?? null,
            affiliate_payout_ht: rawProduct.affiliate_payout_ht ?? null,
          }
        : undefined,
      product_image_url: imagesByProductId[item.product_id] ?? null,
      channel_pricing_id: channelPricingIdByProductId[item.product_id] ?? null,
      commission_rate: commissionByProductId[item.product_id] ?? null,
      catalog_price_ht: catalogPriceByProductId[item.product_id] ?? null,
      public_price_ht:
        channelData?.public_price_ht ??
        (catalogPriceByProductId[item.product_id] != null
          ? catalogPriceByProductId[item.product_id]! * 1.5
          : null),
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
 * Hook: Récupérer une sélection par ID
 */
export function useLinkMeSelection(selectionId: string | null) {
  return useQuery({
    queryKey: ['linkme-selection', selectionId],
    queryFn: () => (selectionId ? fetchSelectionById(selectionId) : null),
    enabled: !!selectionId,
    staleTime: 300_000,
  });
}

/**
 * Récupère les produits sourcés pour une enseigne
 */
async function fetchEnseigneSourcedProducts(
  enseigneId: string
): Promise<SourcedProduct[]> {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, sku, cost_price, supplier_reference')
    .eq('enseigne_id', enseigneId)
    .is('archived_at', null)
    .eq('product_status', 'active')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching enseigne sourced products:', error);
    throw error;
  }

  if (!products || products.length === 0) {
    return [];
  }

  const productIds = products.map(p => p.id);

  const { data: channelPrices } = await supabase
    .from('channel_pricing')
    .select('product_id, custom_price_ht, public_price_ht')
    .eq('channel_id', LINKME_CHANNEL_ID)
    .in('product_id', productIds);

  const pricesByProductId: Record<
    string,
    { custom_price_ht: number | null; public_price_ht: number | null }
  > = {};
  if (channelPrices) {
    channelPrices.forEach(cp => {
      pricesByProductId[cp.product_id] = {
        custom_price_ht: cp.custom_price_ht,
        public_price_ht: cp.public_price_ht,
      };
    });
  }

  const { data: images } = await supabase
    .from('product_images')
    .select('product_id, public_url')
    .in('product_id', productIds)
    .eq('is_primary', true);

  const imagesByProductId: Record<string, string> = {};
  if (images) {
    images.forEach(img => {
      if (img.public_url) {
        imagesByProductId[img.product_id] = img.public_url;
      }
    });
  }

  return products.map(p => {
    const channelPrice = pricesByProductId[p.id];
    let sellingPrice: number;
    if (channelPrice?.custom_price_ht && channelPrice.custom_price_ht > 0) {
      sellingPrice = channelPrice.custom_price_ht;
    } else if (
      channelPrice?.public_price_ht &&
      channelPrice.public_price_ht > 0
    ) {
      sellingPrice = channelPrice.public_price_ht;
    } else {
      sellingPrice = (p.cost_price ?? 0) * 1.3;
    }

    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      selling_price_ht: Math.round(sellingPrice * 100) / 100,
      supplier_reference: p.supplier_reference,
      primary_image_url: imagesByProductId[p.id] ?? null,
    };
  });
}

/**
 * Hook: Récupérer les produits sourcés d'une enseigne
 */
export function useEnseigneSourcedProducts(enseigneId: string | null) {
  return useQuery({
    queryKey: ['enseigne-sourced-products', enseigneId],
    queryFn: () => (enseigneId ? fetchEnseigneSourcedProducts(enseigneId) : []),
    enabled: !!enseigneId,
    staleTime: 60000,
  });
}

/**
 * Récupère les sélections disponibles pour une enseigne
 */
async function fetchSelectionsByEnseigne(
  enseigneId: string
): Promise<SelectionSummary[]> {
  const { data: organisations, error: orgError } = await supabase
    .from('organisations')
    .select('id')
    .eq('enseigne_id', enseigneId);

  if (orgError) {
    console.error('Error fetching organisations:', orgError);
    throw orgError;
  }

  if (!organisations || organisations.length === 0) {
    return [];
  }

  const organisationIds = organisations.map(o => o.id);

  const { data: affiliates, error: affError } = await supabase
    .from('linkme_affiliates')
    .select('id, display_name')
    .in('organisation_id', organisationIds);

  if (affError) {
    console.error('Error fetching affiliates:', affError);
    throw affError;
  }

  if (!affiliates || affiliates.length === 0) {
    return [];
  }

  const affiliateIds = affiliates.map(a => a.id);
  const affiliateNamesById: Record<string, string> = {};
  affiliates.forEach(a => {
    affiliateNamesById[a.id] = a.display_name;
  });

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

  return (selections ?? []).map(s => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    archived_at: s.archived_at,
    products_count: s.products_count,
    affiliate_id: s.affiliate_id,
    affiliate_name: affiliateNamesById[s.affiliate_id] ?? '',
  }));
}

/**
 * Hook: Récupérer les sélections d'une enseigne
 */
export function useLinkMeSelectionsByEnseigne(enseigneId: string | null) {
  return useQuery({
    queryKey: ['linkme-selections-by-enseigne', enseigneId],
    queryFn: () => (enseigneId ? fetchSelectionsByEnseigne(enseigneId) : []),
    enabled: !!enseigneId,
    staleTime: 300_000,
  });
}
