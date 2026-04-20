'use client';

import type {
  FamilyWithStats,
  CategoryWithCount,
  SubcategoryWithDetails,
  Product,
} from '@verone/categories';
import type { Organisation } from '@verone/organisations';
import { ViewModeToggle } from '@verone/ui';
import { cn } from '@verone/utils';
import { Search, X, RefreshCw } from 'lucide-react';

import {
  CatalogueFilterPanel,
  type FilterState,
} from '@/components/catalogue/CatalogueFilterPanel';

import type { Filters } from './types';

interface CatalogueToolbarProps {
  families: FamilyWithStats[];
  allCategories: (CategoryWithCount & { family_id: string })[];
  subcategories: SubcategoryWithDetails[];
  products: Product[];
  allSuppliers: Organisation[];
  filters: Filters;
  searchInput: string;
  hasActiveFilters: boolean;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  onResetAllFilters: () => void;
  onResync: () => void;
  onFiltersChange: (newFilterState: FilterState) => void;
}

export function CatalogueToolbar({
  families,
  allCategories,
  subcategories,
  products,
  allSuppliers,
  filters,
  searchInput,
  hasActiveFilters,
  viewMode,
  onViewModeChange,
  onSearchChange,
  onClearSearch,
  onResetAllFilters,
  onResync,
  onFiltersChange,
}: CatalogueToolbarProps) {
  return (
    <div className="flex items-start gap-4">
      <CatalogueFilterPanel
        families={families}
        categories={allCategories}
        subcategories={subcategories}
        products={products}
        suppliers={allSuppliers}
        filters={{
          search: filters.search,
          families: filters.families,
          categories: filters.categories,
          subcategories: filters.subcategories,
          suppliers: filters.suppliers,
          statuses: filters.statuses,
          stockLevels: filters.stockLevels,
          conditions: filters.conditions,
          completionLevels: filters.completionLevels,
        }}
        onFiltersChange={onFiltersChange}
        className="flex-1"
      />

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black opacity-50" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchInput}
            onChange={onSearchChange}
            className={cn(
              'w-56 border border-black bg-white py-2 pl-10 text-sm text-black placeholder:text-black placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2',
              searchInput ? 'pr-8' : 'pr-3'
            )}
          />
          {searchInput && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-black opacity-50 hover:opacity-100 transition-opacity"
              title="Effacer la recherche"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onResync}
          className="flex items-center gap-1.5 h-[38px] px-3 border border-black bg-white text-black hover:bg-gray-100 transition-colors text-sm"
          title="Resynchroniser les produits depuis la base (force un re-fetch si les filtres se désynchronisent)"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Resynchroniser</span>
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetAllFilters}
            className="flex items-center gap-1.5 h-[38px] px-3 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm"
            title="Effacer tous les filtres"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Effacer filtres</span>
          </button>
        )}

        <ViewModeToggle
          value={viewMode}
          onChange={onViewModeChange}
          variant="outline"
        />
      </div>
    </div>
  );
}
