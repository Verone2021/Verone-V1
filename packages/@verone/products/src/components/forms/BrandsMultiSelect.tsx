'use client';

import { useEffect, useState } from 'react';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import { Check, ChevronDown, X } from 'lucide-react';

import { BrandChip, type BrandChipData } from '../badges/BrandChip';

interface BrandsMultiSelectProps {
  /** Liste des UUID de brands actuellement sélectionnés */
  value: string[];
  /** Callback déclenché quand la sélection change */
  onChange: (nextIds: string[]) => void;
  disabled?: boolean;
  className?: string;
  emptyLabel?: string;
}

/**
 * Multi-select des marques internes Vérone Group.
 * - Récupère les brands actifs depuis la DB (cache local au montage)
 * - Affiche les brands sélectionnés en chips colorées
 * - Toggle via dropdown (cocher/décocher)
 * - Vide autorisé (produits white-label)
 */
export function BrandsMultiSelect({
  value,
  onChange,
  disabled = false,
  className,
  emptyLabel = 'Aucune marque',
}: BrandsMultiSelectProps) {
  const [brands, setBrands] = useState<BrandChipData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchBrands = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('brands')
        .select('id, slug, name, brand_color')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error('[BrandsMultiSelect] fetch failed:', error);
        setBrands([]);
      } else {
        setBrands((data ?? []) as BrandChipData[]);
      }
      setLoading(false);
    };

    void fetchBrands().catch(err =>
      console.error('[BrandsMultiSelect] unexpected:', err)
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedBrands = brands.filter(b => value.includes(b.id));

  const toggle = (brandId: string) => {
    if (value.includes(brandId)) {
      onChange(value.filter(id => id !== brandId));
    } else {
      onChange([...value, brandId]);
    }
  };

  const remove = (brandId: string) => {
    onChange(value.filter(id => id !== brandId));
  };

  return (
    <div className={cn('space-y-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || loading}
            className="h-11 md:h-9 w-full justify-between"
          >
            <span className="text-xs text-slate-600">
              {loading
                ? 'Chargement…'
                : value.length === 0
                  ? 'Sélectionner des marques'
                  : `${value.length} marque${value.length > 1 ? 's' : ''} sélectionnée${value.length > 1 ? 's' : ''}`}
            </span>
            <ChevronDown className="h-4 w-4 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          {brands.length === 0 ? (
            <DropdownMenuItem disabled>
              Aucune marque disponible
            </DropdownMenuItem>
          ) : (
            brands.map((brand, idx) => {
              const checked = value.includes(brand.id);
              return (
                <div key={brand.id}>
                  {idx > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    className={cn('cursor-pointer', checked && 'bg-slate-50')}
                    onSelect={e => {
                      e.preventDefault();
                      toggle(brand.id);
                    }}
                  >
                    <span
                      className="inline-block h-3 w-3 rounded-full border border-slate-300"
                      style={
                        brand.brand_color
                          ? { backgroundColor: brand.brand_color }
                          : undefined
                      }
                    />
                    <span className="ml-2 flex-1">{brand.name}</span>
                    {checked && <Check className="h-4 w-4 text-slate-700" />}
                  </DropdownMenuItem>
                </div>
              );
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Chips des marques sélectionnées */}
      {selectedBrands.length === 0 ? (
        <p className="text-xs text-slate-400 italic">{emptyLabel}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {selectedBrands.map(brand => (
            <span
              key={brand.id}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 pl-1.5 pr-1 py-0.5 text-xs"
            >
              <BrandChip
                brand={brand}
                size="xs"
                className="border-0 bg-transparent px-0"
              />
              <button
                type="button"
                onClick={() => remove(brand.id)}
                disabled={disabled}
                className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Retirer ${brand.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
