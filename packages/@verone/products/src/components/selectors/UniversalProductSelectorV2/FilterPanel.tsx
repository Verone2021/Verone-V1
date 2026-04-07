'use client';

import { Badge } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { Filter, Layers, LayoutGrid, List, Package, Tag } from 'lucide-react';

import type { Family, Category, Subcategory } from './types';

// ============================================================================
// COMPOSANT - FilterPanel (colonne gauche: filtres hiérarchiques + badges + toggle vue)
// ============================================================================

interface FilterPanelProps {
  families: Family[];
  categories: Category[];
  subcategories: Subcategory[];
  selectedFamilyId: string | null;
  selectedCategoryId: string | null;
  selectedSubcategoryId: string | null;
  onFamilyChange: (value: string | null) => void;
  onCategoryChange: (value: string | null) => void;
  onSubcategoryChange: (value: string | null) => void;
  sourcingFilter: 'interne' | 'externe' | null;
  creationModeFilter: 'complete' | 'sourcing' | null;
  onSourcingFilterChange: (value: 'interne' | 'externe' | null) => void;
  onCreationModeFilterChange: (value: 'complete' | 'sourcing' | null) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function FilterPanel({
  families,
  categories,
  subcategories,
  selectedFamilyId,
  selectedCategoryId,
  selectedSubcategoryId,
  onFamilyChange,
  onCategoryChange,
  onSubcategoryChange,
  sourcingFilter,
  creationModeFilter,
  onSourcingFilterChange,
  onCreationModeFilterChange,
  viewMode,
  onViewModeChange,
}: FilterPanelProps) {
  return (
    <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-[#6c7293]" />
        <Label className="text-xs font-semibold text-gray-700">Filtres</Label>
      </div>

      {/* Selects en ligne avec flex-wrap pour layout horizontal compact */}
      <div className="flex flex-wrap gap-2">
        {/* Filtre Famille */}
        <Select
          value={selectedFamilyId ?? 'all'}
          onValueChange={value =>
            onFamilyChange(value === 'all' ? null : value)
          }
        >
          <SelectTrigger className="h-9 flex-1 min-w-[140px] text-sm border hover:border-[#3b86d1] transition-colors">
            <Package className="h-3.5 w-3.5 text-[#6c7293] mr-1.5" />
            <SelectValue placeholder="Famille" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-sm">
              Toutes
            </SelectItem>
            {families.map(family => (
              <SelectItem key={family.id} value={family.id} className="text-sm">
                {family.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtre Catégorie */}
        <Select
          value={selectedCategoryId ?? 'all'}
          onValueChange={value =>
            onCategoryChange(value === 'all' ? null : value)
          }
          disabled={!selectedFamilyId}
        >
          <SelectTrigger className="h-9 flex-1 min-w-[140px] text-sm border hover:border-[#3b86d1] transition-colors disabled:opacity-50">
            <Layers className="h-3.5 w-3.5 text-[#6c7293] mr-1.5" />
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-sm">
              Toutes
            </SelectItem>
            {categories.map(category => (
              <SelectItem
                key={category.id}
                value={category.id}
                className="text-sm"
              >
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtre Sous-catégorie */}
        <Select
          value={selectedSubcategoryId ?? 'all'}
          onValueChange={value =>
            onSubcategoryChange(value === 'all' ? null : value)
          }
          disabled={!selectedCategoryId}
        >
          <SelectTrigger className="h-9 flex-1 min-w-[140px] text-sm border hover:border-[#3b86d1] transition-colors disabled:opacity-50">
            <Tag className="h-3.5 w-3.5 text-[#6c7293] mr-1.5" />
            <SelectValue placeholder="Sous-cat." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-sm">
              Toutes
            </SelectItem>
            {subcategories.map(subcategory => (
              <SelectItem
                key={subcategory.id}
                value={subcategory.id}
                className="text-sm"
              >
                {subcategory.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filtres secondaires + Toggle vue */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant={sourcingFilter === 'interne' ? 'default' : 'outline'}
            className={cn(
              'h-6 px-2 py-0.5 text-xs cursor-pointer transition-all duration-150',
              sourcingFilter === 'interne' && 'bg-[#3b86d1] hover:bg-[#2d6ba8]'
            )}
            onClick={() =>
              onSourcingFilterChange(
                sourcingFilter === 'interne' ? null : 'interne'
              )
            }
          >
            Interne
          </Badge>
          <Badge
            variant={sourcingFilter === 'externe' ? 'default' : 'outline'}
            className={cn(
              'h-6 px-2 py-0.5 text-xs cursor-pointer transition-all duration-150',
              sourcingFilter === 'externe' && 'bg-[#3b86d1] hover:bg-[#2d6ba8]'
            )}
            onClick={() =>
              onSourcingFilterChange(
                sourcingFilter === 'externe' ? null : 'externe'
              )
            }
          >
            Externe
          </Badge>
          <Badge
            variant={creationModeFilter === 'sourcing' ? 'default' : 'outline'}
            className={cn(
              'h-6 px-2 py-0.5 text-xs cursor-pointer transition-all duration-150',
              creationModeFilter === 'sourcing' &&
                'bg-[#844fc1] hover:bg-[#6d3da0]'
            )}
            onClick={() =>
              onCreationModeFilterChange(
                creationModeFilter === 'sourcing' ? null : 'sourcing'
              )
            }
          >
            Sourcing
          </Badge>
        </div>
        {/* Toggle Grid/List */}
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={cn(
              'p-1.5 transition-colors',
              viewMode === 'grid'
                ? 'bg-[#3b86d1] text-white'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            )}
            title="Vue grille"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={cn(
              'p-1.5 transition-colors',
              viewMode === 'list'
                ? 'bg-[#3b86d1] text-white'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            )}
            title="Vue liste"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
