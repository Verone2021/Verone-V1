'use client';

/**
 * CatalogueFilterPanel - Panneau de filtres HORIZONTAL 2025
 *
 * FONCTIONNALITÉS :
 * - ☑ Sélection MULTI-NIVEAUX (Famille > Catégorie > Sous-catégorie)
 * - Filtres fournisseurs avec compteurs globaux
 * - Filtres statuts produits
 * - Bouton "Effacer tous les filtres"
 * - Layout HORIZONTAL (3 colonnes)
 */

import { useState, useMemo } from 'react';

import type { Organisation } from '@verone/organisations';
import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@verone/ui';
import { ScrollArea } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  ChevronDown,
  ChevronRight,
  Filter,
  Building2,
  Activity,
  Tag,
  X,
  RotateCcw,
  Folder,
  FolderOpen,
} from 'lucide-react';

// Types
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
  supplier_id?: string;
  product_status?: string;
}

// FilterState avec sélection multi-niveaux
export interface FilterState {
  search: string;
  families: string[];
  categories: string[];
  subcategories: string[];
  suppliers: string[];
  statuses: string[];
}

interface CatalogueFilterPanelProps {
  // Données hiérarchie
  families: Family[];
  categories: Category[];
  subcategories: Subcategory[];
  products: Product[];

  // Fournisseurs avec compteurs globaux
  suppliers: Organisation[];

  // État des filtres
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;

  // Style
  className?: string;
}

// Labels français pour statuts
const STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  preorder: 'Précommande',
  discontinued: 'Arrêté',
  draft: 'Brouillon',
};

// Icônes pour statuts
const STATUS_ICONS: Record<string, string> = {
  active: '✓',
  preorder: '📅',
  discontinued: '⚠',
  draft: '📝',
};

