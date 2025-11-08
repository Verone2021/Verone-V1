/**
 * Composant: SupplierCategoryBadge
 * Affiche un badge pour une catégorie de produits vendus par un fournisseur
 *
 * Catégories (13 au total):
 * - Mobilier intérieur, Mobilier extérieur, Luminaires, Textiles,
 *   Objets décoratifs, Art & Sculptures, Miroirs & Cadres, Tapis,
 *   Revêtements muraux, Arts de la table, Quincaillerie, Emballage, Matières premières
 *
 * Support multi-catégories: "furniture_indoor,lighting,textiles_fabrics"
 */

import React from 'react';

import type { LucideIcon } from 'lucide-react';
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

import { cn } from '@verone/utils';

export type SupplierCategoryCode =
  | 'furniture_indoor'
  | 'furniture_outdoor'
  | 'lighting'
  | 'textiles_fabrics'
  | 'decorative_objects'
  | 'art_sculptures'
  | 'mirrors_frames'
  | 'rugs_carpets'
  | 'wall_coverings'
  | 'tableware'
  | 'hardware_accessories'
  | 'packaging_logistics'
  | 'raw_materials';

interface SupplierCategoryBadgeProps {
  /** Code catégorie ou string multi-catégories (comma-separated) */
  category: SupplierCategoryCode | string | null | undefined;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  /** Mode display: single badge ou multiple badges */
  mode?: 'single' | 'multi';
  /** Nombre max de badges à afficher en mode multi */
  maxDisplay?: number;
  className?: string;
}

// Configuration des catégories (synchronisé avec table supplier_categories)
const CATEGORY_CONFIG: Record<
  SupplierCategoryCode,
  {
    label: string;
    icon: LucideIcon;
  }
> = {
  furniture_indoor: { label: 'Mobilier intérieur', icon: Sofa },
  furniture_outdoor: { label: 'Mobilier extérieur', icon: TreeDeciduous },
  lighting: { label: 'Luminaires', icon: Lamp },
  textiles_fabrics: { label: 'Textiles', icon: Shirt },
  decorative_objects: { label: 'Objets déco', icon: Sparkles },
  art_sculptures: { label: 'Art & Sculptures', icon: Paintbrush },
  mirrors_frames: { label: 'Miroirs & Cadres', icon: Frame },
  rugs_carpets: { label: 'Tapis', icon: Grid2X2 },
  wall_coverings: { label: 'Revêtements muraux', icon: Wallpaper },
  tableware: { label: 'Arts de la table', icon: UtensilsCrossed },
  hardware_accessories: { label: 'Quincaillerie', icon: Wrench },
  packaging_logistics: { label: 'Emballage', icon: Package },
  raw_materials: { label: 'Matières premières', icon: Package2 },
};

// Configuration tailles
const SIZE_CONFIG = {
  sm: {
    container: 'px-2 py-0.5 gap-1',
    text: 'text-xs',
    icon: 'h-3 w-3',
  },
  md: {
    container: 'px-2.5 py-1 gap-1.5',
    text: 'text-sm',
    icon: 'h-3.5 w-3.5',
  },
};

/**
 * Composant Single Badge - Affiche une seule catégorie
 */
function SingleCategoryBadge({
  categoryCode,
  size = 'sm',
  showIcon = true,
  className,
}: {
  categoryCode: SupplierCategoryCode;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}) {
  const config = CATEGORY_CONFIG[categoryCode];
  if (!config) return null;

  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        // Base styles
        'inline-flex items-center rounded-md border font-medium',
        'transition-all duration-200',
        // Colors (neutral/subtle pour catégories)
        'bg-neutral-50 text-neutral-700 border-neutral-200',
        'hover:bg-neutral-100',
        // Size
        sizeConfig.container,
        sizeConfig.text,
        // Custom className
        className
      )}
    >
      {showIcon && <Icon className={cn('flex-shrink-0', sizeConfig.icon)} />}
      <span>{config.label}</span>
    </span>
  );
}

/**
 * Composant Principal - Support mode single et multi
 */
export function SupplierCategoryBadge({
  category,
  size = 'sm',
  showIcon = true,
  mode = 'single',
  maxDisplay = 3,
  className,
}: SupplierCategoryBadgeProps) {
  // Ne rien afficher si pas de catégorie
  if (!category) {
    return null;
  }

  // Parser les catégories (support comma-separated)
  const categories = category
    .split(',')
    .map(c => c.trim())
    .filter(c => c in CATEGORY_CONFIG) as SupplierCategoryCode[];

  if (categories.length === 0) {
    return null;
  }

  // Mode single: Afficher seulement la première catégorie
  if (mode === 'single') {
    return (
      <SingleCategoryBadge
        categoryCode={categories[0]}
        size={size}
        showIcon={showIcon}
        className={className}
      />
    );
  }

  // Mode multi: Afficher tous les badges (limité par maxDisplay)
  const displayCategories = categories.slice(0, maxDisplay);
  const remainingCount = categories.length - maxDisplay;

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {displayCategories.map(cat => (
        <SingleCategoryBadge
          key={cat}
          categoryCode={cat}
          size={size}
          showIcon={showIcon}
        />
      ))}
      {remainingCount > 0 && (
        <span
          className={cn(
            'inline-flex items-center rounded-md px-2 py-0.5',
            'bg-neutral-100 text-neutral-600 font-medium',
            SIZE_CONFIG[size].text
          )}
        >
          +{remainingCount}
        </span>
      )}
    </div>
  );
}

/**
 * Helper: Extraire les catégories depuis string comma-separated
 */
export function parseCategoriesString(
  categoryString: string | null | undefined
): SupplierCategoryCode[] {
  if (!categoryString) return [];

  return categoryString
    .split(',')
    .map(c => c.trim())
    .filter(c => c in CATEGORY_CONFIG) as SupplierCategoryCode[];
}

/**
 * Helper: Obtenir le label d'une catégorie
 */
export function getCategoryLabel(
  categoryCode: SupplierCategoryCode | string
): string {
  const config = CATEGORY_CONFIG[categoryCode as SupplierCategoryCode];
  return config?.label || categoryCode;
}
