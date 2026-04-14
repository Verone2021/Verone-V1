'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  useFamilies,
  useCategories,
  useSubcategories,
  type SubcategoryWithDetails,
} from '@verone/categories';
import type { Database } from '@verone/utils/supabase/types';

type Family = Database['public']['Tables']['families']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface CategoryFormData {
  name: string;
  description?: string;
  is_active: boolean;
  display_order?: number;
  image_url?: string;
}

interface SubcategoryFormData extends CategoryFormData {
  category_id?: string;
  slug?: string;
}

export function useCategoryDetail(categoryId: string) {
  const router = useRouter();
  const { families, loading: familiesLoading } = useFamilies();
  const {
    allCategories,
    loading: categoriesLoading,
    updateCategory,
  } = useCategories();
  const {
    subcategories,
    loading: subcategoriesLoading,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
  } = useSubcategories();

  const [category, setCategory] = useState<Category | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [categorySubcategories, setCategorySubcategories] = useState<
    SubcategoryWithDetails[]
  >([]);

  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isNewSubcategoryOpen, setIsNewSubcategoryOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] =
    useState<SubcategoryWithDetails | null>(null);
  const [isEditSubcategoryOpen, setIsEditSubcategoryOpen] = useState(false);

  useEffect(() => {
    if (allCategories && categoryId) {
      const foundCategory = allCategories.find(c => c.id === categoryId);
      setCategory(foundCategory ?? null);
    }
  }, [allCategories, categoryId]);

  useEffect(() => {
    if (families && category?.family_id) {
      const foundFamily = families.find(f => f.id === category.family_id);
      setFamily(foundFamily ?? null);
    }
  }, [families, category]);

  useEffect(() => {
    if (subcategories && categoryId) {
      const subs = subcategories.filter(sub => sub.category_id === categoryId);
      setCategorySubcategories(subs);
    }
  }, [subcategories, categoryId]);

  const loading = familiesLoading || categoriesLoading || subcategoriesLoading;

  const handleBackToFamily = () => {
    if (family) {
      router.push(`/catalogue/families/${family.id}`);
    } else {
      router.push('/produits/catalogue/categories');
    }
  };

  const handleSubmitCategory = async (formData: CategoryFormData) => {
    try {
      await updateCategory(categoryId, {
        name: formData.name,
        description: formData.description,
        is_active: formData.is_active,
        display_order: formData.display_order,
        image_url: formData.image_url,
      });
      setIsEditCategoryOpen(false);
    } catch (error) {
      console.error('Erreur lors de la modification de la categorie:', error);
    }
  };

  const handleSubmitNewSubcategory = async (formData: SubcategoryFormData) => {
    try {
      await createSubcategory({
        name: formData.name,
        slug: formData.slug ?? formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        category_id: categoryId,
        is_active: formData.is_active,
        display_order: formData.display_order,
        image_url: formData.image_url,
      });
      setIsNewSubcategoryOpen(false);
    } catch (error) {
      console.error('Erreur lors de la creation de la sous-categorie:', error);
    }
  };

  const handleEditSubcategory = (subcategory: SubcategoryWithDetails) => {
    setEditingSubcategory(subcategory);
    setIsEditSubcategoryOpen(true);
  };

  const handleSubmitEditSubcategory = async (formData: SubcategoryFormData) => {
    if (!editingSubcategory) return;
    try {
      await updateSubcategory(editingSubcategory.id, {
        name: formData.name,
        description: formData.description,
        is_active: formData.is_active,
        display_order: formData.display_order,
        image_url: formData.image_url,
      });
      setIsEditSubcategoryOpen(false);
      setEditingSubcategory(null);
    } catch (error) {
      console.error(
        'Erreur lors de la modification de la sous-categorie:',
        error
      );
    }
  };

  const handleDeleteSubcategory = async (
    subcategoryId: string,
    subcategoryName: string
  ) => {
    if (
      confirm(
        `Etes-vous sur de vouloir supprimer la sous-categorie "${subcategoryName}" ? Cette action est irreversible.`
      )
    ) {
      try {
        await deleteSubcategory(subcategoryId);
      } catch (error) {
        console.error(
          'Erreur lors de la suppression de la sous-categorie:',
          error
        );
      }
    }
  };

  return {
    category,
    family,
    families,
    allCategories,
    categorySubcategories,
    loading,
    isEditCategoryOpen,
    setIsEditCategoryOpen,
    isNewSubcategoryOpen,
    setIsNewSubcategoryOpen,
    editingSubcategory,
    setEditingSubcategory,
    isEditSubcategoryOpen,
    setIsEditSubcategoryOpen,
    handleBackToFamily,
    handleSubmitCategory,
    handleSubmitNewSubcategory,
    handleEditSubcategory,
    handleSubmitEditSubcategory,
    handleDeleteSubcategory,
  };
}
