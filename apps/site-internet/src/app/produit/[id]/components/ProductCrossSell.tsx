'use client';

import Link from 'next/link';

import { CloudflareImage } from '@verone/ui';
import { formatPrice } from '@verone/utils';
import {
  useCatalogueProducts,
  type CatalogueProduct,
} from '@/hooks/use-catalogue-products';

interface ProductCrossSellProps {
  currentProductId: string;
}

export function ProductCrossSell({ currentProductId }: ProductCrossSellProps) {
  const { data: allProducts } = useCatalogueProducts({ sortBy: 'newest' });

  // Filter out current product and take up to 6
  const recommendations =
    allProducts
      ?.filter((p: CatalogueProduct) => p.product_id !== currentProductId)
      .slice(0, 6) ?? [];

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 mb-8">
      <h2 className="text-2xl font-semibold mb-6">
        Les clients ont également consulté
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                <h3 className="text-sm font-medium line-clamp-2 group-hover:text-verone-gray-600 transition-colors">
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
