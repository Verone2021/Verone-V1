import { useCallback, useMemo, useState } from 'react';

import type { CatalogueProduct } from './use-catalogue-products';

export interface CatalogueFiltersState {
  selectedCategories: string[];
  selectedRooms: string[];
  selectedStyles: string[];
  selectedBrands: string[];
  selectedColors: string[];
  priceMin: number | null;
  priceMax: number | null;
}

const INITIAL_STATE: CatalogueFiltersState = {
  selectedCategories: [],
  selectedRooms: [],
  selectedStyles: [],
  selectedBrands: [],
  selectedColors: [],
  priceMin: null,
  priceMax: null,
};

export function useCatalogueFilters() {
  const [filters, setFilters] = useState<CatalogueFiltersState>(INITIAL_STATE);

  const toggleCategory = useCallback((cat: string) => {
    setFilters(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(cat)
        ? prev.selectedCategories.filter(c => c !== cat)
        : [...prev.selectedCategories, cat],
    }));
  }, []);

  const toggleRoom = useCallback((room: string) => {
    setFilters(prev => ({
      ...prev,
      selectedRooms: prev.selectedRooms.includes(room)
        ? prev.selectedRooms.filter(r => r !== room)
        : [...prev.selectedRooms, room],
    }));
  }, []);

  const toggleStyle = useCallback((style: string) => {
    setFilters(prev => ({
      ...prev,
      selectedStyles: prev.selectedStyles.includes(style)
        ? prev.selectedStyles.filter(s => s !== style)
        : [...prev.selectedStyles, style],
    }));
  }, []);

  const toggleBrand = useCallback((brand: string) => {
    setFilters(prev => ({
      ...prev,
      selectedBrands: prev.selectedBrands.includes(brand)
        ? prev.selectedBrands.filter(b => b !== brand)
        : [...prev.selectedBrands, brand],
    }));
  }, []);

  const toggleColor = useCallback((color: string) => {
    setFilters(prev => ({
      ...prev,
      selectedColors: prev.selectedColors.includes(color)
        ? prev.selectedColors.filter(c => c !== color)
        : [...prev.selectedColors, color],
    }));
  }, []);

  const setPriceRange = useCallback(
    (min: number | null, max: number | null) => {
      setFilters(prev => ({ ...prev, priceMin: min, priceMax: max }));
    },
    []
  );

  const clearAll = useCallback(() => {
    setFilters(INITIAL_STATE);
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      filters.selectedCategories.length > 0 ||
      filters.selectedRooms.length > 0 ||
      filters.selectedStyles.length > 0 ||
      filters.selectedBrands.length > 0 ||
      filters.selectedColors.length > 0 ||
      filters.priceMin !== null ||
      filters.priceMax !== null,
    [filters]
  );

  const activeFilterCount = useMemo(
    () =>
      filters.selectedCategories.length +
      filters.selectedRooms.length +
      filters.selectedStyles.length +
      filters.selectedBrands.length +
      filters.selectedColors.length +
      (filters.priceMin !== null || filters.priceMax !== null ? 1 : 0),
    [filters]
  );

  const applyFilters = useCallback(
    (products: CatalogueProduct[]): CatalogueProduct[] => {
      let result = products;

      if (filters.selectedCategories.length > 0) {
        result = result.filter(p =>
          filters.selectedCategories.includes(p.subcategory_name ?? '')
        );
      }

      if (filters.selectedRooms.length > 0) {
        result = result.filter(p =>
          p.suitable_rooms?.some(r => filters.selectedRooms.includes(r))
        );
      }

      if (filters.selectedStyles.length > 0) {
        result = result.filter(p =>
          filters.selectedStyles.includes(p.style ?? '')
        );
      }

      if (filters.selectedBrands.length > 0) {
        result = result.filter(p =>
          filters.selectedBrands.includes(p.brand ?? '')
        );
      }

      if (filters.selectedColors.length > 0) {
        result = result.filter(p => {
          if (!p.color) return false;
          const normalizedColor = p.color.toLowerCase();
          return filters.selectedColors.some(
            c => c.toLowerCase() === normalizedColor
          );
        });
      }

      if (filters.priceMin !== null) {
        result = result.filter(
          p => p.price_ttc !== null && p.price_ttc >= filters.priceMin!
        );
      }

      if (filters.priceMax !== null) {
        result = result.filter(
          p => p.price_ttc !== null && p.price_ttc <= filters.priceMax!
        );
      }

      return result;
    },
    [filters]
  );

  return {
    filters,
    toggleCategory,
    toggleRoom,
    toggleStyle,
    toggleBrand,
    toggleColor,
    setPriceRange,
    clearAll,
    hasActiveFilters,
    activeFilterCount,
    applyFilters,
  };
}
