'use client';

/**
 * CategoryTreeFilter - Filtre de catégories avec sélection MULTI-NIVEAUX
 *
 * FONCTIONNALITÉS :
 * - Arborescence à 3 niveaux (Famille > Catégorie > Sous-catégorie)
 * - Checkbox à TOUS les niveaux
 * - Compteurs de produits à chaque niveau
 * - Design minimaliste noir/blanc Vérone
 */

import { useState, useMemo } from 'react';

import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Tag,
  RotateCcw,
} from 'lucide-react';

import {
  CategoryNode,
  ActiveFilterBadges,
  type EnrichedCategory,
  type EnrichedFamily,
} from './CategoryTreeNodes';

// ============================================================================
// TYPES
// ============================================================================

interface Family {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  family_id: string;
}

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
}

interface Product {
  id: string;
  subcategory_id?: string;
}

export interface CategoryTreeFilterProps {
  families: Family[];
  categories: Category[];
  subcategories: Subcategory[];
  products: Product[];

  selectedFamilies: string[];
  selectedCategories: string[];
  selectedSubcategories: string[];

  onFamilyToggle: (familyId: string) => void;
  onCategoryToggle: (categoryId: string) => void;
  onSubcategoryToggle: (subcategoryId: string) => void;
  onClearAll?: () => void;

  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CategoryTreeFilter({
  families,
  categories,
  subcategories,
  products,
  selectedFamilies,
  selectedCategories,
  selectedSubcategories,
  onFamilyToggle,
  onCategoryToggle,
  onSubcategoryToggle,
  onClearAll,
  className,
}: CategoryTreeFilterProps) {
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(
    new Set()
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  // Enrichir la hiérarchie avec les compteurs de produits
  const enrichedHierarchy = useMemo(() => {
    const subcategoryProductCounts = new Map<string, number>();

    if (products && Array.isArray(products)) {
      products.forEach(product => {
        if (product.subcategory_id) {
          const count =
            subcategoryProductCounts.get(product.subcategory_id) ?? 0;
          subcategoryProductCounts.set(product.subcategory_id, count + 1);
        }
      });
    }

    const enrichedSubcategories = subcategories.map(sub => ({
      ...sub,
      productCount: subcategoryProductCounts.get(sub.id) ?? 0,
    }));

    const categoriesMap = new Map<string, EnrichedCategory>();
    categories.forEach(cat => {
      const catSubcategories = enrichedSubcategories.filter(
        sub => sub.category_id === cat.id
      );
      const productCount = catSubcategories.reduce(
        (sum, sub) => sum + sub.productCount,
        0
      );
      categoriesMap.set(cat.id, {
        ...cat,
        subcategories: catSubcategories,
        productCount,
      });
    });

    const enrichedFamilies: EnrichedFamily[] = families.map(family => {
      const familyCategories = categories
        .filter(cat => cat.family_id === family.id)
        .map(cat => categoriesMap.get(cat.id)!)
        .filter(cat => cat != null);

      const productCount = familyCategories.reduce(
        (sum, cat) => sum + cat.productCount,
        0
      );

      return { ...family, categories: familyCategories, productCount };
    });

    return enrichedFamilies;
  }, [families, categories, subcategories, products]);

  const toggleFamilyExpand = (familyId: string) => {
    setExpandedFamilies(prev => {
      const next = new Set(prev);
      if (next.has(familyId)) next.delete(familyId);
      else next.add(familyId);
      return next;
    });
  };

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const activeFilterCount =
    selectedFamilies.length +
    selectedCategories.length +
    selectedSubcategories.length;

  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    } else {
      selectedFamilies.forEach(id => onFamilyToggle(id));
      selectedCategories.forEach(id => onCategoryToggle(id));
      selectedSubcategories.forEach(id => onSubcategoryToggle(id));
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header avec compteur et reset */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-black" />
          <span className="text-sm font-medium text-black">Catégories</span>
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="bg-black text-white text-xs px-1.5 py-0"
            >
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-6 text-xs text-gray-600 hover:text-black"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Effacer
          </Button>
        )}
      </div>

      {/* Arborescence */}
      <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {enrichedHierarchy.map(family => {
            const isFamilyExpanded = expandedFamilies.has(family.id);
            const isFamilySelected = selectedFamilies.includes(family.id);

            const selectedCountInFamily =
              family.categories.reduce((sum, cat) => {
                const catSelected = selectedCategories.includes(cat.id) ? 1 : 0;
                const subSelected = cat.subcategories.filter(sub =>
                  selectedSubcategories.includes(sub.id)
                ).length;
                return sum + catSelected + subSelected;
              }, 0) + (isFamilySelected ? 1 : 0);

            return (
              <div key={family.id} className="space-y-1">
                {/* FAMILLE (Niveau 0) avec CHECKBOX */}
                <div
                  className={cn(
                    'flex items-center gap-2 p-2 rounded transition-colors',
                    isFamilySelected ? 'bg-black/5' : 'hover:bg-gray-50'
                  )}
                >
                  <Checkbox
                    checked={isFamilySelected}
                    onCheckedChange={() => onFamilyToggle(family.id)}
                    className="h-4 w-4"
                  />

                  <button
                    onClick={() => toggleFamilyExpand(family.id)}
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
                        isFamilySelected
                          ? 'font-semibold text-black'
                          : 'text-black',
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
                    {selectedCountInFamily > 0 && !isFamilySelected && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {selectedCountInFamily}
                      </Badge>
                    )}
                  </button>

                  <button
                    onClick={() => toggleFamilyExpand(family.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {isFamilyExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>

                {/* CATÉGORIES (Niveau 1) */}
                {isFamilyExpanded && (
                  <div className="ml-6 space-y-1">
                    {family.categories.map(category => (
                      <CategoryNode
                        key={category.id}
                        category={category}
                        isSelected={selectedCategories.includes(category.id)}
                        isExpanded={expandedCategories.has(category.id)}
                        selectedSubcategories={selectedSubcategories}
                        onToggle={() => onCategoryToggle(category.id)}
                        onExpandToggle={() => toggleCategoryExpand(category.id)}
                        onSubcategoryToggle={onSubcategoryToggle}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {enrichedHierarchy.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              Aucune catégorie avec produits disponible
            </div>
          )}
        </div>
      </div>

      {/* Badges filtres actifs */}
      {activeFilterCount > 0 && (
        <ActiveFilterBadges
          selectedFamilies={selectedFamilies}
          selectedCategories={selectedCategories}
          selectedSubcategories={selectedSubcategories}
          families={families}
          categories={categories}
          subcategories={subcategories}
          onFamilyToggle={onFamilyToggle}
          onCategoryToggle={onCategoryToggle}
          onSubcategoryToggle={onSubcategoryToggle}
        />
      )}
    </div>
  );
}

export default CategoryTreeFilter;
