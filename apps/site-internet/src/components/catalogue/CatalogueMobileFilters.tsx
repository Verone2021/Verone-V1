'use client';

import { X } from 'lucide-react';

import type { CatalogueProduct } from '@/hooks/use-catalogue-products';
import type { CatalogueFiltersState } from '@/hooks/use-catalogue-filters';
import { CatalogueSidebar } from './CatalogueSidebar';

interface CatalogueMobileFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  products: CatalogueProduct[];
  filters: CatalogueFiltersState;
  onToggleCategory: (cat: string) => void;
  onToggleRoom: (room: string) => void;
  onToggleStyle: (style: string) => void;
  onToggleBrand: (brand: string) => void;
  onToggleColor: (color: string) => void;
  onSetPriceRange: (min: number | null, max: number | null) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  resultCount: number;
}

export function CatalogueMobileFilters({
  isOpen,
  onClose,
  products,
  filters,
  onToggleCategory,
  onToggleRoom,
  onToggleStyle,
  onToggleBrand,
  onToggleColor,
  onSetPriceRange,
  onClearAll,
  hasActiveFilters,
  resultCount,
}: CatalogueMobileFiltersProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        aria-label="Fermer les filtres"
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 left-0 w-[320px] max-w-[85vw] bg-verone-white shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-verone-gray-200">
          <h2 className="text-sm font-semibold text-verone-black uppercase tracking-wide">
            Filtres
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-verone-gray-500 hover:text-verone-black transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar content */}
        <div className="p-4">
          <CatalogueSidebar
            products={products}
            filters={filters}
            onToggleCategory={onToggleCategory}
            onToggleRoom={onToggleRoom}
            onToggleStyle={onToggleStyle}
            onToggleBrand={onToggleBrand}
            onToggleColor={onToggleColor}
            onSetPriceRange={onSetPriceRange}
            onClearAll={onClearAll}
            hasActiveFilters={hasActiveFilters}
            className="w-full"
          />
        </div>

        {/* Footer: results button */}
        <div className="sticky bottom-0 p-4 bg-verone-white border-t border-verone-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-verone-black text-verone-white text-sm font-medium uppercase tracking-wide hover:bg-verone-gray-800 transition-colors"
          >
            Voir {resultCount} résultat{resultCount > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
