'use client';

import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@verone/ui';
import { ScrollArea } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  ChevronDown,
  ChevronRight,
  Tag,
  Folder,
  FolderOpen,
} from 'lucide-react';

import type { EnrichedFamily, FilterState } from './catalogue-filter.types';

interface CatalogueHierarchyFilterProps {
  enrichedHierarchy: EnrichedFamily[];
  filters: FilterState;
  expandedFamilies: Set<string>;
  expandedCategories: Set<string>;
  categoryFilterCount: number;
  onFamilyToggle: (id: string) => void;
  onCategoryToggle: (id: string) => void;
  onSubcategoryToggle: (id: string) => void;
  onFamilyExpand: (id: string) => void;
  onCategoryExpand: (id: string) => void;
}

export function CatalogueHierarchyFilter({
  enrichedHierarchy,
  filters,
  expandedFamilies,
  expandedCategories,
  categoryFilterCount,
  onFamilyToggle,
  onCategoryToggle,
  onSubcategoryToggle,
  onFamilyExpand,
  onCategoryExpand,
}: CatalogueHierarchyFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 gap-2',
            categoryFilterCount > 0 && 'border-black bg-gray-50'
          )}
        >
          <Tag className="h-4 w-4" />
          Catégories
          {categoryFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="bg-black text-white text-xs px-1.5 py-0"
            >
              {categoryFilterCount}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <ScrollArea className="h-80">
          <div className="p-3 space-y-1">
            {enrichedHierarchy.map(family => {
              const isFamilyExpanded = expandedFamilies.has(family.id);
              const isFamilySelected = filters.families.includes(family.id);

              return (
                <div key={family.id} className="space-y-1">
                  <div
                    className={cn(
                      'flex items-center gap-2 p-2 rounded transition-colors',
                      isFamilySelected ? 'bg-black/5' : 'hover:bg-gray-50'
                    )}
                  >
                    <Checkbox
                      checked={isFamilySelected}
                      onCheckedChange={() => onFamilyToggle(family.id)}
                      disabled={family.productCount === 0}
                      className="h-4 w-4"
                    />
                    <button
                      onClick={() => onFamilyExpand(family.id)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    >
                      {isFamilyExpanded ? (
                        <FolderOpen className="h-4 w-4 flex-shrink-0 text-black" />
                      ) : (
                        <Folder className="h-4 w-4 flex-shrink-0 text-black" />
                      )}
                      <span
                        className={cn(
                          'text-sm truncate',
                          isFamilySelected && 'font-semibold',
                          family.productCount === 0 && 'text-gray-400'
                        )}
                      >
                        {family.name}
                      </span>
                      <span
                        className={cn(
                          'text-xs',
                          family.productCount === 0
                            ? 'text-gray-300'
                            : 'text-gray-500'
                        )}
                      >
                        ({family.productCount})
                      </span>
                    </button>
                    <button
                      onClick={() => onFamilyExpand(family.id)}
                      className="p-1"
                    >
                      {isFamilyExpanded ? (
                        <ChevronDown className="h-3 w-3 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-gray-500" />
                      )}
                    </button>
                  </div>

                  {isFamilyExpanded && (
                    <div className="ml-6 space-y-1">
                      {family.categories.map(category => {
                        const isCategoryExpanded = expandedCategories.has(
                          category.id
                        );
                        const isCategorySelected = filters.categories.includes(
                          category.id
                        );

                        return (
                          <div key={category.id} className="space-y-1">
                            <div
                              className={cn(
                                'flex items-center gap-2 p-2 rounded transition-colors',
                                isCategorySelected
                                  ? 'bg-blue-50'
                                  : 'hover:bg-gray-50'
                              )}
                            >
                              <Checkbox
                                checked={isCategorySelected}
                                onCheckedChange={() =>
                                  onCategoryToggle(category.id)
                                }
                                disabled={category.productCount === 0}
                                className="h-4 w-4"
                              />
                              <button
                                onClick={() => onCategoryExpand(category.id)}
                                className="flex items-center gap-2 flex-1 min-w-0 text-left"
                              >
                                <span
                                  className={cn(
                                    'text-sm truncate',
                                    isCategorySelected &&
                                      'font-medium text-blue-900',
                                    category.productCount === 0 &&
                                      'text-gray-400'
                                  )}
                                >
                                  {category.name}
                                </span>
                                <span
                                  className={cn(
                                    'text-xs',
                                    category.productCount === 0
                                      ? 'text-gray-300'
                                      : 'text-gray-500'
                                  )}
                                >
                                  ({category.productCount})
                                </span>
                              </button>
                              {category.subcategories.length > 0 && (
                                <button
                                  onClick={() => onCategoryExpand(category.id)}
                                  className="p-1"
                                >
                                  {isCategoryExpanded ? (
                                    <ChevronDown className="h-3 w-3 text-gray-500" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3 text-gray-500" />
                                  )}
                                </button>
                              )}
                            </div>

                            {isCategoryExpanded && (
                              <div className="ml-6 space-y-1">
                                {category.subcategories.map(subcategory => {
                                  const isSubcategorySelected =
                                    filters.subcategories.includes(
                                      subcategory.id
                                    );
                                  return (
                                    <label
                                      key={subcategory.id}
                                      className={cn(
                                        'flex items-center gap-2 p-2 rounded cursor-pointer transition-colors',
                                        isSubcategorySelected
                                          ? 'bg-black text-white'
                                          : 'hover:bg-gray-100'
                                      )}
                                    >
                                      <Checkbox
                                        checked={isSubcategorySelected}
                                        onCheckedChange={() =>
                                          onSubcategoryToggle(subcategory.id)
                                        }
                                        disabled={
                                          subcategory.productCount === 0
                                        }
                                        className={cn(
                                          'h-4 w-4',
                                          isSubcategorySelected &&
                                            'border-white data-[state=checked]:bg-white data-[state=checked]:text-black'
                                        )}
                                      />
                                      <span
                                        className={cn(
                                          'flex-1 text-sm truncate',
                                          subcategory.productCount === 0 &&
                                            'text-gray-400'
                                        )}
                                      >
                                        {subcategory.name}
                                      </span>
                                      <span
                                        className={cn(
                                          'text-xs',
                                          isSubcategorySelected
                                            ? 'text-white/70'
                                            : subcategory.productCount === 0
                                              ? 'text-gray-300'
                                              : 'text-gray-500'
                                        )}
                                      >
                                        ({subcategory.productCount})
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
