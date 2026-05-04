'use client';

import { BrandChip } from '@verone/products/components/badges';

import { useActiveBrand } from '@/hooks/use-active-brand';

interface ProductBrandChipsProps {
  brandIds: string[] | undefined | null;
  size?: 'xs' | 'sm';
  /** Si true, n'affiche que la première chip + un compteur "+N" si plusieurs */
  collapsed?: boolean;
  className?: string;
}

/**
 * Affiche les marques internes Vérone Group d'un produit sous forme de chips colorées.
 * Utilise `useActiveBrand` pour récupérer la liste des brands (cache 5 min partagé
 * avec le BrandSwitcher header — pas de fetch supplémentaire).
 *
 * Cas spéciaux :
 * - brandIds vide / undefined : rien affiché (produit white-label)
 * - collapsed + 1 brand : affiche la chip
 * - collapsed + N brands (>1) : affiche la 1ère + tooltip "+N autres"
 */
export function ProductBrandChips({
  brandIds,
  size = 'xs',
  collapsed = false,
  className,
}: ProductBrandChipsProps) {
  const { brands } = useActiveBrand();

  if (!brandIds || brandIds.length === 0) return null;

  const productBrands = brands.filter(b => brandIds.includes(b.id));
  if (productBrands.length === 0) return null;

  if (collapsed && productBrands.length > 1) {
    const [first, ...rest] = productBrands;
    return (
      <span
        className={className}
        title={productBrands.map(b => b.name).join(', ')}
      >
        <BrandChip brand={first} size={size} />
        <span className="ml-1 text-[10px] text-slate-500 align-middle">
          +{rest.length}
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex flex-wrap items-center gap-1 ${className ?? ''}`}
    >
      {productBrands.map(brand => (
        <BrandChip key={brand.id} brand={brand} size={size} />
      ))}
    </span>
  );
}
