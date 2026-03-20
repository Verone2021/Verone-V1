'use client';

import { Search, X } from 'lucide-react';

export type StockFilter = 'all' | 'in_stock' | 'out_of_stock';
export const ALL_CATEGORIES = '__all__';

interface ProductFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  stockFilter: StockFilter;
  onStockFilterChange: (filter: StockFilter) => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  totalItems: number;
  inStockCount: number;
  outOfStockCount: number;
  categories: { name: string; count: number }[];
}

export function ProductFilters({
  searchQuery,
  onSearchChange,
  stockFilter,
  onStockFilterChange,
  activeCategory,
  onCategoryChange,
  totalItems,
  inStockCount,
  outOfStockCount,
  categories,
}: ProductFiltersProps): React.JSX.Element {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 space-y-3">
      {/* Row 1: Recherche + Filtres stock */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Barre de recherche */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-linkme-marine/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full pl-10 pr-10 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-linkme-turquoise/30 focus:border-linkme-turquoise transition-all duration-200 bg-gray-50"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-linkme-marine/40 hover:text-linkme-marine transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="h-6 w-px bg-gray-200" />

        {/* Filtres stock */}
        <button
          onClick={() => onStockFilterChange('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            stockFilter === 'all'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tout ({totalItems})
        </button>
        <button
          onClick={() => onStockFilterChange('in_stock')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            stockFilter === 'in_stock'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          En stock ({inStockCount})
        </button>
        {outOfStockCount > 0 && (
          <button
            onClick={() => onStockFilterChange('out_of_stock')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              stockFilter === 'out_of_stock'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Rupture ({outOfStockCount})
          </button>
        )}
      </div>

      {/* Row 2: Filtres catégorie */}
      {categories.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => onCategoryChange(ALL_CATEGORIES)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeCategory === ALL_CATEGORIES
                ? 'bg-linkme-turquoise text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Toutes ({totalItems})
          </button>
          {categories.map(cat => (
            <button
              key={cat.name}
              onClick={() => onCategoryChange(cat.name)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeCategory === cat.name
                  ? 'bg-linkme-turquoise text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
