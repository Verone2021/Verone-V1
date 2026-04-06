'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { useFamilies } from '@verone/categories';
import { useCategories } from '@verone/categories';
import { useSubcategories } from '@verone/categories';
import type {
  FamilyWithStats,
  CategoryWithChildren,
  CategoryWithCount,
  SubcategoryWithDetails,
} from '@verone/categories';

import type { HierarchyFilters, FormState } from './types';

export interface UseCategoriesPageReturn {
  // Data
  families: FamilyWithStats[] | null | undefined;
  filteredFamilies: FamilyWithStats[];
  allCategories: CategoryWithCount[] | null | undefined;
  // State
  filters: HierarchyFilters;
  setFilters: React.Dispatch<React.SetStateAction<HierarchyFilters>>;
  selectedItems: string[];
  expandedFamilies: string[];
  expandedCategories: string[];
  formState: FormState;
  // Loading / errors
  isLoading: boolean;
  hasError: string | null | false | undefined;
  familiesError: string | null | undefined;
  categoriesError: string | null | undefined;
  subcategoriesError: string | null | undefined;
  loadTime: number;
  // Handlers — expansion & selection
  toggleFamilyExpansion: (familyId: string) => void;
  toggleCategoryExpansion: (categoryId: string) => void;
  toggleItemSelection: (itemId: string) => void;
  // Handlers — form
  openCreateForm: (
    type: 'family' | 'category' | 'subcategory',
    parentId?: string
  ) => void;
  openEditForm: (
    type: 'family' | 'category' | 'subcategory',
    data: FamilyWithStats | CategoryWithChildren | SubcategoryWithDetails
  ) => void;
  closeForm: () => void;
  handleFormSubmit: (formData: unknown) => Promise<void>;
  // Handlers — delete & bulk
  handleDelete: (
    type: 'family' | 'category' | 'subcategory',
    id: string
  ) => Promise<void>;
  handleBulkStatusToggle: () => Promise<void>;
  handleDeleteItems: () => Promise<void>;
  // Handlers — navigation
  navigateToFamily: (familyId: string) => void;
  navigateToCategory: (categoryId: string) => void;
  navigateToSubcategory: (subcategoryId: string) => void;
  // Computed helpers
  getCategoriesForFamily: (familyId: string) => CategoryWithChildren[];
  getSubcategoriesForCategory: (categoryId: string) => SubcategoryWithDetails[];
}

