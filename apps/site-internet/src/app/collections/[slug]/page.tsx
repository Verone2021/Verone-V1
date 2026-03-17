'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { ArrowLeft, Package } from 'lucide-react';

import { CardProductLuxury } from '@/components/ui/CardProductLuxury';
import { useCollectionBySlug } from '@/hooks/use-collections';
import { useCatalogueProducts } from '@/hooks/use-catalogue-products';

export default function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    void params.then(({ slug: s }) => setSlug(s));
  }, [params]);

  const {
    data: collection,
    isLoading: collectionLoading,
    error: collectionError,
  } = useCollectionBySlug(slug);

  const { data: allProducts, isLoading: productsLoading } =
    useCatalogueProducts();

  // Filter products that belong to this collection
  // Since we don't have collection_id on CatalogueProduct, we use collectionSlug option
  // For now, show all products - TODO: filter by collection via RPC or join
  const products = allProducts;

  const isLoading = collectionLoading || productsLoading;

  if (!slug) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-verone-gray-200 rounded w-1/3" />
          <div className="h-64 bg-verone-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
      {/* Back link */}
      <Link
        href="/collections"
        className="inline-flex items-center gap-2 text-sm text-verone-gray-500 hover:text-verone-black transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Toutes les collections
      </Link>

      {collectionError && (
        <div className="text-center py-20">
          <p className="text-verone-gray-500">
            Collection introuvable ou indisponible.
          </p>
          <Link
            href="/collections"
            className="mt-4 inline-block text-sm text-verone-black underline"
          >
            Voir toutes les collections
          </Link>
        </div>
      )}

      {isLoading && (
        <div className="space-y-8">
          <div className="animate-pulse">
            <div className="h-10 bg-verone-gray-200 rounded w-1/3 mb-4" />
            <div className="h-5 bg-verone-gray-100 rounded w-2/3" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-verone-gray-200 h-64 rounded-lg" />
                <div className="mt-4 space-y-2">
                  <div className="h-5 bg-verone-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-verone-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {collection && (
        <>
          {/* Collection header */}
          <div className="mb-12">
            {collection.image_url && (
              <div className="relative h-64 md:h-80 rounded-lg overflow-hidden mb-8">
                <Image
                  src={collection.image_url}
                  alt={collection.name}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8">
                  <h1 className="font-playfair text-3xl md:text-4xl font-bold text-white">
                    {collection.name}
                  </h1>
                </div>
              </div>
            )}

            {!collection.image_url && (
              <h1 className="font-playfair text-3xl md:text-4xl font-bold text-verone-black mb-4">
                {collection.name}
              </h1>
            )}

            {(collection.description_long ?? collection.description) && (
              <p className="text-verone-gray-600 max-w-3xl leading-relaxed">
                {collection.description_long ?? collection.description}
              </p>
            )}

            {collection.selling_points &&
              collection.selling_points.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {collection.selling_points.map((point, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-xs bg-verone-gray-100 text-verone-gray-600 rounded-full"
                    >
                      {point}
                    </span>
                  ))}
                </div>
              )}
          </div>

          {/* Products grid */}
          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {products.map((p, index) => (
                <CardProductLuxury
                  key={p.product_id}
                  id={p.product_id}
                  name={p.name}
                  description={p.seo_meta_description ?? undefined}
                  price={p.price_ttc}
                  imageUrl={p.primary_image_url}
                  href={`/produit/${p.slug}`}
                  priority={index < 4}
                />
              ))}
            </div>
          ) : (
            !isLoading && (
              <div className="text-center py-16">
                <Package className="h-12 w-12 text-verone-gray-300 mx-auto mb-4" />
                <p className="text-verone-gray-500">
                  Aucun produit dans cette collection pour le moment.
                </p>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
