'use client';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { Check, ChevronDown, Layers } from 'lucide-react';

import { useActiveBrand } from '@/hooks/use-active-brand';

const ALL_BRANDS_LABEL = 'Toutes les marques';

export function BrandSwitcher() {
  const { activeBrand, brands, isAllBrands, setActiveBrand, isLoading } =
    useActiveBrand();

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className="h-9 md:h-9">
        <span className="text-xs text-slate-500">Chargement…</span>
      </Button>
    );
  }

  const triggerLabel = isAllBrands
    ? ALL_BRANDS_LABEL
    : (activeBrand?.name ?? '');
  const triggerColor = isAllBrands ? null : (activeBrand?.brand_color ?? null);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-11 md:h-9 gap-2 px-3"
          aria-label={`Marque active : ${triggerLabel}`}
        >
          <BrandColorDot color={triggerColor} />
          <span className="hidden md:inline truncate max-w-[120px]">
            {triggerLabel}
          </span>
          <span className="md:hidden">
            <Layers className="h-4 w-4" />
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Filtre marque
        </DropdownMenuLabel>
        <DropdownMenuItem
          className={cn('cursor-pointer', isAllBrands && 'bg-slate-50')}
          onSelect={() => setActiveBrand(null)}
        >
          <BrandColorDot color={null} />
          <span className="ml-2 flex-1">{ALL_BRANDS_LABEL}</span>
          {isAllBrands && <Check className="h-4 w-4 text-slate-700" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {brands.map(brand => {
          const selected = activeBrand?.id === brand.id;
          return (
            <DropdownMenuItem
              key={brand.id}
              className={cn('cursor-pointer', selected && 'bg-slate-50')}
              onSelect={() => setActiveBrand(brand.id)}
            >
              <BrandColorDot color={brand.brand_color} />
              <span className="ml-2 flex-1">{brand.name}</span>
              {selected && <Check className="h-4 w-4 text-slate-700" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BrandColorDot({ color }: { color: string | null }) {
  if (!color) {
    return (
      <span className="inline-block h-3 w-3 rounded-full border border-slate-300 bg-white" />
    );
  }
  return (
    <span
      className="inline-block h-3 w-3 rounded-full border border-slate-200"
      style={{ backgroundColor: color }}
    />
  );
}
