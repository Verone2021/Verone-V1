import { useQuery } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';

export interface Collection {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  description_long: string | null;
  image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  selling_points: string[] | null;
  sort_order_site: number | null;
  product_count: number;
}

interface CollectionImageJoin {
  public_url: string | null;
  is_primary: boolean | null;
}

interface CollectionRow {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  description_long: string | null;
  image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  selling_points: string[] | null;
  sort_order_site: number | null;
  product_count: number;
  collection_images: CollectionImageJoin[] | null;
}

const COLLECTION_SELECT =
  'id, name, slug, description, description_long, image_url, meta_title, meta_description, selling_points, sort_order_site, product_count, collection_images(public_url, is_primary)';

// Image de couverture : on prend en priorité l'image marquée `is_primary` dans
// `collection_images` (table où le composant CollectionImageUpload écrit
// désormais), avec fallback sur la colonne legacy `collections.image_url`
// pour les collections créées avant 2026-05-13.
function resolveCoverImage(row: CollectionRow): string | null {
  const primary = row.collection_images?.find(img => img.is_primary === true);
  return primary?.public_url ?? row.image_url ?? null;
}

function mapRow(row: CollectionRow): Collection {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    description_long: row.description_long,
    image_url: resolveCoverImage(row),
    meta_title: row.meta_title,
    meta_description: row.meta_description,
    selling_points: row.selling_points,
    sort_order_site: row.sort_order_site,
    product_count: row.product_count,
  };
}

export function useCollections() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select(COLLECTION_SELECT)
        .eq('is_active', true)
        .eq('is_published_online', true)
        .order('sort_order_site', { ascending: true });

      if (error) {
        console.error('Error fetching collections:', error);
        throw new Error(`Failed to fetch collections: ${error.message}`);
      }

      return ((data ?? []) as unknown as CollectionRow[]).map(mapRow);
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCollectionBySlug(slug: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['collection', slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from('collections')
        .select(COLLECTION_SELECT)
        .eq('slug', slug)
        .eq('is_active', true)
        .eq('is_published_online', true)
        .single();

      if (error) {
        console.error('Error fetching collection:', error);
        throw new Error(`Failed to fetch collection: ${error.message}`);
      }

      return mapRow(data as unknown as CollectionRow);
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
