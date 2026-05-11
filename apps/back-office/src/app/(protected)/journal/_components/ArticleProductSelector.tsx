'use client';

import { useMemo, useState } from 'react';

import { X, Search } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

interface ProductOption {
  id: string;
  name: string;
  sku: string | null;
}

const MAX_SELECTION = 4;
const STALE_TIME_MS = 5 * 60 * 1000;

async function fetchActiveProducts(): Promise<ProductOption[]> {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku')
    .order('name', { ascending: true })
    .limit(500);

  if (error) throw new Error(error.message);
  return (data ?? []) as ProductOption[];
}

interface ArticleProductSelectorProps {
  value: string[];
  onChange: (ids: string[]) => void;
}

export function ArticleProductSelector({
  value,
  onChange,
}: ArticleProductSelectorProps) {
  const [search, setSearch] = useState('');

  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ['products-for-article-selector'],
    queryFn: fetchActiveProducts,
    staleTime: STALE_TIME_MS,
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allProducts.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        (p.sku?.toLowerCase().includes(q) ?? false)
    );
  }, [allProducts, search]);

  const selectedProducts = useMemo(
    () => allProducts.filter(p => value.includes(p.id)),
    [allProducts, value]
  );

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id));
    } else if (value.length < MAX_SELECTION) {
      onChange([...value, id]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Sélection courante */}
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedProducts.map(p => (
            <div
              key={p.id}
              className="flex items-center gap-2 border border-gray-200 bg-gray-50 px-2 py-1"
            >
              <span className="max-w-[160px] truncate text-xs text-gray-700">
                {p.name}
                {p.sku && <span className="ml-1 text-gray-400">({p.sku})</span>}
              </span>
              <button
                type="button"
                onClick={() => toggle(p.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                aria-label={`Retirer ${p.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length >= MAX_SELECTION && (
        <p className="text-xs text-amber-600">
          Maximum {MAX_SELECTION} produits atteint.
        </p>
      )}

      {value.length < MAX_SELECTION && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>

          {isLoading && <p className="text-xs text-gray-400">Chargement…</p>}

          {!isLoading && search.length > 0 && (
            <div className="max-h-48 overflow-y-auto border border-gray-200 bg-white">
              {filtered.slice(0, 20).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  disabled={value.includes(p.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <span className="font-medium text-gray-800">{p.name}</span>
                  {p.sku && (
                    <span className="text-xs text-gray-400">{p.sku}</span>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-4 text-xs text-gray-400">
                  Aucun produit trouvé.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
