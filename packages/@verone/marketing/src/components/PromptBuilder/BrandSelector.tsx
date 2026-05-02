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

export interface BrandSelectorProps {
  value: BrandSlug;
  onChange: (slug: BrandSlug) => void;
  disabled?: boolean;
}

export function BrandSelector({
  value,
  onChange,
  disabled,
}: BrandSelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={v => onChange(v as BrandSlug)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full" aria-label="Marque">
        <SelectValue placeholder="Choisir une marque" />
      </SelectTrigger>
      <SelectContent>
        {BRANDS.map(brand => (
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
