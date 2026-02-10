'use client';

/**
 * TopFiltersBar - Barre de filtres rapides en haut de la page statistiques produits
 *
 * Contient :
 * - Recherche texte (debounced)
 * - Tabs source produit (Tous | Catalogue | Mes produits | Sur-mesure)
 * - Sélecteur année (depuis 2023)
 * - Bouton Reset
 *
 * @module TopFiltersBar
 * @since 2026-02-10
 * @updated 2026-02-10 - Purge commissions, années depuis 2023
 */

import { useState, useEffect, useMemo } from 'react';

import { Search, X, Calendar } from 'lucide-react';

import type {
  ProductStatsFilters,
  ProductSourceFilter,
} from '@/lib/hooks/use-all-products-stats';
import { cn } from '@/lib/utils';

// ============================================
// CONSTANTS
// ============================================

const PRODUCT_SOURCE_TABS: { value: ProductSourceFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'catalogue', label: 'Catalogue' },
  { value: 'mes-produits', label: 'Mes produits' },
  { value: 'sur-mesure', label: 'Sur-mesure' },
];

// Generate available years (from current year down to 2023 - first orders)
function getAvailableYears(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 2023; y--) {
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
}

// ============================================
// COMPONENT
// ============================================

export function TopFiltersBar({
  filters,
  onChange,
  search,
  onSearchChange,
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

  const handleSourceChange = (source: ProductSourceFilter): void => {
    onChange({ ...filters, productSource: source });
  };

  const handleYearSelect = (year: number | undefined): void => {
    onChange({ ...filters, year });
    setShowYearDropdown(false);
  };

  const handleResetAll = (): void => {
    onChange({ productSource: 'all' });
    setSearchInput('');
    onSearchChange('');
  };

  // Active filters count (excluding productSource='all')
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.year) count++;
    if (filters.productSource && filters.productSource !== 'all') count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Year */}
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
      </div>

      {/* Row 2: Product source tabs */}
      <div className="flex items-center gap-1">
        {PRODUCT_SOURCE_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => handleSourceChange(tab.value)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              (filters.productSource ?? 'all') === tab.value
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
