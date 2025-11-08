/**
 * Composant: SupplierCategorySelect
 * Multi-select pour choisir les catégories de produits vendus par un fournisseur
 *
 * Support:
 * - Multi-sélection (comma-separated storage)
 * - Recherche/filtrage
 * - Icons par catégorie
 * - Gestion state comma-separated string
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';

import type { LucideIcon } from 'lucide-react';
import { Check, ChevronDown, X } from 'lucide-react';
import {
  Sofa,
  TreeDeciduous,
  Lamp,
  Shirt,
  Sparkles,
  Paintbrush,
  Frame,
  Grid2X2,
  Wallpaper,
  UtensilsCrossed,
  Wrench,
  Package,
  Package2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ButtonV2 } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@verone/utils';
import type { SupplierCategoryCode } from '@/shared/modules/categories/components/badges/SupplierCategoryBadge';
import { getCategoryLabel } from '@/shared/modules/categories/components/badges/SupplierCategoryBadge';

interface SupplierCategorySelectProps {
  /** Valeur actuelle: array de codes OU string comma-separated */
  value: SupplierCategoryCode[] | string | null | undefined;
  /** Callback onChange avec array de codes */
  onChange: (categories: SupplierCategoryCode[]) => void;
  disabled?: boolean;
  showLabel?: boolean;
  placeholder?: string;
  maxDisplay?: number;
  className?: string;
}

// Configuration catégories (synchronisée avec supplier-category-badge.tsx)
const CATEGORY_OPTIONS: Array<{
  code: SupplierCategoryCode;
  label: string;
  icon: LucideIcon;
  description: string;
}> = [
  {
    code: 'furniture_indoor',
    label: 'Mobilier intérieur',
    icon: Sofa,
    description: 'Chaises, tables, canapés, armoires',
  },
  {
    code: 'furniture_outdoor',
    label: 'Mobilier extérieur',
    icon: TreeDeciduous,
    description: 'Salons de jardin, transats',
  },
  {
    code: 'lighting',
    label: 'Luminaires & Éclairage',
    icon: Lamp,
    description: 'Lampes, suspensions, lustres',
  },
  {
    code: 'textiles_fabrics',
    label: 'Textiles & Tissus',
    icon: Shirt,
    description: 'Tissus ameublement, rideaux, coussins',
  },
  {
    code: 'decorative_objects',
    label: 'Objets décoratifs',
    icon: Sparkles,
    description: 'Vases, sculptures, figurines',
  },
  {
    code: 'art_sculptures',
    label: 'Art & Sculptures',
    icon: Paintbrush,
    description: "Œuvres d'art, sculptures design",
  },
  {
    code: 'mirrors_frames',
    label: 'Miroirs & Cadres',
    icon: Frame,
    description: 'Miroirs décoratifs, cadres',
  },
  {
    code: 'rugs_carpets',
    label: 'Tapis & Moquettes',
    icon: Grid2X2,
    description: 'Tapis décoratifs, runners',
  },
  {
    code: 'wall_coverings',
    label: 'Revêtements muraux',
    icon: Wallpaper,
    description: 'Papiers peints, panneaux',
  },
  {
    code: 'tableware',
    label: 'Arts de la table',
    icon: UtensilsCrossed,
    description: 'Vaisselle, couverts',
  },
  {
    code: 'hardware_accessories',
    label: 'Quincaillerie & Accessoires',
    icon: Wrench,
    description: 'Poignées, patères, fixations',
  },
  {
    code: 'packaging_logistics',
    label: 'Emballage & Logistique',
    icon: Package,
    description: 'Emballages protecteurs',
  },
  {
    code: 'raw_materials',
    label: 'Matières premières',
    icon: Package2,
    description: 'Bois, métaux, composants',
  },
];

