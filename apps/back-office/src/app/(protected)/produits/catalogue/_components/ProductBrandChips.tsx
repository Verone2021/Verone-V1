'use client';

import { BrandChip } from '@verone/products/components/badges';

import { useBrands } from '@/hooks/use-brands';

interface ProductBrandChipsProps {
  brandIds: string[] | undefined | null;
  size?: 'xs' | 'sm';
  /** Si true, n'affiche que la première chip + un compteur "+N" si plusieurs */
  collapsed?: boolean;
  className?: string;
}

export function ProductBrandChips({
  brandIds,
  size = 'xs',
  collapsed = false,
  className,
}: ProductBrandChipsProps) {
  const { brands } = useBrands();

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
