/**
 * Hook: useSiteInternetCategories
 * Gère catégories pour le canal site internet
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import type { Category } from '../types';

const supabase = createClient();

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

  return (data ?? []) as Category[];
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
 * Toggle visibilité catégorie dans menu navigation (avec optimistic update)
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
    onMutate: async ({ categoryId, isVisible }) => {
      // 1. Cancel ongoing queries
      await queryClient.cancelQueries({
        queryKey: ['site-internet-categories'],
      });

      // 2. Snapshot previous value
      const previousData = queryClient.getQueryData<Category[]>([
        'site-internet-categories',
      ]);

      // 3. Optimistically update cache
      if (previousData) {
        queryClient.setQueryData<Category[]>(
          ['site-internet-categories'],
          old =>
            old?.map(category =>
              category.id === categoryId
                ? { ...category, is_visible_menu: isVisible }
                : category
            ) ?? []
        );
      }

      // 4. Return context for rollback
      return { previousData };
    },
    onError: (err, variables, context) => {
      // 5. Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          ['site-internet-categories'],
          context.previousData
        );
      }
    },
    onSettled: async () => {
      // 6. Refetch to sync with server
      await queryClient.invalidateQueries({
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({
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

      const categoriesData = categories as Category[];

      const total = categoriesData.length;
      const active = categoriesData.filter(c => c.is_active).length;
      const visibleMenu = categoriesData.filter(
        c =>
          c.is_active &&
          (c as unknown as { is_visible_menu?: boolean }).is_visible_menu
      ).length;
      const rootCategories = categoriesData.filter(
        c => c.family_id === null
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
