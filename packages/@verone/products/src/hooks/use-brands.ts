'use client';

/**
 * useBrands — fetch toutes les marques internes Vérone Group actives.
 *
 * Cache TanStack Query (5 min staleTime) — partagé entre tous les composants.
 * 4 marques en DB (Vérone, Boêmia, Solar, Flos), donc fetch unique trivial.
 *
 * Pour résoudre une liste d'IDs vers leurs Brand[], filtrer côté composant :
 *   const { data: allBrands = [] } = useBrands();
 *   const brands = allBrands.filter(b => brandIds.includes(b.id));
 *
 * Voir : packages/@verone/products/src/components/badges/BrandBadgeList.tsx
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import type { BrandChipData } from '../components/badges/BrandChip';

export const brandsQueryKey = ['brands', 'all', 'active'] as const;

export function useBrands() {
  const supabase = createClient();

  return useQuery({
    queryKey: brandsQueryKey,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<BrandChipData[]> => {
      const { data, error } = await supabase
        .from('brands')
        .select('id, slug, name, brand_color')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        throw new Error(`Brands fetch: ${error.message}`);
      }

      return (data ?? []) as BrandChipData[];
    },
  });
}
