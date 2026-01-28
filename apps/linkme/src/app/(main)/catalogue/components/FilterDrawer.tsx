'use client';

/**
 * FilterDrawer - Tiroir de filtres avancés
 * Filtre par type de produit, sous-catégorie et pièces compatibles
 */

import { useMemo } from 'react';

import { X, Package, Sparkles, FolderTree, Home } from 'lucide-react';

import type { LinkMeCatalogProduct } from '@/lib/hooks/use-linkme-catalog';
import { cn } from '@/lib/utils';

export type ProductTypeFilter = 'all' | 'catalog' | 'custom';

// Options de pièces disponibles (alignées avec suitable_rooms enum)
const ROOM_OPTIONS = [
  { value: 'salon', label: 'Salon' },
  { value: 'salle_a_manger', label: 'Salle à manger' },
  { value: 'chambre', label: 'Chambre' },
  { value: 'bureau', label: 'Bureau' },
  { value: 'cuisine', label: 'Cuisine' },
  { value: 'salle_de_bain', label: 'Salle de bain' },
  { value: 'hall_entree', label: 'Entrée' },
  { value: 'terrasse', label: 'Terrasse' },
  { value: 'jardin', label: 'Jardin' },
] as const;

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: LinkMeCatalogProduct[];
  // Filtre type de produit
  productTypeFilter: ProductTypeFilter;
  onProductTypeChange: (type: ProductTypeFilter) => void;
  // Filtre sous-catégorie
  selectedSubcategory: string | undefined;
  onSubcategoryChange: (subcategory: string | undefined) => void;
  // Filtre catégorie (pour afficher les sous-catégories correspondantes)
  selectedCategory: string | undefined;
  // Filtre pièces (multi-sélection)
  selectedRooms: string[];
  onRoomsChange: (rooms: string[]) => void;
}

