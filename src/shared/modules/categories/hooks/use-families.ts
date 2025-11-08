'use client';

import { useState, useEffect } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import type { Database } from '@verone/utils/supabase/types';

type Family = Database['public']['Tables']['families']['Row'];
type FamilyInsert = Database['public']['Tables']['families']['Insert'];
type FamilyUpdate = Database['public']['Tables']['families']['Update'];

export interface FamilyWithStats extends Family {
  categories_count?: number;
  products_count?: number;
}

export function useFamilies() {
  const [families, setFamilies] = useState<FamilyWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchFamilies = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer toutes les familles avec statistiques
      const { data, error } = await supabase
        .from('families')
        .select(
          `
          *,
          categories!categories_family_id_fkey(id)
        `
        )
        .order('display_order')
        .order('name');

      if (error) throw error;

      // Calculer les statistiques pour chaque famille
      const familiesWithStats: FamilyWithStats[] = (data || []).map(family => ({
        ...family,
        categories_count: family.categories?.length || 0,
        products_count: 0, // TODO: Calculer via join avec products si nécessaire
      }));

      setFamilies(familiesWithStats);
    } catch (err) {
      console.error('❌ Erreur lors du chargement des familles:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const createFamily = async (
    familyData: Omit<FamilyInsert, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      // Générer slug unique à partir du nom
      const slug = generateSlug(familyData.name);

      const { data, error } = await supabase
        .from('families')
        .insert([
          {
            ...familyData,
            slug,
            display_order: familyData.display_order || 0,
          },
        ])
        .select()
        .single();

      if (error) {
        // Gestion spécifique des erreurs de contrainte unique
        if (error.code === '23505') {
          // Créer une erreur avec le code préservé pour le form
          const duplicateError: any = new Error(
            'Une famille avec ce nom existe déjà. Veuillez choisir un nom différent.'
          );
          duplicateError.code = '23505';
          throw duplicateError;
        }
        throw error;
      }

      console.log('✅ Famille créée:', data.name);

      // Recharger les données pour synchroniser l'état
      await fetchFamilies();

      return data;
    } catch (err) {
      console.error('❌ Erreur lors de la création de la famille:', err);
      console.error(
        "❌ Message d'erreur:",
        err instanceof Error ? err.message : 'Erreur inconnue'
      );
      console.error('❌ Détails complets:', JSON.stringify(err, null, 2));
      throw err;
    }
  };

  const updateFamily = async (id: string, familyData: FamilyUpdate) => {
    try {
      // Mettre à jour le slug si le nom change
      const updateData = { ...familyData };
      if (familyData.name) {
        updateData.slug = generateSlug(familyData.name);
      }
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('families')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Famille modifiée:', data.name);

      // Recharger les données pour synchroniser l'état
      await fetchFamilies();

      return data;
    } catch (err) {
      console.error('❌ Erreur lors de la modification de la famille:', err);
      throw err;
    }
  };

  const deleteFamily = async (id: string) => {
    try {
      // Vérifier s'il y a des catégories liées
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id')
        .eq('family_id', id);

      if (categoriesError) throw categoriesError;

      if (categories && categories.length > 0) {
        throw new Error(
          `Impossible de supprimer cette famille car elle contient ${categories.length} catégorie(s). Supprimez d'abord les catégories.`
        );
      }

      const { error } = await supabase.from('families').delete().eq('id', id);

      if (error) throw error;

      console.log('✅ Famille supprimée');

      // Recharger les données pour synchroniser l'état
      await fetchFamilies();
    } catch (err) {
      console.error('❌ Erreur lors de la suppression de la famille:', err);
      throw err;
    }
  };

  const toggleFamilyStatus = async (id: string, isActive: boolean) => {
    try {
      const { data, error } = await supabase
        .from('families')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log(
        `✅ Famille ${isActive ? 'activée' : 'désactivée'}:`,
        data.name
      );

      // Recharger les données pour synchroniser l'état
      await fetchFamilies();

      return data;
    } catch (err) {
      console.error('❌ Erreur lors du changement de statut:', err);
      throw err;
    }
  };

  const updateFamilyOrder = async (id: string, sortOrder: number) => {
    try {
      const { data, error } = await supabase
        .from('families')
        .update({
          display_order: sortOrder,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Ordre de la famille mis à jour:', data.name);

      // Recharger les données pour synchroniser l'état
      await fetchFamilies();

      return data;
    } catch (err) {
      console.error("❌ Erreur lors de la mise à jour de l'ordre:", err);
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

  // Charger les familles au montage du hook
  useEffect(() => {
    fetchFamilies();
  }, []);

  return {
    families,
    loading,
    error,
    fetchFamilies,
    createFamily,
    updateFamily,
    deleteFamily,
    toggleFamilyStatus,
    updateFamilyOrder,
  };
}
