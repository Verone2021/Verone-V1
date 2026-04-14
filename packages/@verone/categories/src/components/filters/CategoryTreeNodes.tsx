'use client';

/**
 * Node sub-components for CategoryTreeFilter
 * CategorySubcategoryNode, CategoryNode (renders subcategories)
 */

import { Badge } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import { cn } from '@verone/utils';
import { ChevronDown, ChevronRight, X } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface EnrichedSubcategory {
  id: string;
  name: string;
  category_id: string;
  productCount: number;
}

export interface EnrichedCategory {
  id: string;
  name: string;
  family_id: string;
  subcategories: EnrichedSubcategory[];
  productCount: number;
}

export interface EnrichedFamily {
  id: string;
  name: string;
  categories: EnrichedCategory[];
  productCount: number;
}

// ============================================================================
// SUBCATEGORY NODE
// ============================================================================

export function SubcategoryNode({
  subcategory,
  isSelected,
  onToggle,
}: {
  subcategory: EnrichedSubcategory;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const isEmpty = subcategory.productCount === 0;

  return (
    <label
      className={cn(
        'flex items-center gap-2 p-2 rounded transition-colors',
        isEmpty ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        isSelected
          ? 'bg-black text-white'
          : isEmpty
            ? 'bg-gray-50'
            : 'hover:bg-gray-100'
      )}
    >
      <Checkbox
        checked={isSelected}
        disabled={isEmpty}
        onCheckedChange={onToggle}
        className={cn(
          'h-4 w-4',
          isSelected &&
            'border-white data-[state=checked]:bg-white data-[state=checked]:text-black'
        )}
      />
      <span
        className={cn('flex-1 text-sm truncate', isEmpty && 'text-gray-400')}
      >
        {subcategory.name}
      </span>
      <span
        className={cn(
          'text-xs',
          isSelected
            ? 'text-white/70'
            : isEmpty
              ? 'text-gray-300'
              : 'text-gray-500'
        )}
      >
        ({subcategory.productCount})
      </span>
    </label>
  );
}

// ============================================================================
// CATEGORY NODE
// ============================================================================

export function CategoryNode({
  category,
  isSelected,
  isExpanded,
  selectedSubcategories,
  onToggle,
  onExpandToggle,
  onSubcategoryToggle,
}: {
  category: EnrichedCategory;
  isSelected: boolean;
  isExpanded: boolean;
  selectedSubcategories: string[];
  onToggle: () => void;
  onExpandToggle: () => void;
  onSubcategoryToggle: (subcategoryId: string) => void;
}) {
  const selectedSubsCount = category.subcategories.filter(sub =>
    selectedSubcategories.includes(sub.id)
  ).length;

  return (
    <div className="space-y-1">
      <div
        className={cn(
          'flex items-center gap-2 p-2 rounded transition-colors',
          isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
        )}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
          className="h-4 w-4"
        />

        <button
          onClick={onExpandToggle}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <span
            className={cn(
              'text-sm truncate',
              isSelected ? 'font-medium text-blue-900' : 'text-black',
              category.productCount === 0 && 'text-gray-400'
            )}
          >
            {category.name}
          </span>
          <span
            className={cn(
              'text-xs',
              category.productCount === 0 ? 'text-gray-300' : 'text-gray-500'
            )}
          >
            ({category.productCount})
          </span>
          {selectedSubsCount > 0 && !isSelected && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200"
            >
              {selectedSubsCount}
            </Badge>
          )}
        </button>

        {category.subcategories.length > 0 && (
          <button
            onClick={onExpandToggle}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-gray-500" />
            ) : (
              <ChevronRight className="h-3 w-3 text-gray-500" />
            )}
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="ml-6 space-y-1">
          {category.subcategories.map(subcategory => (
            <SubcategoryNode
              key={subcategory.id}
              subcategory={subcategory}
              isSelected={selectedSubcategories.includes(subcategory.id)}
              onToggle={() => onSubcategoryToggle(subcategory.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ACTIVE FILTER BADGES
// ============================================================================

export function ActiveFilterBadges({
  selectedFamilies,
  selectedCategories,
  selectedSubcategories,
  families,
  categories,
  subcategories,
  onFamilyToggle,
  onCategoryToggle,
  onSubcategoryToggle,
}: {
  selectedFamilies: string[];
  selectedCategories: string[];
  selectedSubcategories: string[];
  families: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  subcategories: { id: string; name: string }[];
  onFamilyToggle: (id: string) => void;
  onCategoryToggle: (id: string) => void;
  onSubcategoryToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {selectedFamilies.map(familyId => {
        const family = families.find(f => f.id === familyId);
        return family ? (
          <Badge
            key={`family-${familyId}`}
            variant="secondary"
            className="text-xs cursor-pointer hover:bg-gray-200 gap-1"
            onClick={() => onFamilyToggle(familyId)}
          >
            {family.name}
            <X className="h-3 w-3" />
          </Badge>
        ) : null;
      })}

      {selectedCategories.map(categoryId => {
        const category = categories.find(c => c.id === categoryId);
        return category ? (
          <Badge
            key={`category-${categoryId}`}
            variant="outline"
            className="text-xs cursor-pointer hover:bg-blue-100 gap-1 border-blue-300 text-blue-800"
            onClick={() => onCategoryToggle(categoryId)}
          >
            {category.name}
            <X className="h-3 w-3" />
          </Badge>
        ) : null;
      })}

      {selectedSubcategories.slice(0, 3).map(subcategoryId => {
        const subcategory = subcategories.find(s => s.id === subcategoryId);
        return subcategory ? (
          <Badge
            key={`subcategory-${subcategoryId}`}
            variant="outline"
            className="text-xs cursor-pointer hover:bg-gray-200 gap-1"
            onClick={() => onSubcategoryToggle(subcategoryId)}
          >
            {subcategory.name}
            <X className="h-3 w-3" />
          </Badge>
        ) : null;
      })}

      {selectedSubcategories.length > 3 && (
        <Badge variant="secondary" className="text-xs">
          +{selectedSubcategories.length - 3} autres
        </Badge>
      )}
    </div>
  );
}
