'use client';

/**
 * CategoryTreeFilter - Filtre de catégories avec sélection MULTI-NIVEAUX
 *
 * FONCTIONNALITÉS :
 * - Arborescence à 3 niveaux (Famille > Catégorie > Sous-catégorie)
 * - ☑ Checkbox à TOUS les niveaux (pas juste sous-catégories)
 * - Sélectionner une Famille → Voir tous les produits de cette famille
 * - Sélectionner une Catégorie → Voir tous les produits de cette catégorie
 * - Sélectionner une Sous-catégorie → Voir les produits de cette sous-catégorie
 * - Compteurs de produits à chaque niveau
 * - N'affiche que les éléments avec produits (>0)
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
  X,
  RotateCcw,
} from 'lucide-react';

// Types de données
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
  // Données hiérarchie
  families: Family[];
  categories: Category[];
  subcategories: Subcategory[];
  products: Product[];

  // Sélections MULTI-NIVEAUX
  selectedFamilies: string[];
  selectedCategories: string[];
  selectedSubcategories: string[];

  // Callbacks MULTI-NIVEAUX
  onFamilyToggle: (familyId: string) => void;
  onCategoryToggle: (categoryId: string) => void;
  onSubcategoryToggle: (subcategoryId: string) => void;

  // Action reset
  onClearAll?: () => void;

  className?: string;
}

// Structure hiérarchique enrichie avec compteurs
interface EnrichedSubcategory extends Subcategory {
  productCount: number;
}

interface EnrichedCategory extends Category {
  subcategories: EnrichedSubcategory[];
  productCount: number;
}

interface EnrichedFamily extends Family {
  categories: EnrichedCategory[];
  productCount: number;
}

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
    // Compteurs par sous-catégorie
    const subcategoryProductCounts = new Map<string, number>();

    if (products && Array.isArray(products)) {
      products.forEach(product => {
        if (product.subcategory_id) {
          const count =
            subcategoryProductCounts.get(product.subcategory_id) || 0;
          subcategoryProductCounts.set(product.subcategory_id, count + 1);
        }
      });
    }

    // Enrichir sous-catégories
    const enrichedSubcategories = subcategories.map(sub => ({
      ...sub,
      productCount: subcategoryProductCounts.get(sub.id) || 0,
    }));

    // Regrouper par catégorie
    const categoriesMap = new Map<string, EnrichedCategory>();
    categories.forEach(cat => {
      // MODIFICATION: Afficher TOUTES les sous-catégories (même avec 0 produits)
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

    // Regrouper par famille
    // MODIFICATION: Afficher TOUTES les catégories et familles (même avec 0 produits)
    const enrichedFamilies: EnrichedFamily[] = families.map(family => {
      const familyCategories = categories
        .filter(cat => cat.family_id === family.id)
        .map(cat => categoriesMap.get(cat.id)!)
        .filter(cat => cat != null);

      const productCount = familyCategories.reduce(
        (sum, cat) => sum + cat.productCount,
        0
      );

      return {
        ...family,
        categories: familyCategories,
        productCount,
      };
    });
    // MODIFICATION: Plus de filtre - afficher TOUTES les familles

    return enrichedFamilies;
  }, [families, categories, subcategories, products]);

  // Toggle famille expand/collapse
  const toggleFamilyExpand = (familyId: string) => {
    setExpandedFamilies(prev => {
      const next = new Set(prev);
      if (next.has(familyId)) {
        next.delete(familyId);
      } else {
        next.add(familyId);
      }
      return next;
    });
  };

  // Toggle catégorie expand/collapse
  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Nombre total de filtres actifs
  const activeFilterCount =
    selectedFamilies.length +
    selectedCategories.length +
    selectedSubcategories.length;

  // Handler reset
  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    } else {
      // Fallback: toggle off all selections
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

            // Compter sélections dans cette famille
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
                  {/* Checkbox Famille */}
                  <Checkbox
                    checked={isFamilySelected}
                    onCheckedChange={() => onFamilyToggle(family.id)}
                    className="h-4 w-4"
                  />

                  {/* Bouton expand/collapse */}
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

                  {/* Chevron */}
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
                    {family.categories.map(category => {
                      const isCategoryExpanded = expandedCategories.has(
                        category.id
                      );
                      const isCategorySelected = selectedCategories.includes(
                        category.id
                      );
                      const selectedSubsInCategory =
                        category.subcategories.filter(sub =>
                          selectedSubcategories.includes(sub.id)
                        ).length;

                      return (
                        <div key={category.id} className="space-y-1">
                          {/* CATÉGORIE avec CHECKBOX */}
                          <div
                            className={cn(
                              'flex items-center gap-2 p-2 rounded transition-colors',
                              isCategorySelected
                                ? 'bg-blue-50'
                                : 'hover:bg-gray-50'
                            )}
                          >
                            {/* Checkbox Catégorie */}
                            <Checkbox
                              checked={isCategorySelected}
                              onCheckedChange={() =>
                                onCategoryToggle(category.id)
                              }
                              className="h-4 w-4"
                            />

                            {/* Bouton expand/collapse */}
                            <button
                              onClick={() => toggleCategoryExpand(category.id)}
                              className="flex items-center gap-2 flex-1 min-w-0 text-left"
                            >
                              <span
                                className={cn(
                                  'text-sm truncate',
                                  isCategorySelected
                                    ? 'font-medium text-blue-900'
                                    : 'text-black',
                                  category.productCount === 0 && 'text-gray-400'
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
                              {selectedSubsInCategory > 0 &&
                                !isCategorySelected && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200"
                                  >
                                    {selectedSubsInCategory}
                                  </Badge>
                                )}
                            </button>

                            {/* Chevron */}
                            {category.subcategories.length > 0 && (
                              <button
                                onClick={() =>
                                  toggleCategoryExpand(category.id)
                                }
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                {isCategoryExpanded ? (
                                  <ChevronDown className="h-3 w-3 text-gray-500" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 text-gray-500" />
                                )}
                              </button>
                            )}
                          </div>

                          {/* SOUS-CATÉGORIES (Niveau 2) */}
                          {isCategoryExpanded && (
                            <div className="ml-6 space-y-1">
                              {category.subcategories.map(subcategory => {
                                const isSubcategorySelected =
                                  selectedSubcategories.includes(
                                    subcategory.id
                                  );
                                const isEmpty = subcategory.productCount === 0;

                                return (
                                  <label
                                    key={subcategory.id}
                                    className={cn(
                                      'flex items-center gap-2 p-2 rounded transition-colors',
                                      isEmpty
                                        ? 'cursor-not-allowed opacity-50'
                                        : 'cursor-pointer',
                                      isSubcategorySelected
                                        ? 'bg-black text-white'
                                        : isEmpty
                                          ? 'bg-gray-50'
                                          : 'hover:bg-gray-100'
                                    )}
                                  >
                                    {/* Checkbox Sous-catégorie */}
                                    <Checkbox
                                      checked={isSubcategorySelected}
                                      disabled={isEmpty}
                                      onCheckedChange={() =>
                                        onSubcategoryToggle(subcategory.id)
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
                                        isEmpty && 'text-gray-400'
                                      )}
                                    >
                                      {subcategory.name}
                                    </span>
                                    <span
                                      className={cn(
                                        'text-xs',
                                        isSubcategorySelected
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

          {/* État vide */}
          {enrichedHierarchy.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              Aucune catégorie avec produits disponible
            </div>
          )}
        </div>
      </div>

      {/* Badges filtres actifs (résumé) */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {/* Familles sélectionnées */}
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

          {/* Catégories sélectionnées */}
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

          {/* Sous-catégories sélectionnées (limite 3) */}
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

          {/* Indicateur +X autres */}
          {selectedSubcategories.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{selectedSubcategories.length - 3} autres
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

export default CategoryTreeFilter;
