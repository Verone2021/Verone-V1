/**
 * Types for SubcategoryForm
 */

export interface CategoryWithFamily {
  id: string;
  name: string;
  family_name: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SubcategoryFormData {
  parent_id: string;
  family_id: string;
  name: string;
  description: string;
  image_url?: string;
  display_order: number;
  is_active: boolean;
}

export interface SubcategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (subcategory: Subcategory) => void;
  initialData?: Subcategory | null;
  mode: 'create' | 'edit';
  categories: CategoryWithFamily[];
}
