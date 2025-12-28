'use client';

import { Search, X, Filter, ChevronDown } from 'lucide-react';

import type { AffiliateCustomer } from '@/lib/hooks/use-affiliate-orders';

export type NetworkFilterType = 'all' | 'propre' | 'franchise';

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterType: NetworkFilterType;
  onFilterTypeChange: (value: NetworkFilterType) => void;
  cities: string[];
  selectedCity: string;
  onCityChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  cities,
  selectedCity,
  onCityChange,
  onClearFilters,
  hasActiveFilters,
}: SearchFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white rounded-lg border">
      {/* Recherche */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une organisation..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filtre par type */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Filter className="h-4 w-4 text-gray-400" />
        </div>
        <select
          value={filterType}
          onChange={e =>
            onFilterTypeChange(e.target.value as NetworkFilterType)
          }
          className="w-full sm:w-[160px] pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
        >
          <option value="all">Tous</option>
          <option value="propre">Propres</option>
          <option value="franchise">Franchises</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Filtre par ville */}
      <div className="relative">
        <select
          value={selectedCity}
          onChange={e => onCityChange(e.target.value)}
          className="w-full sm:w-[180px] pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
        >
          <option value="all">Toutes les villes</option>
          {cities.map(city => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Bouton reset */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
          Réinitialiser
        </button>
      )}
    </div>
  );
}

/**
 * Helper pour extraire les villes uniques des organisations
 */
export function extractUniqueCities(
  organisations: AffiliateCustomer[]
): string[] {
  const cities = new Set<string>();
  for (const org of organisations) {
    if (org.city) {
      cities.add(org.city);
    }
  }
  return Array.from(cities).sort();
}

/**
 * Helper pour filtrer les organisations
 */
export function filterOrganisations(
  organisations: AffiliateCustomer[],
  searchQuery: string,
  filterType: NetworkFilterType,
  selectedCity: string
): AffiliateCustomer[] {
  return organisations.filter(org => {
    // Filtre recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = org.name.toLowerCase().includes(query);
      const matchesCity = org.city?.toLowerCase().includes(query);
      const matchesEmail = org.email?.toLowerCase().includes(query);
      if (!matchesName && !matchesCity && !matchesEmail) {
        return false;
      }
    }

    // Filtre type
    if (filterType === 'propre' && org.is_franchisee) {
      return false;
    }
    if (filterType === 'franchise' && !org.is_franchisee) {
      return false;
    }

    // Filtre ville
    if (selectedCity !== 'all' && org.city !== selectedCity) {
      return false;
    }

    return true;
  });
}
