import { useQuery } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';

export interface ColorOption {
  id: string;
  name: string;
  hex_code: string;
  sort_order: number;
}

/**
 * Hook public site-internet : couleurs actives du vocabulaire contrôlé.
 * Lit color_options où is_active = true (RLS anon read).
 * Utilisé par la sidebar catalogue pour la palette de filtres.
 */
export function useColorOptions() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['site-color-options'],
    queryFn: async (): Promise<ColorOption[]> => {
      const { data, error } = await supabase
        .from('color_options')
        .select('id, name, hex_code, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('[useColorOptions] fetch failed:', error);
        throw new Error(`Failed to fetch color options: ${error.message}`);
      }

      return (data ?? []) as ColorOption[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
