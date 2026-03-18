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

export function useCollections() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select(
          'id, name, slug, description, description_long, image_url, meta_title, meta_description, selling_points, sort_order_site, product_count'
        )
        .eq('is_active', true)
        .eq('is_published_online', true)
        .order('sort_order_site', { ascending: true });

      if (error) {
        console.error('Error fetching collections:', error);
        throw new Error(`Failed to fetch collections: ${error.message}`);
      }

      return (data || []) as Collection[];
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
        .select(
          'id, name, slug, description, description_long, image_url, meta_title, meta_description, selling_points, sort_order_site, product_count'
        )
        .eq('slug', slug)
        .eq('is_active', true)
        .eq('is_published_online', true)
        .single();

      if (error) {
        console.error('Error fetching collection:', error);
        throw new Error(`Failed to fetch collection: ${error.message}`);
      }

      return data as Collection;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
