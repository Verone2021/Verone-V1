'use client';

/**
 * CategoryAccordion
 * Accordéon à 2 niveaux pour naviguer par catégories
 * Structure: Catégorie > Sous-catégorie
 */

import { useMemo } from 'react';

import { ChevronDown, FolderOpen } from 'lucide-react';

import type { LinkMeCatalogProduct } from '@/lib/hooks/use-linkme-catalog';
import { cn } from '@/lib/utils';

interface CategoryWithSubcategories {
  name: string;
  count: number;
  subcategories: {
    id: string;
    name: string;
    count: number;
  }[];
}

interface CategoryAccordionProps {
  products: LinkMeCatalogProduct[];
  selectedCategory: string | undefined;
  selectedSubcategory: string | undefined;
  onCategorySelect: (category: string | undefined) => void;
  onSubcategorySelect: (subcategoryId: string | undefined) => void;
}

export function CategoryAccordion({
  products,
  selectedCategory,
  selectedSubcategory,
  onCategorySelect,
  onSubcategorySelect,
}: CategoryAccordionProps): JSX.Element {
  // Construire la hiérarchie des catégories
  const categories = useMemo(() => {
    const categoryMap = new Map<string, CategoryWithSubcategories>();

    products.forEach(product => {
      const categoryName = product.category_name ?? 'Autres';
      const subcategoryId = product.subcategory_id;
      const subcategoryName = product.subcategory_name ?? 'Autres';

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          name: categoryName,
          count: 0,
          subcategories: [],
        });
      }

      const category = categoryMap.get(categoryName)!;
      category.count++;

      // Ajouter la sous-catégorie si elle n'existe pas déjà
      if (subcategoryId) {
        const existingSub = category.subcategories.find(
          s => s.id === subcategoryId
        );
        if (existingSub) {
          existingSub.count++;
        } else {
          category.subcategories.push({
            id: subcategoryId,
            name: subcategoryName,
            count: 1,
          });
        }
      }
    });

    // Trier les catégories et leurs sous-catégories
    return Array.from(categoryMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(cat => ({
        ...cat,
        subcategories: cat.subcategories.sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      }));
  }, [products]);

  const totalProducts = products.length;

  const handleCategoryClick = (categoryName: string): void => {
    if (selectedCategory === categoryName) {
      // Désélectionner si déjà sélectionné
      onCategorySelect(undefined);
      onSubcategorySelect(undefined);
    } else {
      onCategorySelect(categoryName);
      onSubcategorySelect(undefined);
    }
  };

  const handleSubcategoryClick = (
    categoryName: string,
    subcategoryId: string
  ): void => {
    if (selectedSubcategory === subcategoryId) {
      // Désélectionner la sous-catégorie, garder la catégorie
      onSubcategorySelect(undefined);
    } else {
      onCategorySelect(categoryName);
      onSubcategorySelect(subcategoryId);
    }
  };

  const handleShowAll = (): void => {
    onCategorySelect(undefined);
    onSubcategorySelect(undefined);
  };

  return (
    <div className="space-y-1">
      {/* Bouton "Tous les produits" */}
      <button
        onClick={handleShowAll}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all',
          !selectedCategory && !selectedSubcategory
            ? 'bg-linkme-turquoise/15 text-linkme-marine'
            : 'text-gray-600 hover:bg-gray-50 hover:text-linkme-marine'
        )}
      >
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          <span>Tous les produits</span>
        </div>
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full',
            !selectedCategory && !selectedSubcategory
              ? 'bg-linkme-turquoise/20 text-linkme-marine'
              : 'bg-gray-100 text-gray-500'
          )}
        >
          {totalProducts}
        </span>
      </button>

      {/* Séparateur */}
      <div className="border-t border-gray-100 my-2" />

      {/* Liste des catégories avec accordéon */}
      <div className="space-y-0.5">
        {categories.map(category => {
          const isExpanded = selectedCategory === category.name;
          const hasSubcategories = category.subcategories.length > 0;

          return (
            <div key={category.name}>
              {/* Trigger catégorie */}
              <button
                onClick={() => handleCategoryClick(category.name)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all',
                  isExpanded
                    ? 'bg-linkme-turquoise/10 text-linkme-marine font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-linkme-marine'
                )}
              >
                <div className="flex items-center gap-2">
                  {hasSubcategories && (
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform duration-200',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  )}
                  {!hasSubcategories && <div className="w-4" />}
                  <span className="truncate">{category.name}</span>
                </div>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full flex-shrink-0',
                    isExpanded
                      ? 'bg-linkme-turquoise/20 text-linkme-marine'
                      : 'bg-gray-100 text-gray-500'
                  )}
                >
                  {category.count}
                </span>
              </button>

              {/* Contenu accordéon - Sous-catégories */}
              {isExpanded && hasSubcategories && (
                <div className="ml-6 mt-1 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                  {category.subcategories.map(subcategory => (
                    <button
                      key={subcategory.id}
                      onClick={() =>
                        handleSubcategoryClick(category.name, subcategory.id)
                      }
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-all',
                        selectedSubcategory === subcategory.id
                          ? 'bg-linkme-turquoise text-white font-medium'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-linkme-marine'
                      )}
                    >
                      <span className="truncate">{subcategory.name}</span>
                      <span
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded-full flex-shrink-0',
                          selectedSubcategory === subcategory.id
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-100 text-gray-400'
                        )}
                      >
                        {subcategory.count}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Message si aucune catégorie */}
      {categories.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          Aucune catégorie
        </p>
      )}
    </div>
  );
}
