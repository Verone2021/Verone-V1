import { useQuery } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';

/**
 * Hook useCategories
 *
 * Récupère toutes les catégories publiées sur le canal Site Internet
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  family_id: string | null;
}

export function useCategories() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['categories-site-internet'],
    queryFn: async () => {
      // Récupérer catégories publiées sur Site Internet
      const { data: channelData } = await supabase
        .from('sales_channels')
        .select('id')
        .eq('code', 'site_internet')
        .single();

      if (!channelData) {
        throw new Error('Canal Site Internet non trouvé');
      }

      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, description, family_id')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        throw new Error(`Failed to fetch categories: ${error.message}`);
      }

      return (data || []) as Category[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
