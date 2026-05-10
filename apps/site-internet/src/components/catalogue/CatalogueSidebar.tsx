'use client';

import { useState } from 'react';

import { ChevronDown, X } from 'lucide-react';

import type { CatalogueProduct } from '@/hooks/use-catalogue-products';
import type { CatalogueFiltersState } from '@/hooks/use-catalogue-filters';
import {
  getRoomLabel,
  getStyleLabel,
  getColorHex,
  getColorLabel,
} from '@/lib/filter-labels';

interface FilterSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-verone-pearl-soft py-5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-dm-sans text-[11px] font-light uppercase tracking-[0.32em] text-verone-charbon">
          {title}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-verone-pearl transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && <div className="mt-4 space-y-3">{children}</div>}
    </div>
  );
}

interface CheckboxItemProps {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}

function CheckboxItem({ label, count, checked, onChange }: CheckboxItemProps) {
  return (
    <label className="group flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded-none border border-verone-charbon bg-transparent text-verone-charbon accent-verone-charbon focus:ring-0 focus:ring-offset-0"
      />
      <span className="flex-1 font-montserrat text-[14px] text-verone-charbon transition-colors duration-[180ms] ease-editorial group-hover:text-verone-or">
        {label}
      </span>
      {count !== undefined && (
        <span className="font-montserrat text-[12px] text-verone-pearl">
          {count}
        </span>
      )}
    </label>
  );
}

interface CatalogueSidebarProps {
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
  className?: string;
}

export function CatalogueSidebar({
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
  className = '',
}: CatalogueSidebarProps) {
  // Extract unique values with counts
  const categories = getValuesWithCounts(products, p => p.subcategory_name);
  const rooms = getArrayValuesWithCounts(products, p => p.suitable_rooms);
  const styles = getValuesWithCounts(products, p => p.style);
  const brands = getValuesWithCounts(products, p => p.manufacturer);
  const colors = getValuesWithCounts(products, p => p.color);

  return (
    <aside className={`w-[240px] shrink-0 ${className}`}>
      {/* Header */}
      <div className="mb-2 flex items-center justify-between border-b border-verone-pearl-soft pb-4">
        <h2 className="font-dm-sans text-[11px] font-light uppercase tracking-[0.32em] text-verone-charbon">
          Filtrer
        </h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="flex items-center gap-1 font-montserrat text-[11px] text-verone-pearl transition-colors duration-[180ms] ease-editorial hover:text-verone-or"
          >
            <X className="h-3 w-3" />
            Tout effacer
          </button>
        )}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <FilterSection title="Catégorie">
          {categories.map(({ value, count }) => (
            <CheckboxItem
              key={value}
              label={value}
              count={count}
              checked={filters.selectedCategories.includes(value)}
              onChange={() => onToggleCategory(value)}
            />
          ))}
        </FilterSection>
      )}

      {/* Rooms */}
      {rooms.length > 0 && (
        <FilterSection title="Pièce">
          {rooms.map(({ value, count }) => (
            <CheckboxItem
              key={value}
              label={getRoomLabel(value)}
              count={count}
              checked={filters.selectedRooms.includes(value)}
              onChange={() => onToggleRoom(value)}
            />
          ))}
        </FilterSection>
      )}

      {/* Style */}
      {styles.length > 0 && (
        <FilterSection title="Style">
          {styles.map(({ value, count }) => (
            <CheckboxItem
              key={value}
              label={getStyleLabel(value)}
              count={count}
              checked={filters.selectedStyles.includes(value)}
              onChange={() => onToggleStyle(value)}
            />
          ))}
        </FilterSection>
      )}

      {/* Colors */}
      {colors.length > 0 && (
        <FilterSection title="Couleur">
          <div className="flex flex-wrap gap-2">
            {colors.map(({ value }) => {
              const hex = getColorHex(value);
              const isSelected = filters.selectedColors.some(
                c => c.toLowerCase() === value.toLowerCase()
              );
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onToggleColor(value)}
                  className={`h-7 w-7 rounded-full border transition-all duration-[180ms] ease-editorial ${
                    isSelected
                      ? 'border-verone-charbon ring-1 ring-verone-charbon ring-offset-1'
                      : 'border-verone-pearl-soft hover:border-verone-pearl'
                  }`}
                  style={{ backgroundColor: hex }}
                  title={getColorLabel(value)}
                  aria-label={getColorLabel(value)}
                />
              );
            })}
          </div>
        </FilterSection>
      )}

      {/* Price */}
      <FilterSection title="Prix">
        <div className="flex items-center gap-3">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin ?? ''}
            onChange={e => {
              const val = e.target.value ? Number(e.target.value) : null;
              onSetPriceRange(val, filters.priceMax);
            }}
            className="w-full border-0 border-b border-verone-charbon bg-transparent px-0 py-2 font-montserrat text-[14px] tabular-nums text-verone-charbon placeholder:text-verone-pearl focus:border-verone-or focus:outline-none focus:ring-0"
          />
          <span className="font-montserrat text-verone-pearl">—</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax ?? ''}
            onChange={e => {
              const val = e.target.value ? Number(e.target.value) : null;
              onSetPriceRange(filters.priceMin, val);
            }}
            className="w-full border-0 border-b border-verone-charbon bg-transparent px-0 py-2 font-montserrat text-[14px] tabular-nums text-verone-charbon placeholder:text-verone-pearl focus:border-verone-or focus:outline-none focus:ring-0"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { label: '< 100 €', min: null, max: 100 },
            { label: '100 – 300 €', min: 100, max: 300 },
            { label: '300 – 500 €', min: 300, max: 500 },
            { label: '> 500 €', min: 500, max: null },
          ].map(preset => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onSetPriceRange(preset.min, preset.max)}
              className={`border px-3 py-1 font-montserrat text-[11px] transition-colors duration-[180ms] ease-editorial ${
                filters.priceMin === preset.min &&
                filters.priceMax === preset.max
                  ? 'border-verone-charbon bg-verone-charbon text-verone-white'
                  : 'border-verone-pearl-soft text-verone-pearl hover:border-verone-charbon hover:text-verone-charbon'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Brands */}
      {brands.length > 0 && (
        <FilterSection title="Fabricant" defaultOpen={false}>
          {brands.map(({ value, count }) => (
            <CheckboxItem
              key={value}
              label={value}
              count={count}
              checked={filters.selectedBrands.includes(value)}
              onChange={() => onToggleBrand(value)}
            />
          ))}
        </FilterSection>
      )}
    </aside>
  );
}

// Helper: extract unique values with count from a single field
function getValuesWithCounts(
  products: CatalogueProduct[],
  accessor: (p: CatalogueProduct) => string | null
): { value: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of products) {
    const val = accessor(p);
    if (val) {
      map.set(val, (map.get(val) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value));
}

// Helper: extract unique values with count from an array field
function getArrayValuesWithCounts(
  products: CatalogueProduct[],
  accessor: (p: CatalogueProduct) => string[] | null
): { value: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of products) {
    const arr = accessor(p);
    if (arr) {
      for (const val of arr) {
        map.set(val, (map.get(val) ?? 0) + 1);
      }
    }
  }
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value));
}
