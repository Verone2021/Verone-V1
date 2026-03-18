'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';

import type { CatalogueProduct } from '@/hooks/use-catalogue-products';
import { createUntypedClient } from '@/lib/supabase/untyped-client';

interface SubcategoryTile {
  id: string;
  name: string;
  imageUrl: string | null;
  productCount: number;
}

function useSubcategoryImages(subcategoryIds: string[]) {
  const supabase = createUntypedClient();

  return useQuery({
    queryKey: ['subcategory-images', subcategoryIds],
    queryFn: async (): Promise<Record<string, string | null>> => {
      if (subcategoryIds.length === 0) return {};

      const { data, error } = await supabase
        .from('subcategories')
        .select('id, image_url')
        .in('id', subcategoryIds);

      if (error) {
        console.error('[useSubcategoryImages] fetch error:', error);
        return {};
      }

      const map: Record<string, string | null> = {};
      for (const row of (data ?? []) as Array<{
        id: string;
        image_url: string | null;
      }>) {
        map[row.id] = row.image_url;
      }
      return map;
    },
    enabled: subcategoryIds.length > 0,
    staleTime: 10 * 60 * 1000,
  });
}

function buildTiles(
  products: CatalogueProduct[],
  imageMap: Record<string, string | null>
): SubcategoryTile[] {
  const subcatMap = new Map<string, { name: string; count: number }>();

  for (const p of products) {
    if (!p.subcategory_id || !p.subcategory_name) continue;
    const existing = subcatMap.get(p.subcategory_id);
    if (existing) {
      existing.count += 1;
    } else {
      subcatMap.set(p.subcategory_id, {
        name: p.subcategory_name,
        count: 1,
      });
    }
  }

  return [...subcatMap.entries()]
    .map(([id, data]) => ({
      id,
      name: data.name,
      imageUrl: imageMap[id] ?? null,
      productCount: data.count,
    }))
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 4);
}

interface CategoryTilesProps {
  products: CatalogueProduct[];
}

export function CategoryTiles({ products }: CategoryTilesProps) {
  const subcategoryIds = [
    ...new Set(
      products
        .map(p => p.subcategory_id)
        .filter((id): id is string => id != null)
    ),
  ];

  const { data: imageMap = {} } = useSubcategoryImages(subcategoryIds);
  const tiles = buildTiles(products, imageMap);

  if (tiles.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 mb-3">
          Notre univers
        </p>
        <h2 className="font-playfair text-4xl font-bold text-verone-black">
          Explorez par catégorie
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {tiles.map(tile => (
          <Link
            key={tile.id}
            href={`/catalogue?categorie=${encodeURIComponent(tile.name)}`}
            className="group relative aspect-[3/4] overflow-hidden bg-verone-gray-100"
          >
            {tile.imageUrl ? (
              <>
                <Image
                  src={tile.imageUrl}
                  alt={tile.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 bg-verone-gray-100" />
            )}

            <div className="absolute bottom-0 left-0 p-4 lg:p-6">
              <p
                className={`font-playfair text-lg lg:text-xl font-semibold ${
                  tile.imageUrl ? 'text-white' : 'text-verone-black'
                }`}
              >
                {tile.name}
              </p>
              <p
                className={`text-xs mt-1 ${
                  tile.imageUrl ? 'text-white/70' : 'text-verone-gray-500'
                }`}
              >
                {tile.productCount} pièce
                {tile.productCount > 1 ? 's' : ''}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
