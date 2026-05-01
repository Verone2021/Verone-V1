'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getUserSafe } from '@verone/utils';
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

interface ActiveBrandQueryResult {
  activeBrandId: string | null;
  brands: Brand[];
}

const QUERY_KEY = ['active-brand'] as const;
const STALE_TIME_MS = 5 * 60 * 1000;

async function fetchActiveBrandData(): Promise<ActiveBrandQueryResult> {
  const supabase = createClient();
  const { data: userData } = await getUserSafe();
  const userId = userData?.user?.id ?? null;

  const [brandsResult, profileResult] = await Promise.all([
    supabase
      .from('brands')
      .select('id, slug, name, brand_color, logo_url, is_active, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
    userId
      ? supabase
          .from('user_profiles')
          .select('active_brand_id')
          .eq('user_id', userId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (brandsResult.error) {
    throw new Error(`Failed to fetch brands: ${brandsResult.error.message}`);
  }

  return {
    brands: (brandsResult.data ?? []) as Brand[],
    activeBrandId:
      (profileResult.data as { active_brand_id?: string | null } | null)
        ?.active_brand_id ?? null,
  };
}

async function persistActiveBrand(nextBrandId: string | null): Promise<void> {
  const supabase = createClient();
  const { data: userData } = await getUserSafe();
  const userId = userData?.user?.id;

  if (!userId) {
    throw new Error('No authenticated user — cannot update active_brand_id');
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({ active_brand_id: nextBrandId })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to update active_brand_id: ${error.message}`);
  }
}

export function useActiveBrand() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchActiveBrandData,
    staleTime: STALE_TIME_MS,
  });

  const mutation = useMutation({
    mutationFn: persistActiveBrand,
    onSuccess: async (_data, nextBrandId) => {
      queryClient.setQueryData<ActiveBrandQueryResult>(QUERY_KEY, prev =>
        prev ? { ...prev, activeBrandId: nextBrandId } : prev
      );
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const brands = data?.brands ?? [];
  const activeBrandId = data?.activeBrandId ?? null;
  const activeBrand = activeBrandId
    ? (brands.find(b => b.id === activeBrandId) ?? null)
    : null;
  const isAllBrands = activeBrandId === null;

  const setActiveBrand = (nextBrandId: string | null) => {
    mutation.mutate(nextBrandId);
  };

  return {
    activeBrandId,
    activeBrand,
    brands,
    setActiveBrand,
    isAllBrands,
    isLoading,
    isUpdating: mutation.isPending,
    error: error ?? mutation.error ?? null,
  };
}
