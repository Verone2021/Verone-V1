/* eslint-disable @typescript-eslint/no-floating-promises, react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import type { Family, Category, Subcategory } from './types';

// ============================================================================
// HOOK - useHierarchicalFilters
// ============================================================================

/**
 * Hook pour gérer les filtres hiérarchiques en cascade
 * Famille → Catégorie → Sous-catégorie
 */
export function useHierarchicalFilters() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<
    string | null
  >(null);

  const supabase = createClient();

  // Charger toutes les familles au mount
  useEffect(() => {
    loadFamilies();
  }, []);

  // Charger catégories quand famille change
  useEffect(() => {
    if (selectedFamilyId) {
      loadCategories(selectedFamilyId);
    } else {
      setCategories([]);
      setSelectedCategoryId(null);
    }
  }, [selectedFamilyId]);

  // Charger sous-catégories quand catégorie change
  useEffect(() => {
    if (selectedCategoryId) {
      loadSubcategories(selectedCategoryId);
    } else {
      setSubcategories([]);
      setSelectedSubcategoryId(null);
    }
  }, [selectedCategoryId]);

  const loadFamilies = async () => {
    try {
      const { data, error } = await supabase
        .from('families')
        .select('id, name, slug')
        .order('name');

      if (error) throw error;
      setFamilies(data ?? []);
    } catch (error) {
      console.error('Error loading families:', error);
    }
  };

  const loadCategories = async (familyId: string) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, family_id')
        .eq('family_id', familyId)
        .order('name');

      if (error) throw error;
      setCategories(data ?? []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadSubcategories = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('id, name, slug, category_id')
        .eq('category_id', categoryId)
        .order('name');

      if (error) throw error;
      setSubcategories(data ?? []);
    } catch (error) {
      console.error('Error loading subcategories:', error);
    }
  };

  const resetFilters = () => {
    setSelectedFamilyId(null);
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
  };

  return {
    families,
    categories,
    subcategories,
    selectedFamilyId,
    selectedCategoryId,
    selectedSubcategoryId,
    setSelectedFamilyId,
    setSelectedCategoryId,
    setSelectedSubcategoryId,
    resetFilters,
  };
}
