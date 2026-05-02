'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui/components/ui/select';

import { BRANDS } from '../../data/brands';
import type { BrandSlug } from '../../types';

const VALID_SLUGS: ReadonlyArray<BrandSlug> = BRANDS.map(b => b.slug);

function isBrandSlug(value: string): value is BrandSlug {
  return (VALID_SLUGS as ReadonlyArray<string>).includes(value);
}

export interface BrandSelectorProps {
  value: BrandSlug;
  onChange: (slug: BrandSlug) => void;
  disabled?: boolean;
  allowedSlugs?: ReadonlyArray<BrandSlug>;
}

export function BrandSelector({
  value,
  onChange,
  disabled,
  allowedSlugs,
}: BrandSelectorProps) {
  const filteredBrands =
    allowedSlugs && allowedSlugs.length > 0
      ? BRANDS.filter(b => allowedSlugs.includes(b.slug))
      : BRANDS;
  return (
    <Select
      value={value}
      onValueChange={v => {
        if (isBrandSlug(v)) onChange(v);
      }}
      disabled={disabled}
    >
      <SelectTrigger className="w-full" aria-label="Marque">
        <SelectValue placeholder="Choisir une marque" />
      </SelectTrigger>
      <SelectContent>
        {filteredBrands.map(brand => (
          <SelectItem key={brand.slug} value={brand.slug}>
            <span className="font-medium">{brand.name}</span>
            <span className="ml-2 text-xs text-muted-foreground">
              — {brand.description}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
