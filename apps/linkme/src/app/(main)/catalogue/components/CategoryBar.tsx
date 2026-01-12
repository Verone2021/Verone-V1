'use client';

/**
 * CategoryBar - Barre de catégories horizontale
 * Remplace les onglets CatalogTabs
 * Affiche les vraies catégories des produits + bouton Filtrer
 */

import { useMemo } from 'react';

import { Filter, X } from 'lucide-react';

import type { LinkMeCatalogProduct } from '@/lib/hooks/use-linkme-catalog';
import { cn } from '@/lib/utils';

interface CategoryBarProps {
  products: LinkMeCatalogProduct[];
  selectedCategory: string | undefined;
  onCategorySelect: (category: string | undefined) => void;
  onOpenFilters: () => void;
  activeFiltersCount?: number;
}

export function CategoryBar({
  products,
  selectedCategory,
  onCategorySelect,
  onOpenFilters,
  activeFiltersCount = 0,
}: CategoryBarProps): JSX.Element {
  // Extraire les catégories uniques des produits avec leur compte
  const categories = useMemo(() => {
    const categoryMap = new Map<string, number>();

    products.forEach(product => {
      if (product.category_name) {
        const count = categoryMap.get(product.category_name) || 0;
        categoryMap.set(product.category_name, count + 1);
      }
    });

    // Convertir en tableau et trier alphabétiquement
    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const totalCount = products.length;

  return (
    <div className="flex items-center gap-3 bg-white border-b border-gray-100 px-4 lg:px-6 py-3">
      {/* Catégories scrollables */}
      <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {/* Bouton "Tous" */}
        <button
          onClick={() => onCategorySelect(undefined)}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200',
            !selectedCategory
              ? 'bg-linkme-turquoise text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          Tous
          <span
            className={cn(
              'text-xs px-1.5 py-0.5 rounded-full',
              !selectedCategory
                ? 'bg-white/20 text-white'
                : 'bg-white text-gray-500'
            )}
          >
            {totalCount}
          </span>
        </button>

        {/* Catégories dynamiques */}
        {categories.map(category => (
          <button
            key={category.name}
            onClick={() => onCategorySelect(category.name)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200',
              selectedCategory === category.name
                ? 'bg-linkme-turquoise text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {category.name}
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                selectedCategory === category.name
                  ? 'bg-white/20 text-white'
                  : 'bg-white text-gray-500'
              )}
            >
              {category.count}
            </span>
          </button>
        ))}
      </div>

      {/* Bouton Filtrer (à droite) */}
      <button
        onClick={onOpenFilters}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-shrink-0 border',
          activeFiltersCount > 0
            ? 'bg-linkme-turquoise/10 text-linkme-turquoise border-linkme-turquoise/30'
            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        )}
      >
        <Filter className="h-4 w-4" />
        <span className="hidden sm:inline">Filtrer</span>
        {activeFiltersCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 bg-linkme-turquoise text-white text-xs font-bold rounded-full">
            {activeFiltersCount}
          </span>
        )}
      </button>
    </div>
  );
}

/**
 * ActiveFilters - Affiche les filtres actifs avec possibilité de les supprimer
 */
interface ActiveFiltersProps {
  selectedCategory: string | undefined;
  selectedSubcategory: string | undefined;
  productTypeFilter: 'all' | 'catalog' | 'custom';
  onClearCategory: () => void;
  onClearSubcategory: () => void;
  onClearProductType: () => void;
  onClearAll: () => void;
}

export function ActiveFilters({
  selectedCategory,
  selectedSubcategory,
  productTypeFilter,
  onClearCategory,
  onClearSubcategory,
  onClearProductType,
  onClearAll,
}: ActiveFiltersProps): JSX.Element | null {
  const hasFilters =
    selectedCategory || selectedSubcategory || productTypeFilter !== 'all';

  if (!hasFilters) return null;

  return (
    <div className="flex items-center gap-2 px-4 lg:px-6 py-2 bg-gray-50/50 border-b border-gray-100">
      <span className="text-xs text-gray-500">Filtres actifs:</span>

      {selectedCategory && (
        <span className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
          {selectedCategory}
          <button
            onClick={onClearCategory}
            className="hover:text-red-500 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      {selectedSubcategory && (
        <span className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
          Sous-catégorie
          <button
            onClick={onClearSubcategory}
            className="hover:text-red-500 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      {productTypeFilter !== 'all' && (
        <span className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
          {productTypeFilter === 'catalog' ? 'Catalogue' : 'Sur mesure'}
          <button
            onClick={onClearProductType}
            className="hover:text-red-500 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      <button
        onClick={onClearAll}
        className="text-xs text-gray-500 hover:text-linkme-turquoise underline ml-2"
      >
        Tout effacer
      </button>
    </div>
  );
}