export function SupplierCategorySelect({
  value,
  onChange,
  disabled = false,
  showLabel = true,
  placeholder = 'Sélectionner des catégories...',
  maxDisplay = 3,
  className,
}: SupplierCategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parser la valeur en array
  const selectedCategories = React.useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return value
      .split(',')
      .map(c => c.trim())
      .filter(c => c) as SupplierCategoryCode[];
  }, [value]);

  // Fermer dropdown en cliquant dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrer catégories selon recherche
  const filteredCategories = CATEGORY_OPTIONS.filter(
    cat =>
      cat.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (categoryCode: SupplierCategoryCode) => {
    if (disabled) return;

    const newValue = selectedCategories.includes(categoryCode)
      ? selectedCategories.filter(c => c !== categoryCode)
      : [...selectedCategories, categoryCode];

    onChange(newValue);
  };

  const handleRemove = (categoryCode: SupplierCategoryCode) => {
    if (disabled) return;
    onChange(selectedCategories.filter(c => c !== categoryCode));
  };

  const handleClearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  const displayCategories = selectedCategories.slice(0, maxDisplay);
  const remainingCount = selectedCategories.length - maxDisplay;

  return (
    <div className={cn('relative', className)}>
      {showLabel && (
        <Label htmlFor="supplier-categories" className="mb-2 block">
          Catégories de produits
        </Label>
      )}

      <div ref={dropdownRef}>
        {/* Trigger button avec badges */}
        <ButtonV2
          type="button"
          variant="outline"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal h-auto min-h-[40px] py-2',
            selectedCategories.length === 0 && 'text-neutral-500'
          )}
        >
          <div className="flex flex-wrap items-center gap-1 flex-1 mr-2">
            {selectedCategories.length === 0 ? (
              <span>{placeholder}</span>
            ) : (
              <>
                {displayCategories.map(code => {
                  const config = CATEGORY_OPTIONS.find(c => c.code === code);
                  if (!config) return null;
                  const Icon = config.icon;

                  return (
                    <Badge
                      key={code}
                      variant="outline"
                      className="bg-neutral-50 text-neutral-700 border-neutral-200 gap-1"
                    >
                      <Icon className="h-3 w-3" />
                      <span>{config.label}</span>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleRemove(code);
                        }}
                        className="ml-1 hover:bg-neutral-200 rounded-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
                {remainingCount > 0 && (
                  <Badge variant="outline" className="bg-neutral-100">
                    +{remainingCount}
                  </Badge>
                )}
              </>
            )}
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </ButtonV2>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-neutral-200 rounded-md shadow-lg">
            {/* Header avec recherche et clear all */}
            <div className="p-2 border-b border-neutral-200">
              <input
                ref={inputRef}
                type="text"
                placeholder="Rechercher une catégorie..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {selectedCategories.length > 0 && (
                <ButtonV2
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="w-full mt-2 text-xs"
                >
                  Tout désélectionner ({selectedCategories.length})
                </ButtonV2>
              )}
            </div>

            {/* Liste catégories */}
            <div className="max-h-[300px] overflow-y-auto p-2">
              {filteredCategories.length === 0 ? (
                <div className="py-6 text-center text-sm text-neutral-500">
                  Aucune catégorie trouvée
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredCategories.map(category => {
                    const isSelected = selectedCategories.includes(
                      category.code
                    );
                    const Icon = category.icon;

                    return (
                      <button
                        key={category.code}
                        type="button"
                        onClick={() => handleSelect(category.code)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                          'hover:bg-neutral-50',
                          isSelected && 'bg-primary-50 hover:bg-primary-100'
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded border',
                            isSelected
                              ? 'bg-primary-500 border-primary-500'
                              : 'border-neutral-300'
                          )}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <Icon className="h-4 w-4 text-neutral-600" />
                        <div className="flex-1 text-left">
                          <div className="font-medium text-neutral-900">
                            {category.label}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {category.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Helper text */}
      {selectedCategories.length > 0 && (
        <p className="mt-1.5 text-xs text-neutral-600">
          {selectedCategories.length} catégorie
          {selectedCategories.length > 1 ? 's' : ''} sélectionnée
          {selectedCategories.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

/**
 * Helper: Convertir array en string comma-separated (pour DB storage)
 */
export function categoriesToString(categories: SupplierCategoryCode[]): string {
  return categories.join(',');
}

/**
 * Helper: Parser string comma-separated en array
 */
export function stringToCategories(
  categoriesString: string | null | undefined
): SupplierCategoryCode[] {
  if (!categoriesString) return [];
  return categoriesString
    .split(',')
    .map(c => c.trim())
    .filter(c => c) as SupplierCategoryCode[];
}
