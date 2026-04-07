'use client';

import { CategoryFilterCombobox } from '@verone/categories';
import { ButtonV2, Card, CardContent, Input } from '@verone/ui';
import { cn } from '@verone/utils';
import { Search, LayoutGrid, List, X } from 'lucide-react';

interface CatalogueFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  subcategoryFilter: string | undefined;
  onSubcategoryChange: (value: string | undefined) => void;
  statusFilter: 'all' | 'enabled' | 'disabled';
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  activeTab: 'general' | 'sourced' | 'affiliate';
  filteredCounts: {
    general: number;
    sourced: number;
    affiliate: number;
  };
  onResetFilters: () => void;
}

export function CatalogueFilters({
  searchTerm,
  onSearchChange,
  subcategoryFilter,
  onSubcategoryChange,
  statusFilter,
  viewMode,
  onViewModeChange,
  activeTab,
  filteredCounts,
  onResetFilters,
}: CatalogueFiltersProps) {
  const currentCount =
    activeTab === 'general'
      ? filteredCounts.general
      : activeTab === 'sourced'
        ? filteredCounts.sourced
        : filteredCounts.affiliate;

  const hasActiveFilters =
    searchTerm || statusFilter !== 'all' || subcategoryFilter;

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher par nom ou référence..."
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          <CategoryFilterCombobox
            value={subcategoryFilter}
            onValueChange={onSubcategoryChange}
            entityType="products"
            placeholder="Catégorie..."
          />
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            {currentCount} produit{currentCount > 1 ? 's' : ''} affiché
            {currentCount > 1 ? 's' : ''}
          </p>

          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg p-0.5 bg-gray-100">
              <button
                onClick={() => onViewModeChange('grid')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                )}
                title="Vue grille"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                )}
                title="Vue liste"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {hasActiveFilters && (
              <ButtonV2 variant="ghost" size="sm" onClick={onResetFilters}>
                <X className="h-4 w-4 mr-1" />
                Réinitialiser filtres
              </ButtonV2>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
