'use client';

import type React from 'react';

import { Label } from '@verone/ui';

import type { FormData, Subcategory } from './variant-group-form.types';

interface Category {
  id: string;
  name: string;
}

interface Family {
  id: string;
  name: string;
}

interface Filters {
  familyId: string;
  categoryId: string;
}

interface VariantGroupCategorySelectorProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  formData: Pick<FormData, 'subcategory_id'>;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  families: Family[];
  filteredCategories: Category[];
  filteredSubcategories: Subcategory[];
  error?: string;
}

export function VariantGroupCategorySelector({
  filters,
  setFilters,
  formData,
  setFormData,
  families,
  filteredCategories,
  filteredSubcategories,
  error,
}: VariantGroupCategorySelectorProps) {
  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">
        Catégorisation <span className="text-red-500">*</span>
      </Label>
      <p className="text-xs text-gray-600">
        Sélectionnez la hiérarchie pour identifier la sous-catégorie des
        produits
      </p>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="family" className="text-xs text-gray-600">
            Famille
          </Label>
          <select
            id="family"
            value={filters.familyId}
            onChange={e => {
              setFilters({ familyId: e.target.value, categoryId: '' });
              setFormData(prev => ({ ...prev, subcategory_id: '' }));
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Sélectionner...</option>
            {families.map(family => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="text-xs text-gray-600">
            Catégorie
          </Label>
          <select
            id="category"
            value={filters.categoryId}
            onChange={e => {
              setFilters(prev => ({ ...prev, categoryId: e.target.value }));
              setFormData(prev => ({ ...prev, subcategory_id: '' }));
            }}
            disabled={!filters.familyId}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-100"
          >
            <option value="">Sélectionner...</option>
            {filteredCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subcategory" className="text-xs text-gray-600">
            Sous-catégorie
          </Label>
          <select
            id="subcategory"
            value={formData.subcategory_id}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                subcategory_id: e.target.value,
              }))
            }
            disabled={!filters.categoryId}
            className={`w-full border rounded-md px-3 py-2 text-sm disabled:bg-gray-100 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Sélectionner...</option>
            {filteredSubcategories.map(subcategory => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
