'use client';

import { cn } from '@verone/utils';

export interface BrandChipData {
  id: string;
  slug: string;
  name: string;
  brand_color: string | null;
}

interface BrandChipProps {
  brand: BrandChipData;
  size?: 'xs' | 'sm';
  className?: string;
}

/**
 * Petit badge couleur représentant une marque interne (Vérone, Boêmia, Solar, Flos).
 * - Pastille de la couleur `brand.brand_color` à gauche
 * - Label = `brand.name`
 * - Compact, lisible sur mobile (xs) et desktop (sm)
 */
export function BrandChip({ brand, size = 'sm', className }: BrandChipProps) {
  const sizing =
    size === 'xs'
      ? 'text-[10px] gap-1 px-1.5 py-0.5'
      : 'text-xs gap-1.5 px-2 py-0.5';
  const dotSize = size === 'xs' ? 'h-1.5 w-1.5' : 'h-2 w-2';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-slate-200 bg-white text-slate-700',
        sizing,
        className
      )}
      title={brand.name}
    >
      <span
        className={cn('rounded-full border border-slate-300', dotSize)}
        style={
          brand.brand_color ? { backgroundColor: brand.brand_color } : undefined
        }
      />
      <span className="font-medium">{brand.name}</span>
    </span>
  );
}
