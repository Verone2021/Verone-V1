/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Collection, CollectionFilters } from './use-collections.types';

const COLLECTION_SELECT = `
  id,
  name,
  description,
  is_featured,
  created_by,
  created_at,
  updated_at,
  is_active,
  visibility,
  shared_link_token,
  product_count,
  shared_count,
  last_shared,
  style,
  suitable_rooms,
  theme_tags,
  display_order,
  meta_title,
  meta_description,
  image_url,
  color_theme,
  archived_at,
  collection_images (
    public_url,
    is_primary
  )
`;

type CollectionImage = { public_url: string | null; is_primary: boolean };

export function extractCoverImage(
  images: CollectionImage[] | null | undefined,
  fallback?: string | null
): string | undefined {
  const primary = images?.find(img => img.is_primary);
  return primary?.public_url ?? fallback ?? undefined;
}

/**
 * Récupère les collections actives avec filtres optionnels
 */
export function queryCollections(
  supabase: SupabaseClient,
  filters?: CollectionFilters
) {
  let query: any = supabase
    .from('collections')
    .select(COLLECTION_SELECT)
    .order('updated_at', { ascending: false })
    .is('archived_at', null);

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('is_active', filters.status === 'active');
  }

  if (filters?.visibility && filters.visibility !== 'all') {
    query = query.eq('visibility', filters.visibility);
  }

  if (filters?.shared && filters.shared !== 'all') {
    if (filters.shared === 'shared') {
      query = query.gt('shared_count', 0);
    } else {
      query = query.eq('shared_count', 0);
    }
  }

  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return query;
}

/**
 * Récupère les produits des premières collections (enrichissement thumbnail)
 */
export async function queryCollectionProducts(
  supabase: SupabaseClient,
  collectionId: string,
  limit = 4
) {
  return supabase
    .from('collection_products')
    .select(
      `
      products:product_id (
        id,
        name,
        product_images!inner (
          public_url
        )
      )
    `
    )
    .eq('collection_id', collectionId)
    .eq('products.product_images.is_primary', true)
    .limit(limit);
}

/**
 * Récupère une collection par ID avec tous ses produits
 */
export async function queryCollectionById(
  supabase: SupabaseClient,
  id: string
) {
  const [collectionResult, productsResult] = await Promise.all([
    supabase
      .from('collections')
      .select(COLLECTION_SELECT)
      .eq('id', id)
      .single(),
    supabase
      .from('collection_products')
      .select(
        `
        position,
        products:product_id (
          id,
          name,
          sku,
          cost_price,
          product_images!inner (
            public_url
          )
        )
      `
      )
      .eq('collection_id', id)
      .eq('products.product_images.is_primary', true)
      .order('position', { ascending: true }),
  ]);

  return { collectionResult, productsResult };
}

type RawCollectionProduct = {
  products: {
    id: string;
    name: string;
    product_images?: Array<{ public_url: string | null }>;
  } | null;
};

/**
 * Mappe les produits bruts (avec thumbnails) pour useCollections
 */
export function mapCollectionProducts(
  collection: Record<string, unknown>,
  products: Array<RawCollectionProduct> | null
): Record<string, unknown> {
  const images = collection.collection_images as
    | Array<{ public_url: string | null; is_primary: boolean }>
    | null
    | undefined;

  return {
    ...collection,
    cover_image_url: extractCoverImage(
      images,
      collection.image_url as string | null
    ),
    products:
      products
        ?.map(cp => {
          if (!cp.products) return null;
          return {
            id: cp.products.id,
            name: cp.products.name,
            image_url: cp.products.product_images?.[0]?.public_url,
          };
        })
        .filter(Boolean) ?? [],
  };
}

/**
 * Mappe une collection sans produits (pour les collections restantes)
 */
export function mapCollectionWithoutProducts(
  collection: Record<string, unknown>
): Record<string, unknown> {
  const images = collection.collection_images as
    | Array<{ public_url: string | null; is_primary: boolean }>
    | null
    | undefined;
  return {
    ...collection,
    cover_image_url: extractCoverImage(
      images,
      collection.image_url as string | null
    ),
    products: [],
  };
}

/**
 * Récupère les collections archivées
 */
export async function queryArchivedCollections(
  supabase: SupabaseClient
): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select(
      'id, name, description, is_featured, created_by, created_at, updated_at, is_active, visibility, shared_link_token, product_count, shared_count, last_shared, style, suitable_rooms, theme_tags, display_order, meta_title, meta_description, image_url, color_theme, archived_at'
    )
    .not('archived_at', 'is', null)
    .order('archived_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Collection[];
}
