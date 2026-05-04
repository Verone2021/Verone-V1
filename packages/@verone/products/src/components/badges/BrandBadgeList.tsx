'use client';

/**
 * BrandBadgeList — affichage en lecture seule des marques d'un produit.
 *
 * Wrapper léger autour de `BrandChip[]` (le composant unitaire existant).
 * Source de vérité visuelle pour "quelles marques porte ce produit".
 *
 * Cohérence design (à respecter dans tout futur affichage de marques) :
 *   - Couleur de la marque = `brand.brand_color` (pastille à gauche).
 *     Fallback neutre si NULL (cf. BrandChip).
 *   - Label = `brand.name` (pas le slug, pas l'UUID).
 *   - Border arrondi (rounded-full), background blanc, texte slate-700.
 *   - 2 tailles : `xs` (11px) / `sm` (12px). `xs` recommandé pour les rails.
 *
 * Si `brandIds` est null/[] ou aucune correspondance trouvée → rien rendu
 * (return null). Pas de placeholder vide. Le parent contrôle la visibilité
 * du conteneur (label "Marques" etc.) selon ses besoins.
 *
 * Voir aussi :
 *   - BrandChip (composant unitaire) — packages/@verone/products/src/components/badges/BrandChip.tsx
 *   - BrandsMultiSelect (sélecteur éditable) — packages/@verone/products/src/components/forms/BrandsMultiSelect.tsx
 *   - useBrands — packages/@verone/products/src/hooks/use-brands.ts
 */

import { cn } from '@verone/utils';

import { useBrands } from '../../hooks/use-brands';
import { BrandChip } from './BrandChip';

interface BrandBadgeListProps {
  brandIds: string[] | null | undefined;
  /** Taille des badges. `xs` recommandé pour les sidebars/rails. */
  size?: 'xs' | 'sm';
  className?: string;
}

export function BrandBadgeList({
  brandIds,
  size = 'sm',
  className,
}: BrandBadgeListProps) {
  const { data: allBrands = [], isLoading } = useBrands();

  if (isLoading) {
    return null;
  }

  if (!brandIds || brandIds.length === 0) {
    return null;
  }

  const brands = allBrands.filter(b => brandIds.includes(b.id));

  if (brands.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {brands.map(brand => (
        <BrandChip key={brand.id} brand={brand} size={size} />
      ))}
    </div>
  );
}
