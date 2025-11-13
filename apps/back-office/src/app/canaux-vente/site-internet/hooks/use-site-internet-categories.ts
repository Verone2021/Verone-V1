/**
 * Hook: useSiteInternetCategories
 * Gère catégories pour le canal site internet
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

// Note: Using 'any' type because is_visible_menu was added via migration
// and TypeScript types may not be fully up-to-date yet
type Category = any;

/**
 * Fetch toutes catégories
 */
async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Erreur fetch categories:', error);
    throw error;
  }

  // Cast to any[] since is_visible_menu was added via migration
  return (data || []) as any[];
}

/**
 * Hook principal: récupère catégories
 */
export function useSiteInternetCategories() {
  return useQuery({
    queryKey: ['site-internet-categories'],
    queryFn: fetchCategories,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Toggle visibilité catégorie dans menu navigation
 */
export function useToggleCategoryVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      isVisible,
    }: {
      categoryId: string;
      isVisible: boolean;
    }) => {
      const { error } = await supabase
        .from('categories')
        .update({
          is_visible_menu: isVisible,
          updated_at: new Date().toISOString(),
        })
        .eq('id', categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['site-internet-categories'],
      });
    },
  });
}

/**
 * Mettre à jour ordre affichage catégorie
 */
export function useUpdateCategoryOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      displayOrder,
    }: {
      categoryId: string;
      displayOrder: number;
    }) => {
      const { error } = await supabase
        .from('categories')
        .update({
          display_order: displayOrder,
          updated_at: new Date().toISOString(),
        })
        .eq('id', categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['site-internet-categories'],
      });
    },
  });
}

/**
 * Stats catégories site internet
 */
export function useSiteInternetCategoriesStats() {
  return useQuery({
    queryKey: ['site-internet-categories-stats'],
    queryFn: async () => {
      const { data: categories } = await supabase
        .from('categories')
        .select('*');

      if (!categories) return null;

      // Cast to any[] to access is_visible_menu
      const categoriesData = categories as any[];

      const total = categoriesData.length;
      const active = categoriesData.filter((c: any) => c.is_active).length;
      const visibleMenu = categoriesData.filter(
        (c: any) => c.is_active && c.is_visible_menu
      ).length;
      const rootCategories = categoriesData.filter(
        (c: any) => c.family_id === null
      ).length;

      return {
        total,
        active,
        visibleMenu,
        rootCategories,
        visiblePercentage: total > 0 ? (visibleMenu / total) * 100 : 0,
      };
    },
    staleTime: 60000, // 1 minute
  });
}

/**
 * Helper: Construire arborescence catégories
 * Note: Pour l'instant, structure plate (pas de parent_id)
 */
export function buildCategoryTree(categories: Category[]): Category[] {
  // Toutes les catégories sont racines (niveau 0)
  // Retourner avec children vides pour compatibilité UI
  return categories.map(cat => ({
    ...cat,
    children: [] as Category[],
  }));
}
