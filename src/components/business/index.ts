/**
 * Index des composants business Vérone
 * Export centralisé pour faciliter les imports
 */

// Modules temporairement commentés (fichiers manquants)
// export { ProductCard } from './product-card';
// export { CollectionGrid } from './collection-grid';

// Interfaces business communes
export interface VéroneProduct {
  id: string;
  name: string;
  sku: string;
  price_ht: number; // Prix en centimes
  status:
    | 'in_stock'
    | 'out_of_stock'
    | 'preorder'
    | 'coming_soon'
    | 'discontinued';
  primary_image_url: string;
  category?: string;
  variant_attributes?: Record<string, string>;
}

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}
