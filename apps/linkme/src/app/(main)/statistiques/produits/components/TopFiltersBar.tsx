'use client';

/**
 * TopFiltersBar - Barre de filtres rapides en haut de la page statistiques produits
 *
 * Contient :
 * - Recherche texte (debounced)
 * - Tabs type produit (Tous | Catalogue | Revendeur | Sur-mesure)
 * - Sélecteur année
 * - Badge filtres actifs + bouton Reset
 * - Bouton filtres avancés (sidebar)
 *
 * @module TopFiltersBar
 * @since 2026-02-10
 */

import { useState, useEffect, useMemo } from 'react';

import { Search, SlidersHorizontal, X, Calendar } from 'lucide-react';

import type {
  ProductStatsFilters,
  ProductTypeFilter,
} from '@/lib/hooks/use-all-products-stats';
import { cn } from '@/lib/utils';

// ============================================
// CONSTANTS
// ============================================

const PRODUCT_TYPE_TABS: { value: ProductTypeFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'catalogue', label: 'Catalogue' },
  { value: 'revendeur', label: 'Revendeur' },
  { value: 'custom', label: 'Sur-mesure' },
];

// Generate available years (from 2024 to current year)
function getAvailableYears(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 2024; y--) {
    years.push(y);
  }
  return years;
}

// ============================================
// TYPES
// ============================================

interface TopFiltersBarProps {
  filters: ProductStatsFilters;
  onChange: (filters: ProductStatsFilters) => void;
  search: string;
  onSearchChange: (search: string) => void;
  onOpenSidebar: () => void;
  activeFiltersCount: number;
}

// ============================================
// COMPONENT
// ============================================

export function TopFiltersBar({
  filters,
  onChange,
  search,
  onSearchChange,
  onOpenSidebar,
  activeFiltersCount,
}: TopFiltersBarProps): JSX.Element {
  const [searchInput, setSearchInput] = useState(search);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const availableYears = useMemo(() => getAvailableYears(), []);

  // Debounced search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange]);

  // Sync external search changes
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const handleTypeChange = (type: ProductTypeFilter): void => {
    onChange({ ...filters, productType: type });
  };

  const handleYearSelect = (year: number | undefined): void => {
    onChange({ ...filters, year });
    setShowYearDropdown(false);
  };

  const handleResetAll = (): void => {
    onChange({ productType: 'all' });
    setSearchInput('');
    onSearchChange('');
  };

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Year + Filters button */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou SKU..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="pl-10 pr-8 py-2 w-full border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#5DBEBB] focus:border-transparent"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('');
                onSearchChange('');
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-3.5 w-3.5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Year selector */}
        <div className="relative">
          <button
            onClick={() => setShowYearDropdown(!showYearDropdown)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors',
              filters.year
                ? 'border-linkme-turquoise/50 bg-linkme-turquoise/5 text-linkme-marine'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            )}
          >
            <Calendar className="h-4 w-4" />
            {filters.year ? `Année ${filters.year}` : 'Toutes les années'}
            {filters.year && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleYearSelect(undefined);
                }}
                className="ml-1 p-0.5 hover:bg-gray-200 rounded"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </button>

          {/* Year dropdown */}
          {showYearDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowYearDropdown(false)}
              />
              <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[160px]">
                <button
                  onClick={() => handleYearSelect(undefined)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors',
                    !filters.year &&
                      'bg-linkme-turquoise/10 text-linkme-marine font-medium'
                  )}
                >
                  Toutes les années
                </button>
                {availableYears.map(year => (
                  <button
                    key={year}
                    onClick={() => handleYearSelect(year)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors',
                      filters.year === year &&
                        'bg-linkme-turquoise/10 text-linkme-marine font-medium'
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Filters sidebar button */}
        <button
          onClick={onOpenSidebar}
          className={cn(
            'flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors',
            activeFiltersCount > 0
              ? 'border-linkme-turquoise/50 bg-linkme-turquoise/5 text-linkme-marine'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtres
          {activeFiltersCount > 0 && (
            <span className="bg-linkme-turquoise text-white text-xs px-1.5 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Row 2: Product type tabs */}
      <div className="flex items-center gap-1">
        {PRODUCT_TYPE_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => handleTypeChange(tab.value)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              (filters.productType ?? 'all') === tab.value
                ? 'bg-[#183559] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {tab.label}
          </button>
        ))}

        {/* Active filters badges + reset */}
        {(activeFiltersCount > 0 || search) && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {activeFiltersCount + (search ? 1 : 0)} filtre
              {activeFiltersCount + (search ? 1 : 0) > 1 ? 's' : ''} actif
              {activeFiltersCount + (search ? 1 : 0) > 1 ? 's' : ''}
            </span>
            <button
              onClick={handleResetAll}
              className="text-xs text-gray-500 hover:text-linkme-turquoise transition-colors underline"
            >
              Tout effacer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