// Structure hiérarchique enrichie
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
            subcategoryProductCounts.get(product.subcategory_id) || 0;
          subcategoryProductCounts.set(product.subcategory_id, count + 1);
        }
      });
    }

    const enrichedSubcategories = subcategories.map(sub => ({
      ...sub,
      productCount: subcategoryProductCounts.get(sub.id) || 0,
    }));

    const categoriesMap = new Map<string, EnrichedCategory>();
    // MODIFICATION: Afficher TOUTES les sous-catégories (même avec 0 produits)
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

    // MODIFICATION: Afficher TOUTES les catégories et familles (même vides)
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

  // Calculer compteurs par statut
  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach(product => {
      if (product.product_status) {
        counts.set(
          product.product_status,
          (counts.get(product.product_status) || 0) + 1
        );
      }
    });
    return counts;
  }, [products]);

  const availableStatuses = useMemo(() => {
    return Array.from(statusCounts.keys()).sort();
  }, [statusCounts]);

  // Fournisseurs avec produits
  const suppliersWithProducts = useMemo(() => {
    return suppliers
      .filter(s => (s._count?.products || 0) > 0)
      .sort((a, b) => (b._count?.products || 0) - (a._count?.products || 0));
  }, [suppliers]);

  // Handlers
  const handleFamilyToggle = (familyId: string) => {
    const newFamilies = filters.families.includes(familyId)
      ? filters.families.filter(id => id !== familyId)
      : [...filters.families, familyId];
    onFiltersChange({ ...filters, families: newFamilies });
  };

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(id => id !== categoryId)
      : [...filters.categories, categoryId];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handleSubcategoryToggle = (subcategoryId: string) => {
    const newSubcategories = filters.subcategories.includes(subcategoryId)
      ? filters.subcategories.filter(id => id !== subcategoryId)
      : [...filters.subcategories, subcategoryId];
    onFiltersChange({ ...filters, subcategories: newSubcategories });
  };

  const handleSupplierToggle = (supplierId: string) => {
    const newSuppliers = filters.suppliers.includes(supplierId)
      ? filters.suppliers.filter(id => id !== supplierId)
      : [...filters.suppliers, supplierId];
    onFiltersChange({ ...filters, suppliers: newSuppliers });
  };

  const handleStatusToggle = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: newStatuses });
  };

  const handleClearAll = () => {
    onFiltersChange({
      search: filters.search,
      families: [],
      categories: [],
      subcategories: [],
      suppliers: [],
      statuses: [],
    });
  };

  // Toggle expand family/category
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

  // Compter filtres actifs
  const categoryFilterCount =
    filters.families.length +
    filters.categories.length +
    filters.subcategories.length;

  const activeFilterCount =
    categoryFilterCount + filters.suppliers.length + filters.statuses.length;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Ligne de filtres horizontale */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Icône filtres + compteur */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-black" />
          <span className="text-sm font-medium text-black">Filtres</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {activeFilterCount}
            </Badge>
          )}
        </div>

        {/* Filtre Catégories (Popover avec arborescence) */}
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
                      {/* Famille */}
                      <div
                        className={cn(
                          'flex items-center gap-2 p-2 rounded transition-colors',
                          isFamilySelected ? 'bg-black/5' : 'hover:bg-gray-50'
                        )}
                      >
                        <Checkbox
                          checked={isFamilySelected}
                          onCheckedChange={() => handleFamilyToggle(family.id)}
                          disabled={family.productCount === 0}
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
                          onClick={() => toggleFamilyExpand(family.id)}
                          className="p-1"
                        >
                          {isFamilyExpanded ? (
                            <ChevronDown className="h-3 w-3 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-gray-500" />
                          )}
                        </button>
                      </div>

                      {/* Catégories */}
                      {isFamilyExpanded && (
                        <div className="ml-6 space-y-1">
                          {family.categories.map(category => {
                            const isCategoryExpanded = expandedCategories.has(
                              category.id
                            );
                            const isCategorySelected =
                              filters.categories.includes(category.id);

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
                                      handleCategoryToggle(category.id)
                                    }
                                    disabled={category.productCount === 0}
                                    className="h-4 w-4"
                                  />
                                  <button
                                    onClick={() =>
                                      toggleCategoryExpand(category.id)
                                    }
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
                                      onClick={() =>
                                        toggleCategoryExpand(category.id)
                                      }
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

                                {/* Sous-catégories */}
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
                                              handleSubcategoryToggle(
                                                subcategory.id
                                              )
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

        {/* Filtre Fournisseurs */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-9 gap-2',
                filters.suppliers.length > 0 && 'border-black bg-gray-50'
              )}
            >
              <Building2 className="h-4 w-4" />
              Fournisseurs
              {filters.suppliers.length > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-black text-white text-xs px-1.5 py-0"
                >
                  {filters.suppliers.length}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[420px] p-0" align="start">
            <ScrollArea className="h-64">
              <div className="p-2 space-y-1">
                {suppliersWithProducts.map(supplier => {
                  const isSelected = filters.suppliers.includes(supplier.id);
                  const count = supplier._count?.products || 0;
                  return (
                    <label
                      key={supplier.id}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded cursor-pointer transition-colors',
                        isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() =>
                          handleSupplierToggle(supplier.id)
                        }
                        className="h-4 w-4"
                      />
                      <span
                        className={cn(
                          'flex-1 text-sm truncate',
                          isSelected && 'font-medium'
                        )}
                      >
                        {supplier.name}
                      </span>
                      <span className="text-xs text-gray-500">({count})</span>
                    </label>
                  );
                })}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Filtre Statuts */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-9 gap-2',
                filters.statuses.length > 0 && 'border-black bg-gray-50'
              )}
            >
              <Activity className="h-4 w-4" />
              Statut
              {filters.statuses.length > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-black text-white text-xs px-1.5 py-0"
                >
                  {filters.statuses.length}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="start">
            <div className="p-2 space-y-1">
              {availableStatuses.map(status => {
                const isSelected = filters.statuses.includes(status);
                const count = statusCounts.get(status) || 0;
                const label = STATUS_LABELS[status] || status;
                const icon = STATUS_ICONS[status] || '';
                return (
                  <label
                    key={status}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded cursor-pointer transition-colors',
                      isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleStatusToggle(status)}
                      className="h-4 w-4"
                    />
                    <span
                      className={cn(
                        'flex-1 text-sm',
                        isSelected && 'font-medium'
                      )}
                    >
                      {icon} {label}
                    </span>
                    <span className="text-xs text-gray-500">({count})</span>
                  </label>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* Bouton Effacer */}
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

      {/* Badges filtres actifs */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {/* Familles */}
          {filters.families.map(famId => {
            const fam = families.find(f => f.id === famId);
            return fam ? (
              <Badge
                key={`fam-${famId}`}
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-gray-200 gap-1"
                onClick={() => handleFamilyToggle(famId)}
              >
                {fam.name}
                <X className="h-3 w-3" />
              </Badge>
            ) : null;
          })}
          {/* Catégories */}
          {filters.categories.map(catId => {
            const cat = categories.find(c => c.id === catId);
            return cat ? (
              <Badge
                key={`cat-${catId}`}
                variant="outline"
                className="text-xs cursor-pointer hover:bg-blue-100 gap-1 border-blue-300 text-blue-800"
                onClick={() => handleCategoryToggle(catId)}
              >
                {cat.name}
                <X className="h-3 w-3" />
              </Badge>
            ) : null;
          })}
          {/* Sous-catégories */}
          {filters.subcategories.map(subId => {
            const sub = subcategories.find(s => s.id === subId);
            return sub ? (
              <Badge
                key={`sub-${subId}`}
                variant="outline"
                className="text-xs cursor-pointer hover:bg-gray-200 gap-1"
                onClick={() => handleSubcategoryToggle(subId)}
              >
                {sub.name}
                <X className="h-3 w-3" />
              </Badge>
            ) : null;
          })}
          {/* Fournisseurs */}
          {filters.suppliers.map(suppId => {
            const supp = suppliers.find(s => s.id === suppId);
            return supp ? (
              <Badge
                key={`supp-${suppId}`}
                variant="outline"
                className="text-xs cursor-pointer hover:bg-gray-200 gap-1"
                onClick={() => handleSupplierToggle(suppId)}
              >
                {supp.name}
                <X className="h-3 w-3" />
              </Badge>
            ) : null;
          })}
          {/* Statuts */}
          {filters.statuses.map(status => {
            const label = STATUS_LABELS[status] || status;
            const icon = STATUS_ICONS[status] || '';
            return (
              <Badge
                key={`status-${status}`}
                variant="outline"
                className="text-xs cursor-pointer hover:bg-gray-200 gap-1"
                onClick={() => handleStatusToggle(status)}
              >
                {icon} {label}
                <X className="h-3 w-3" />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CatalogueFilterPanel;
