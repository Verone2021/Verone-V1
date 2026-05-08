'use client';

import { useQuery } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

export interface Brand {
  id: string;
  slug: string;
  name: string;
  brand_color: string | null;
  logo_url: string | null;
  is_active: boolean;
  display_order: number;
}

const QUERY_KEY = ['brands-active'] as const;
const STALE_TIME_MS = 5 * 60 * 1000;

async function fetchBrands(): Promise<Brand[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('brands')
    .select('id, slug, name, brand_color, logo_url, is_active, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw new Error(`Failed to fetch brands: ${error.message}`);
  return (data ?? []) as Brand[];
}

export function useBrands() {
  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchBrands,
    staleTime: STALE_TIME_MS,
  });

  return {
    brands: data ?? [],
    isLoading,
    error: error ?? null,
  };
}
