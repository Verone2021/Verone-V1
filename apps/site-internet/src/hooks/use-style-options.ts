import { useQuery } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';

export interface StyleOption {
  id: string;
  value: string;
  label: string;
  sort_order: number;
}

/**
 * Hook public site-internet : styles actifs du vocabulaire contrôlé.
 * Lit style_options où is_active = true (RLS anon read).
 */
export function useStyleOptions() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['site-style-options'],
    queryFn: async (): Promise<StyleOption[]> => {
      const { data, error } = await supabase
        .from('style_options')
        .select('id, value, label, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('label', { ascending: true });

      if (error) {
        console.error('[useStyleOptions] fetch failed:', error);
        throw new Error(`Failed to fetch style options: ${error.message}`);
      }

      return (data ?? []) as StyleOption[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
