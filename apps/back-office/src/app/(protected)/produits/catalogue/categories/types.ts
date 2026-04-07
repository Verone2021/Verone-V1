export type { HierarchyFilters, FormState, HierarchyCallbacks };

import type {
  FamilyWithStats,
  CategoryWithChildren,
  SubcategoryWithDetails,
} from '@verone/categories';

interface HierarchyFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
  level: 'all' | 'family' | 'category' | 'subcategory';
}

interface FormState {
  isOpen: boolean;
  type: 'family' | 'category' | 'subcategory';
  mode: 'create' | 'edit';
  data?: FamilyWithStats | CategoryWithChildren | SubcategoryWithDetails;
  parentId?: string;
}

interface HierarchyCallbacks {
  toggleFamilyExpansion: (familyId: string) => void;
  toggleCategoryExpansion: (categoryId: string) => void;
  toggleItemSelection: (itemId: string) => void;
  openCreateForm: (
    type: 'family' | 'category' | 'subcategory',
    parentId?: string
  ) => void;
  openEditForm: (
    type: 'family' | 'category' | 'subcategory',
    data: FamilyWithStats | CategoryWithChildren | SubcategoryWithDetails
  ) => void;
  handleDelete: (
    type: 'family' | 'category' | 'subcategory',
    id: string
  ) => Promise<void>;
  navigateToFamily: (familyId: string) => void;
  navigateToCategory: (categoryId: string) => void;
  navigateToSubcategory: (subcategoryId: string) => void;
  getCategoriesForFamily: (familyId: string) => CategoryWithChildren[];
  getSubcategoriesForCategory: (categoryId: string) => SubcategoryWithDetails[];
}
