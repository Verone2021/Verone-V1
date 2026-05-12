'use client';

import { useState } from 'react';

import { ChevronDown, X } from 'lucide-react';

import type { CatalogueProduct } from '@/hooks/use-catalogue-products';
import type { CatalogueFiltersState } from '@/hooks/use-catalogue-filters';
import { useColorOptions, type ColorOption } from '@/hooks/use-color-options';
import { useRoomOptions, type RoomOption } from '@/hooks/use-room-options';
import { useStyleOptions, type StyleOption } from '@/hooks/use-style-options';
import { expandColorValue, canonicalColorKey } from '@/lib/filter-labels';

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
    <div className="border-b border-verone-gray-200 py-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-xs font-semibold text-verone-black uppercase tracking-wide">
          {title}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-verone-gray-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
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
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded-none border-verone-gray-300 text-verone-black focus:ring-verone-black"
      />
      <span className="text-sm text-verone-gray-700 group-hover:text-verone-black transition-colors flex-1">
        {label}
      </span>
      {count !== undefined && (
        <span className="text-xs text-verone-gray-400">{count}</span>
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
  // Vocabulaire contrôlé depuis tables de référence (Niveau 3 SITE-CAT-002)
  const { data: colorOptions = [] } = useColorOptions();
  const { data: roomOptions = [] } = useRoomOptions();
  const { data: styleOptions = [] } = useStyleOptions();

  // Catégories et fabricants : pas de table de référence (FK ou texte libre éditorial)
  const categories = getValuesWithCounts(products, p => p.subcategory_name);
  const brands = getValuesWithCounts(products, p => p.manufacturer);

  // Intersection : tables de référence actives ∩ valeurs présentes dans products
  const rooms = intersectArrayField(
    roomOptions,
    products,
    p => p.suitable_rooms
  );
  const styles = intersectScalarField(styleOptions, products, p => p.style);
  const colors = intersectColors(colorOptions, products);

  return (
    <aside className={`w-[280px] shrink-0 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-verone-black uppercase tracking-wide">
          Filtres
        </h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="flex items-center gap-1 text-xs text-verone-gray-500 hover:text-verone-black transition-colors"
          >
            <X className="h-3 w-3" />
            Tout effacer
          </button>
        )}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <FilterSection title="Catégories">
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
        <FilterSection title="Pièces">
          {rooms.map(({ value, label, count }) => (
            <CheckboxItem
              key={value}
              label={label}
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
          {styles.map(({ value, label, count }) => (
            <CheckboxItem
              key={value}
              label={label}
              count={count}
              checked={filters.selectedStyles.includes(value)}
              onChange={() => onToggleStyle(value)}
            />
          ))}
        </FilterSection>
      )}

      {/* Colors */}
      {colors.length > 0 && (
        <FilterSection title="Couleurs">
          <div className="flex flex-wrap gap-2">
            {colors.map(({ name, hexCode }) => {
              const isSelected = filters.selectedColors.some(
                c => c.toLowerCase() === name.toLowerCase()
              );
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onToggleColor(name)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    isSelected
                      ? 'border-verone-black scale-110 ring-1 ring-verone-black ring-offset-1'
                      : 'border-verone-gray-300 hover:border-verone-gray-500'
                  }`}
                  style={{ backgroundColor: hexCode }}
                  title={name}
                  aria-label={name}
                />
              );
            })}
          </div>
        </FilterSection>
      )}

      {/* Price */}
      <FilterSection title="Prix">
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin ?? ''}
            onChange={e => {
              const val = e.target.value ? Number(e.target.value) : null;
              onSetPriceRange(val, filters.priceMax);
            }}
            className="w-full border border-verone-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-verone-black"
          />
          <span className="text-verone-gray-400 text-xs">—</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax ?? ''}
            onChange={e => {
              const val = e.target.value ? Number(e.target.value) : null;
              onSetPriceRange(filters.priceMin, val);
            }}
            className="w-full border border-verone-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-verone-black"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {[
            { label: '< 100 €', min: null, max: 100 },
            { label: '100 - 300 €', min: 100, max: 300 },
            { label: '300 - 500 €', min: 300, max: 500 },
            { label: '> 500 €', min: 500, max: null },
          ].map(preset => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onSetPriceRange(preset.min, preset.max)}
              className={`px-2.5 py-1 text-xs border transition-colors ${
                filters.priceMin === preset.min &&
                filters.priceMax === preset.max
                  ? 'border-verone-black bg-verone-black text-verone-white'
                  : 'border-verone-gray-300 text-verone-gray-600 hover:border-verone-black'
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

/**
 * Intersection : table de référence (snake_case value + label) ∩ valeurs
 * présentes dans un champ array de products (ex: suitable_rooms).
 * Garde l'ordre de sort_order de la table de référence, filtre out les
 * options non présentes dans le catalogue affiché.
 */
function intersectArrayField(
  options: RoomOption[],
  products: CatalogueProduct[],
  accessor: (p: CatalogueProduct) => string[] | null
): { value: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    const arr = accessor(p);
    if (arr) {
      for (const v of arr) {
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
    }
  }
  return options
    .map(o => ({
      value: o.value,
      label: o.label,
      count: counts.get(o.value) ?? 0,
    }))
    .filter(o => o.count > 0);
}

/**
 * Idem mais pour un champ scalaire (style: string).
 */
function intersectScalarField(
  options: StyleOption[],
  products: CatalogueProduct[],
  accessor: (p: CatalogueProduct) => string | null
): { value: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    const v = accessor(p);
    if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return options
    .map(o => ({
      value: o.value,
      label: o.label,
      count: counts.get(o.value) ?? 0,
    }))
    .filter(o => o.count > 0);
}

/**
 * Couleurs : intersection entre color_options actives et les couleurs
 * effectivement utilisées par les produits affichés. Splitte les valeurs
 * composées ("Beige,Blanc" → Beige + Blanc) et compare en lowercase.
 */
function intersectColors(
  options: ColorOption[],
  products: CatalogueProduct[]
): { name: string; hexCode: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    if (!p.color) continue;
    for (const piece of expandColorValue(p.color)) {
      const key = canonicalColorKey(piece);
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return options
    .map(o => ({
      name: o.name,
      hexCode: o.hex_code,
      count: counts.get(canonicalColorKey(o.name)) ?? 0,
    }))
    .filter(o => o.count > 0);
}
