'use client';

/**
 * CatalogueFilterPanel - Panneau de filtres HORIZONTAL 2025
 *
 * Sélection multi-niveaux (Famille > Catégorie > Sous-catégorie)
 * Filtres fournisseurs, statuts, et badges filtres actifs.
 */

import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import { cn } from '@verone/utils';
import { Filter, RotateCcw } from 'lucide-react';

import { CatalogueActiveFilterBadges } from './CatalogueActiveFilterBadges';
import { CatalogueHierarchyFilter } from './CatalogueHierarchyFilter';
import { CatalogueStatusFilter } from './CatalogueStatusFilter';
import { CatalogueSupplierFilter } from './CatalogueSupplierFilter';
import type {
  CatalogueFilterPanelProps,
  FilterState,
} from './catalogue-filter.types';
import { useCatalogueFilterPanel } from './use-catalogue-filter-panel';

export type { FilterState };

export function CatalogueFilterPanel({
  families,
  categories,
  subcategories,
  products,
  suppliers,
  filters,
  onFiltersChange,
  className,
}: CatalogueFilterPanelProps) {
  const {
    expandedFamilies,
    expandedCategories,
    enrichedHierarchy,
    statusCounts,
    availableStatuses,
    suppliersWithProducts,
    categoryFilterCount,
    activeFilterCount,
    handleFamilyToggle,
    handleCategoryToggle,
    handleSubcategoryToggle,
    handleSupplierToggle,
    handleStatusToggle,
    handleClearAll,
    toggleFamilyExpand,
    toggleCategoryExpand,
  } = useCatalogueFilterPanel({
    families,
    categories,
    subcategories,
    products,
    suppliers,
    filters,
    onFiltersChange,
  });

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-black" />
          <span className="text-sm font-medium text-black">Filtres</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {activeFilterCount}
            </Badge>
          )}
        </div>

        <CatalogueHierarchyFilter
          enrichedHierarchy={enrichedHierarchy}
          filters={filters}
          expandedFamilies={expandedFamilies}
          expandedCategories={expandedCategories}
          categoryFilterCount={categoryFilterCount}
          onFamilyToggle={handleFamilyToggle}
          onCategoryToggle={handleCategoryToggle}
          onSubcategoryToggle={handleSubcategoryToggle}
          onFamilyExpand={toggleFamilyExpand}
          onCategoryExpand={toggleCategoryExpand}
        />

        <CatalogueSupplierFilter
          suppliersWithProducts={suppliersWithProducts}
          selectedSuppliers={filters.suppliers}
          onSupplierToggle={handleSupplierToggle}
        />

        <CatalogueStatusFilter
          availableStatuses={availableStatuses}
          statusCounts={statusCounts}
          selectedStatuses={filters.statuses}
          onStatusToggle={handleStatusToggle}
        />

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-9 text-xs text-gray-600 hover:text-black"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Effacer tout
          </Button>
        )}
      </div>

      {activeFilterCount > 0 && (
        <CatalogueActiveFilterBadges
          filters={filters}
          families={families}
          categories={categories}
          subcategories={subcategories}
          suppliers={suppliers}
          onFamilyToggle={handleFamilyToggle}
          onCategoryToggle={handleCategoryToggle}
          onSubcategoryToggle={handleSubcategoryToggle}
          onSupplierToggle={handleSupplierToggle}
          onStatusToggle={handleStatusToggle}
        />
      )}
    </div>
  );
}

export default CatalogueFilterPanel;
