'use client';

import { useState, useEffect, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import type { Database } from '@verone/utils/supabase/types';

type Subcategory = Database['public']['Tables']['subcategories']['Row'];
type SubcategoryInsert =
  Database['public']['Tables']['subcategories']['Insert'];
type SubcategoryUpdate =
  Database['public']['Tables']['subcategories']['Update'];

export interface SubcategoryWithDetails extends Subcategory {
  products_count?: number;
  category?: {
    id: string;
    name: string;
    family_id: string;
  };
}

interface SubcategoryRow {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  categories: {
    id: string;
    name: string;
    family_id: string;
  } | null;
}

export function useSubcategories(categoryId?: string) {
  const [subcategories, setSubcategories] = useState<SubcategoryWithDetails[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchSubcategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let baseQuery = supabase.from('subcategories').select(`
          id, name, slug, category_id, description, image_url, is_active, display_order, created_at, updated_at,
          categories!subcategories_category_id_fkey(
            id,
            name,
            family_id
          )
        `);

      // Filtrer par catégorie si spécifiée
      if (categoryId) {
        baseQuery = baseQuery.eq('category_id', categoryId);
      }

      const { data: subcategoriesData, error: fetchError } = await baseQuery
        .order('display_order')
        .order('name');

      if (fetchError) throw fetchError;

      // Obtenir les comptages en UNE seule requete groupee (au lieu de N requetes)
      const subcatIds = (
        (subcategoriesData ?? []) as unknown as SubcategoryRow[]
      ).map(s => s.id);
      let countMap: Record<string, number> = {};
      if (subcatIds.length > 0) {
        try {
          const { data: countData } = await supabase
            .from('products')
            .select('subcategory_id')
            .in('subcategory_id', subcatIds)
            .is('archived_at', null);
          if (countData) {
            countMap = (countData as { subcategory_id: string }[]).reduce(
              (acc, row) => {
                acc[row.subcategory_id] = (acc[row.subcategory_id] ?? 0) + 1;
                return acc;
              },
              {} as Record<string, number>
            );
          }
        } catch (_err) {
          // Comptage non critique — on continue avec 0
        }
      }

      const subcategoriesWithDetails: SubcategoryWithDetails[] = (
        (subcategoriesData ?? []) as unknown as SubcategoryRow[]
      ).map(sub => ({
        ...sub,
        products_count: countMap[sub.id] ?? 0,
        category: sub.categories
          ? {
              id: sub.categories.id,
              name: sub.categories.name,
              family_id: sub.categories.family_id,
            }
          : undefined,
      })) as unknown as SubcategoryWithDetails[];

      setSubcategories(subcategoriesWithDetails);
    } catch (err) {
      console.error('Erreur lors du chargement des sous-catégories:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [supabase, categoryId]);

  const createSubcategory = async (
    subcategoryData: Omit<SubcategoryInsert, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      // Générer slug unique à partir du nom
      const slug = generateSlug(subcategoryData.name);

      const { data, error } = await supabase
        .from('subcategories')
        .insert([
          {
            ...subcategoryData,
            slug,
            display_order: subcategoryData.display_order ?? 0,
          },
        ])
        .select(
          'id, name, slug, category_id, description, image_url, is_active, display_order, created_at, updated_at'
        )
        .single();

      if (error) {
        // Gestion spécifique des erreurs de contrainte unique
        if (error.code === '23505') {
          // Créer une erreur avec le code préservé pour le form
          const duplicateError: Error & { code?: string } = new Error(
            'Une sous-catégorie avec ce nom existe déjà dans cette catégorie. Veuillez choisir un nom différent.'
          );
          duplicateError.code = '23505';
          throw duplicateError;
        }
        throw error;
      }

      console.warn('Sous-catégorie créée:', data.name);

      // Recharger les données pour synchroniser l'état
      await fetchSubcategories();

      return data;
    } catch (err) {
      console.error('Erreur lors de la création de la sous-catégorie:', err);
      throw err;
    }
  };

  const updateSubcategory = async (
    id: string,
    subcategoryData: SubcategoryUpdate
  ) => {
    try {
      // Mettre à jour le slug si le nom change
      const updateData = { ...subcategoryData };
      if (subcategoryData.name) {
        updateData.slug = generateSlug(subcategoryData.name);
      }
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('subcategories')
        .update(updateData)
        .eq('id', id)
        .select(
          'id, name, slug, category_id, description, image_url, is_active, display_order, created_at, updated_at'
        )
        .single();

      if (error) throw error;

      console.warn('Sous-catégorie modifiée:', data.name);

      // Recharger les données pour synchroniser l'état
      await fetchSubcategories();

      return data;
    } catch (err) {
      console.error(
        'Erreur lors de la modification de la sous-catégorie:',
        err
      );
      throw err;
    }
  };

  const deleteSubcategory = async (id: string) => {
    try {
      // TODO: Vérifier s'il y a des produits liés si table products existe
      // const { data: products, error: productsError } = await supabase
      //   .from('products')
      //   .select('id')
      //   .eq('subcategory_id', id)

      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.warn('Sous-catégorie supprimée');

      // Recharger les données pour synchroniser l'état
      await fetchSubcategories();
    } catch (err) {
      console.error('Erreur lors de la suppression de la sous-catégorie:', err);
      throw err;
    }
  };

  const toggleSubcategoryStatus = async (id: string, isActive: boolean) => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(
          'id, name, slug, is_active, display_order, created_at, updated_at'
        )
        .single();

      if (error) throw error;

      console.warn(
        `Sous-catégorie ${isActive ? 'activée' : 'désactivée'}:`,
        data.name
      );

      // Recharger les données pour synchroniser l'état
      await fetchSubcategories();

      return data;
    } catch (err) {
      console.error('Erreur lors du changement de statut:', err);
      throw err;
    }
  };

  const updateSubcategoryOrder = async (id: string, sortOrder: number) => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .update({
          display_order: sortOrder,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id, name, slug, display_order, created_at, updated_at')
        .single();

      if (error) throw error;

      console.warn('Ordre de la sous-catégorie mis à jour:', data.name);

      // Recharger les données pour synchroniser l'état
      await fetchSubcategories();

      return data;
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'ordre:", err);
      throw err;
    }
  };

  const getSubcategoriesByCategory = async (
    catId: string
  ): Promise<SubcategoryWithDetails[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('subcategories')
        .select(
          `
          id, name, slug, category_id, description, image_url, is_active, display_order, created_at, updated_at,
          categories!subcategories_category_id_fkey(
            id,
            name,
            family_id
          )
        `
        )
        .eq('category_id', catId)
        .order('display_order')
        .order('name');

      if (fetchError) throw fetchError;

      return ((data ?? []) as unknown as SubcategoryRow[]).map(sub => ({
        ...sub,
        products_count: 0,
        category: sub.categories
          ? {
              id: sub.categories.id,
              name: sub.categories.name,
              family_id: sub.categories.family_id,
            }
          : undefined,
      })) as unknown as SubcategoryWithDetails[];
    } catch (err) {
      console.error(
        'Erreur lors du chargement des sous-catégories par catégorie:',
        err
      );
      throw err;
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Charger les sous-catégories au montage du hook
  useEffect(() => {
    void fetchSubcategories();
  }, [fetchSubcategories]);

  const refreshSubcategories = async () => {
    await fetchSubcategories();
  };

  return {
    subcategories,
    loading,
    error,
    fetchSubcategories,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    toggleSubcategoryStatus,
    updateSubcategoryOrder,
    getSubcategoriesByCategory,
    refreshSubcategories,
  };
}