export function FilterDrawer({
  isOpen,
  onClose,
  products,
  productTypeFilter,
  onProductTypeChange,
  selectedSubcategory,
  onSubcategoryChange,
  selectedCategory,
  selectedRooms,
  onRoomsChange,
}: FilterDrawerProps): JSX.Element | null {
  // Extraire les sous-catégories uniques (filtrées par catégorie si sélectionnée)
  const subcategories = useMemo(() => {
    const subcategoryMap = new Map<string, number>();

    products.forEach(product => {
      // Si une catégorie est sélectionnée, ne montrer que ses sous-catégories
      if (selectedCategory && product.category_name !== selectedCategory) {
        return;
      }

      if (product.subcategory_name) {
        const count = subcategoryMap.get(product.subcategory_name) ?? 0;
        subcategoryMap.set(product.subcategory_name, count + 1);
      }
    });

    return Array.from(subcategoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, selectedCategory]);

  // Compter les produits par type
  const productTypeCounts = useMemo(() => {
    let catalogCount = 0;
    let customCount = 0;

    products.forEach(product => {
      // Appliquer le filtre catégorie si présent
      if (selectedCategory && product.category_name !== selectedCategory) {
        return;
      }

      if (product.is_custom) {
        customCount++;
      } else {
        catalogCount++;
      }
    });

    return {
      all: catalogCount + customCount,
      catalog: catalogCount,
      custom: customCount,
    };
  }, [products, selectedCategory]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-linkme-marine">Filtres</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Type de produit */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Type de produit
            </h3>
            <div className="space-y-2">
              <FilterOption
                label="Tous les produits"
                count={productTypeCounts.all}
                isSelected={productTypeFilter === 'all'}
                onClick={() => onProductTypeChange('all')}
              />
              <FilterOption
                label="Catalogue Verone"
                count={productTypeCounts.catalog}
                isSelected={productTypeFilter === 'catalog'}
                onClick={() => onProductTypeChange('catalog')}
                icon={<Package className="h-3.5 w-3.5" />}
              />
              <FilterOption
                label="Sur mesure"
                count={productTypeCounts.custom}
                isSelected={productTypeFilter === 'custom'}
                onClick={() => onProductTypeChange('custom')}
                icon={<Sparkles className="h-3.5 w-3.5" />}
                gradient
              />
            </div>
          </div>

          {/* Sous-catégories (si catégorie sélectionnée) */}
          {subcategories.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <FolderTree className="h-4 w-4" />
                Sous-catégorie
                {selectedCategory && (
                  <span className="text-xs text-gray-400">
                    ({selectedCategory})
                  </span>
                )}
              </h3>
              <div className="space-y-2">
                <FilterOption
                  label="Toutes"
                  count={subcategories.reduce((acc, s) => acc + s.count, 0)}
                  isSelected={!selectedSubcategory}
                  onClick={() => onSubcategoryChange(undefined)}
                />
                {subcategories.map(subcategory => (
                  <FilterOption
                    key={subcategory.name}
                    label={subcategory.name}
                    count={subcategory.count}
                    isSelected={selectedSubcategory === subcategory.name}
                    onClick={() => onSubcategoryChange(subcategory.name)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Message si pas de sous-catégories */}
          {subcategories.length === 0 && selectedCategory && (
            <div className="text-center py-4 text-gray-400 text-sm">
              Aucune sous-catégorie disponible
            </div>
          )}

          {/* Filtre par pièces (multi-sélection) */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Home className="h-4 w-4" />
              Pièces compatibles
              {selectedRooms.length > 0 && (
                <span className="text-xs bg-linkme-turquoise text-white px-1.5 py-0.5 rounded-full">
                  {selectedRooms.length}
                </span>
              )}
            </h3>
            <div className="space-y-2">
              {ROOM_OPTIONS.map(room => {
                const isChecked = selectedRooms.includes(room.value);
                return (
                  <label
                    key={room.value}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all',
                      isChecked
                        ? 'bg-linkme-turquoise/10 border border-linkme-turquoise/30'
                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={e => {
                        if (e.target.checked) {
                          onRoomsChange([...selectedRooms, room.value]);
                        } else {
                          onRoomsChange(
                            selectedRooms.filter(r => r !== room.value)
                          );
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-linkme-turquoise focus:ring-linkme-turquoise"
                    />
                    <span
                      className={cn(
                        'text-sm',
                        isChecked
                          ? 'text-linkme-marine font-medium'
                          : 'text-gray-600'
                      )}
                    >
                      {room.label}
                    </span>
                  </label>
                );
              })}
            </div>
            {selectedRooms.length > 0 && (
              <button
                onClick={() => onRoomsChange([])}
                className="mt-2 text-xs text-gray-500 hover:text-linkme-turquoise transition-colors"
              >
                Effacer la sélection
              </button>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-linkme-turquoise text-white rounded-lg font-medium hover:bg-linkme-turquoise/90 transition-colors"
          >
            Appliquer
          </button>
        </div>
      </div>
    </>
  );
}

interface FilterOptionProps {
  label: string;
  count: number;
  isSelected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  gradient?: boolean;
}

function FilterOption({
  label,
  count,
  isSelected,
  onClick,
  icon,
  gradient = false,
}: FilterOptionProps): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all',
        isSelected
          ? gradient
            ? 'bg-gradient-to-r from-[#7E84C0]/10 to-[#5DBEBB]/10 border border-linkme-turquoise/30 text-linkme-marine'
            : 'bg-linkme-turquoise/10 border border-linkme-turquoise/30 text-linkme-marine'
          : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-transparent'
      )}
    >
      <div className="flex items-center gap-2">
        {icon && (
          <span
            className={cn(
              isSelected
                ? gradient
                  ? 'text-linkme-mauve'
                  : 'text-linkme-turquoise'
                : 'text-gray-400'
            )}
          >
            {icon}
          </span>
        )}
        <span className={cn(isSelected && 'font-medium')}>{label}</span>
      </div>
      <span
        className={cn(
          'text-xs px-2 py-0.5 rounded-full',
          isSelected
            ? 'bg-white text-linkme-turquoise'
            : 'bg-gray-200 text-gray-500'
        )}
      >
        {count}
      </span>
    </button>
  );
}