export function useCategoriesPage(): UseCategoriesPageReturn {
  const startTime = performance.now();
  const router = useRouter();

  const {
    families,
    loading: familiesLoading,
    error: familiesError,
    createFamily,
    updateFamily,
    deleteFamily,
    toggleFamilyStatus: _toggleFamilyStatus,
  } = useFamilies();

  const {
    categories: _categories,
    allCategories,
    loading: categoriesLoading,
    error: categoriesError,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  const {
    subcategories,
    loading: subcategoriesLoading,
    error: subcategoriesError,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
  } = useSubcategories();

  const [filters, setFilters] = useState<HierarchyFilters>({
    search: '',
    status: 'all',
    level: 'all',
  });
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expandedFamilies, setExpandedFamilies] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [formState, setFormState] = useState<FormState>({
    isOpen: false,
    type: 'family',
    mode: 'create',
  });

  const filteredFamilies = useMemo(() => {
    if (!families) return [];

    let filtered = [...families];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        family =>
          family.name.toLowerCase().includes(searchLower) ||
          family.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status !== 'all') {
      const isActiveFilter = filters.status === 'active';
      filtered = filtered.filter(family => family.is_active === isActiveFilter);
    }

    return filtered;
  }, [families, filters]);

  const getCategoriesForFamily = (familyId: string): CategoryWithChildren[] => {
    if (!allCategories) return [];
    return allCategories
      .filter(cat => cat.family_id === familyId)
      .map(cat => ({ ...cat, children: [], level: cat.level ?? 0 }));
  };

  const getSubcategoriesForCategory = (
    categoryId: string
  ): SubcategoryWithDetails[] => {
    if (!subcategories) return [];
    return subcategories.filter(sub => sub.category_id === categoryId);
  };

  const toggleFamilyExpansion = (familyId: string) => {
    setExpandedFamilies(prev =>
      prev.includes(familyId)
        ? prev.filter(id => id !== familyId)
        : [...prev, familyId]
    );
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const openCreateForm = (
    type: 'family' | 'category' | 'subcategory',
    parentId?: string
  ) => {
    setFormState({ isOpen: true, type, mode: 'create', parentId });
  };

  const openEditForm = (
    type: 'family' | 'category' | 'subcategory',
    data: FamilyWithStats | CategoryWithChildren | SubcategoryWithDetails
  ): void => {
    if (type === 'family') {
      setFormState({
        isOpen: true,
        type: 'family',
        mode: 'edit',
        data: data as FamilyWithStats,
      });
    } else if (type === 'category') {
      setFormState({
        isOpen: true,
        type: 'category',
        mode: 'edit',
        data: data as CategoryWithChildren,
      });
    } else {
      setFormState({
        isOpen: true,
        type: 'subcategory',
        mode: 'edit',
        data: data as SubcategoryWithDetails,
      });
    }
  };

  const closeForm = () => {
    setFormState({ isOpen: false, type: 'family', mode: 'create' });
  };

  const handleFormSubmit = async (formData: unknown): Promise<void> => {
    try {
      if (formState.mode === 'create') {
        switch (formState.type) {
          case 'family':
            await createFamily(formData as Parameters<typeof createFamily>[0]);
            break;
          case 'category':
            if (!formState.parentId) break;
            await createCategory({
              ...(formData as Omit<
                Parameters<typeof createCategory>[0],
                'family_id'
              >),
              family_id: formState.parentId,
            });
            break;
          case 'subcategory':
            if (!formState.parentId) break;
            await createSubcategory({
              ...(formData as Omit<
                Parameters<typeof createSubcategory>[0],
                'category_id'
              >),
              category_id: formState.parentId,
            });
            break;
        }
      } else {
        if (!formState.data) return;
        switch (formState.type) {
          case 'family':
            await updateFamily(
              formState.data.id,
              formData as Parameters<typeof updateFamily>[1]
            );
            break;
          case 'category':
            await updateCategory(
              formState.data.id,
              formData as Parameters<typeof updateCategory>[1]
            );
            break;
          case 'subcategory':
            await updateSubcategory(
              formState.data.id,
              formData as Parameters<typeof updateSubcategory>[1]
            );
            break;
        }
      }
      closeForm();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CategoriesPage] Form submission failed:', message);
    }
  };

  const handleDelete = async (
    type: 'family' | 'category' | 'subcategory',
    id: string
  ) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;

    try {
      switch (type) {
        case 'family':
          await deleteFamily(id);
          break;
        case 'category':
          await deleteCategory(id);
          break;
        case 'subcategory':
          await deleteSubcategory(id);
          break;
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert(
        "Erreur lors de la suppression. Vérifiez qu'il n'y a pas d'éléments liés."
      );
    }
  };

  const handleBulkStatusToggle = async () => {
    console.warn('Changement de statut en lot pour :', selectedItems);
    // TODO: Implémenter le changement en lot avec les hooks
  };

  const handleDeleteItems = async () => {
    if (!confirm(`Supprimer ${selectedItems.length} élément(s) ?`)) return;
    console.warn('Suppression des éléments :', selectedItems);
    // TODO: Implémenter la suppression en lot avec les hooks
  };

  const navigateToFamily = (familyId: string) => {
    router.push(`/catalogue/families/${familyId}`);
  };

  const navigateToCategory = (categoryId: string) => {
    router.push(`/catalogue/categories/${categoryId}`);
  };

  const navigateToSubcategory = (subcategoryId: string) => {
    router.push(`/catalogue/subcategories/${subcategoryId}`);
  };

  /* eslint-disable @typescript-eslint/prefer-nullish-coalescing -- Intentional boolean OR for combined loading/error states */
  const isLoading =
    familiesLoading || categoriesLoading || subcategoriesLoading;
  const hasError = familiesError || categoriesError || subcategoriesError;
  /* eslint-enable @typescript-eslint/prefer-nullish-coalescing */

  const loadTime = Math.round(performance.now() - startTime);

  return {
    families,
    filteredFamilies,
    allCategories,
    filters,
    setFilters,
    selectedItems,
    expandedFamilies,
    expandedCategories,
    formState,
    isLoading,
    hasError,
    familiesError,
    categoriesError,
    subcategoriesError,
    loadTime,
    toggleFamilyExpansion,
    toggleCategoryExpansion,
    toggleItemSelection,
    openCreateForm,
    openEditForm,
    closeForm,
    handleFormSubmit,
    handleDelete,
    handleBulkStatusToggle,
    handleDeleteItems,
    navigateToFamily,
    navigateToCategory,
    navigateToSubcategory,
    getCategoriesForFamily,
    getSubcategoriesForCategory,
  };
}
