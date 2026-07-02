'use client';

import { useMemo } from 'react';

import Link from 'next/link';

import { CloudflareImage } from '@verone/ui';
import { formatPrice } from '@verone/utils';
import {
  useCatalogueProducts,
  type CatalogueProduct,
} from '@/hooks/use-catalogue-products';

interface ProductCrossSellProps {
  currentProductId: string;
  subcategoryId: string | null;
  variantGroupId: string | null;
  style: string | null;
}

const MAX_RECOMMENDATIONS = 4;

export function ProductCrossSell({
  currentProductId,
  subcategoryId,
  variantGroupId,
  style,
}: ProductCrossSellProps) {
  const { data: allProducts } = useCatalogueProducts({ sortBy: 'newest' });

  // Recommandations pertinentes : priorité même sous-catégorie, puis même style.
  // On exclut le produit courant et les variantes de la même pièce (déjà
  // proposées dans le sélecteur de variantes). On complète avec les nouveautés.
  const recommendations = useMemo(() => {
    const pool = (allProducts ?? []).filter(
      (p: CatalogueProduct) =>
        p.product_id !== currentProductId &&
        (variantGroupId === null || p.variant_group_id !== variantGroupId)
    );

    const scored = pool.map((p: CatalogueProduct) => {
      let score = 0;
      if (subcategoryId && p.subcategory_id === subcategoryId) score += 2;
      if (style && p.style === style) score += 1;
      return { product: p, score };
    });

    // Tri stable (JS) : à score égal, l'ordre "newest" est conservé.
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, MAX_RECOMMENDATIONS).map(s => s.product);
  }, [allProducts, currentProductId, subcategoryId, variantGroupId, style]);

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 mb-8">
      <h2 className="text-2xl font-semibold mb-6">Vous aimerez aussi</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {recommendations.map(product => (
          <Link
            key={product.product_id}
            href={`/produit/${product.slug}`}
            className="group"
          >
            <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-[4/3] bg-verone-gray-50">
                <CloudflareImage
                  cloudflareId={product.primary_cloudflare_image_id ?? null}
                  fallbackSrc={product.primary_image_url}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                  className="object-contain p-2"
                />
              </div>

              <div className="p-3 space-y-1">
                <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem] group-hover:text-verone-gray-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-base font-semibold">
                  {product.price_ttc
                    ? formatPrice(product.price_ttc)
                    : 'Sur demande'}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
