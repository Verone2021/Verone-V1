import type { Organisation } from '@verone/organisations';

export interface Family {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  family_id: string;
}

export interface Subcategory {
  id: string;
  name: string;
  category_id: string;
}

export interface Product {
  id: string;
  subcategory_id?: string;
  supplier_id?: string;
  product_status?: string;
}

export interface FilterState {
  search: string;
  families: string[];
  categories: string[];
  subcategories: string[];
  suppliers: string[];
  statuses: string[];
}

export interface CatalogueFilterPanelProps {
  families: Family[];
  categories: Category[];
  subcategories: Subcategory[];
  products: Product[];
  suppliers: Organisation[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

export interface EnrichedSubcategory extends Subcategory {
  productCount: number;
}

export interface EnrichedCategory extends Category {
  subcategories: EnrichedSubcategory[];
  productCount: number;
}

export interface EnrichedFamily extends Family {
  categories: EnrichedCategory[];
  productCount: number;
}

export const STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  preorder: 'Précommande',
  discontinued: 'Arrêté',
  draft: 'Brouillon',
};

export const STATUS_ICONS: Record<string, string> = {
  active: '✓',
  preorder: '📅',
  discontinued: '⚠',
  draft: '📝',
};
