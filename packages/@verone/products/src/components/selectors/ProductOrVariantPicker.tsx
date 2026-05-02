'use client';

import * as React from 'react';

import { Layers, Package, Search, X } from 'lucide-react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@verone/ui/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@verone/ui/components/ui/popover';
import { Button } from '@verone/ui/components/ui/button';
import { Badge } from '@verone/ui/components/ui/badge';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

export type PickedItem =
  | {
      kind: 'product';
      id: string;
      displayName: string;
      commercialName: string | null;
      supplierName: string | null;
      brandIds: string[];
      variantGroupId: string | null;
    }
  | {
      kind: 'variant_group';
      id: string;
      displayName: string;
      productCount: number;
      brandIds: string[];
    };

interface ProductOrVariantPickerProps {
  value: PickedItem | null;
  onChange: (item: PickedItem | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface ProductRow {
  id: string;
  name: string;
  commercial_name: string | null;
  sku: string | null;
  brand_ids: string[] | null;
  variant_group_id: string | null;
  supplier: { trade_name: string | null; legal_name: string } | null;
}

interface VariantGroupRow {
  id: string;
  name: string;
  product_count: number | null;
  products: { brand_ids: string[] | null }[] | null;
}

const SEARCH_DEBOUNCE_MS = 200;
const RESULT_LIMIT = 8;

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function uniqueIds(arrays: (string[] | null | undefined)[]): string[] {
  const set = new Set<string>();
  for (const arr of arrays) {
    if (arr) for (const id of arr) set.add(id);
  }
  return Array.from(set);
}

export function ProductOrVariantPicker({
  value,
  onChange,
  placeholder = 'Rechercher un produit ou une variante…',
  disabled = false,
  className,
}: ProductOrVariantPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounced(search, SEARCH_DEBOUNCE_MS);

  const [products, setProducts] = React.useState<ProductRow[]>([]);
  const [variantGroups, setVariantGroups] = React.useState<VariantGroupRow[]>(
    []
  );
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const term = debouncedSearch.trim();

    async function run() {
      setLoading(true);
      try {
        const productsQuery = supabase
          .from('products')
          .select(
            'id, name, commercial_name, sku, brand_ids, variant_group_id, supplier:organisations!supplier_id(trade_name, legal_name)'
          )
          .is('archived_at', null)
          .neq('creation_mode', 'sourcing')
          .order('updated_at', { ascending: false })
          .limit(RESULT_LIMIT);

        const variantGroupsQuery = supabase
          .from('variant_groups')
          .select('id, name, product_count, products(brand_ids)')
          .is('archived_at', null)
          .order('updated_at', { ascending: false })
          .limit(RESULT_LIMIT);

        if (term.length > 0) {
          productsQuery.or(
            `name.ilike.%${term}%,commercial_name.ilike.%${term}%,sku.ilike.%${term}%`
          );
          variantGroupsQuery.ilike('name', `%${term}%`);
        }

        const [productsResult, variantGroupsResult] = await Promise.all([
          productsQuery,
          variantGroupsQuery,
        ]);

        if (cancelled) return;

        if (productsResult.error) {
          console.error(
            '[ProductOrVariantPicker] products error:',
            productsResult.error
          );
        } else {
          setProducts(
            (productsResult.data as unknown as ProductRow[] | null) ?? []
          );
        }

        if (variantGroupsResult.error) {
          console.error(
            '[ProductOrVariantPicker] variant_groups error:',
            variantGroupsResult.error
          );
        } else {
          setVariantGroups(
            (variantGroupsResult.data as unknown as VariantGroupRow[] | null) ??
              []
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  const handleSelectProduct = React.useCallback(
    (row: ProductRow) => {
      onChange({
        kind: 'product',
        id: row.id,
        displayName: row.commercial_name ?? row.name,
        commercialName: row.commercial_name,
        supplierName:
          row.supplier?.trade_name ?? row.supplier?.legal_name ?? null,
        brandIds: row.brand_ids ?? [],
        variantGroupId: row.variant_group_id,
      });
      setOpen(false);
      setSearch('');
    },
    [onChange]
  );

  const handleSelectVariantGroup = React.useCallback(
    (row: VariantGroupRow) => {
      onChange({
        kind: 'variant_group',
        id: row.id,
        displayName: row.name,
        productCount: row.product_count ?? 0,
        brandIds: uniqueIds((row.products ?? []).map(p => p.brand_ids)),
      });
      setOpen(false);
      setSearch('');
    },
    [onChange]
  );

  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
    },
    [onChange]
  );

  const triggerLabel = value
    ? value.kind === 'product'
      ? value.displayName
      : `${value.displayName} (variante · ${value.productCount} produits)`
    : placeholder;

  return (
    <div className={cn('relative', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-between font-normal h-11 md:h-10',
              !value && 'text-muted-foreground',
              value && 'pr-10'
            )}
          >
            <div className="flex items-center gap-2 truncate">
              {value?.kind === 'variant_group' ? (
                <Layers className="h-4 w-4 shrink-0" />
              ) : (
                <Package className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate">{triggerLabel}</span>
            </div>
            {!value && <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Rechercher un produit ou une variante…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {loading && (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  Recherche en cours…
                </div>
              )}
              {!loading &&
                products.length === 0 &&
                variantGroups.length === 0 && (
                  <CommandEmpty>Aucun résultat.</CommandEmpty>
                )}
              {variantGroups.length > 0 && (
                <CommandGroup heading="Variantes">
                  {variantGroups.map(row => (
                    <CommandItem
                      key={`vg-${row.id}`}
                      value={`vg-${row.id}`}
                      onSelect={() => handleSelectVariantGroup(row)}
                      className="flex items-start gap-2"
                    >
                      <Layers className="mt-0.5 h-4 w-4 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-sm">{row.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {row.product_count ?? 0} produits dans le groupe
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="ml-auto text-[10px]"
                      >
                        Variante
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {products.length > 0 && (
                <CommandGroup heading="Produits">
                  {products.map(row => {
                    const subtitle = [
                      row.commercial_name && row.commercial_name !== row.name
                        ? `Fournisseur : ${row.name}`
                        : (row.supplier?.trade_name ??
                          row.supplier?.legal_name ??
                          null),
                      row.sku,
                    ]
                      .filter(Boolean)
                      .join(' · ');
                    return (
                      <CommandItem
                        key={`p-${row.id}`}
                        value={`p-${row.id}`}
                        onSelect={() => handleSelectProduct(row)}
                        className="flex items-start gap-2"
                      >
                        <Package className="mt-0.5 h-4 w-4 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {row.commercial_name ?? row.name}
                          </span>
                          {subtitle && (
                            <span className="text-xs text-muted-foreground">
                              {subtitle}
                            </span>
                          )}
                        </div>
                        {row.variant_group_id && (
                          <Badge
                            variant="outline"
                            className="ml-auto text-[10px]"
                          >
                            Dans une variante
                          </Badge>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-muted"
          aria-label="Effacer la sélection"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
