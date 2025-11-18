'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import { formatPrice } from '@verone/utils';

import { useProductDetail } from '@/hooks/use-product-detail';

import { VariantsSection } from './components/VariantsSection';

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [slug, setSlug] = useState<string | null>(null);

  // ✅ FIX P0: Next.js 15 async params requirement
  useEffect(() => {
    params.then(({ id }) => setSlug(id));
  }, [params]);

  const { data: product, isLoading, error } = useProductDetail(slug);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
        <div>
          <div className="bg-gray-200 h-96 rounded-lg mb-4" />
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 h-20 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-24">
        <h1 className="text-3xl font-bold mb-4">Produit non trouvé</h1>
        <p className="text-gray-600">
          Le produit que vous recherchez n'existe pas ou n'est plus disponible.
        </p>
      </div>
    );
  }

  const hasDiscount =
    product.price_source === 'channel_pricing' && product.price_ht;
  const priceDisplay = product.price_ttc
    ? formatPrice(product.price_ttc)
    : '€XX.XX';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Images produit */}
      <div>
        {/* Image principale */}
        {product.primary_image_url ? (
          <div className="relative h-96 rounded-lg overflow-hidden mb-4 bg-gray-100">
            <Image
              src={product.primary_image_url}
              alt={product.name}
              fill
              className="object-contain"
              priority
            />
          </div>
        ) : (
          <div className="bg-gray-200 h-96 rounded-lg mb-4 flex items-center justify-center">
            <span className="text-gray-400">Aucune image</span>
          </div>
        )}

        {/* Miniatures */}
        <div className="grid grid-cols-4 gap-2">
          {product.image_urls && product.image_urls.length > 0 ? (
            product.image_urls.slice(0, 4).map((url, index) => (
              <div
                key={index}
                className="relative h-20 rounded-lg overflow-hidden bg-gray-100"
              >
                <Image
                  src={url}
                  alt={`${product.name} - image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))
          ) : (
            <>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-gray-200 h-20 rounded-lg" />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Détails produit */}
      <div>
        {/* Titre */}
        <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

        {/* Prix */}
        <div className="mb-6">
          {hasDiscount ? (
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-red-600">
                {priceDisplay}
              </div>
              <div className="text-lg text-gray-400 line-through">
                {product.price_ht
                  ? formatPrice(product.price_ht * 1.2)
                  : '€XX.XX'}
              </div>
            </div>
          ) : (
            <div className="text-2xl font-bold text-gray-900">
              {priceDisplay}
            </div>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-600 whitespace-pre-wrap">
              {product.description}
            </p>
          </div>
        )}

        {/* Points de vente (selling points) */}
        {product.selling_points && product.selling_points.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Points forts</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              {product.selling_points.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Caractéristiques techniques */}
        {product.technical_description && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Caractéristiques techniques</h3>
            <p className="text-gray-600 text-sm whitespace-pre-wrap">
              {product.technical_description}
            </p>
          </div>
        )}

        {/* Dimensions */}
        {product.dimensions && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Dimensions</h3>
            <div className="text-gray-600 text-sm">
              {typeof product.dimensions === 'object' &&
                Object.entries(product.dimensions).map(([key, value]) => {
                  // Traduction des clés en français
                  const translations: Record<string, string> = {
                    width: 'Largeur',
                    height: 'Hauteur',
                    depth: 'Profondeur',
                    length: 'Longueur',
                    diameter: 'Diamètre',
                    weight: 'Poids',
                  };
                  const label = translations[key.toLowerCase()] || key;

                  return (
                    <div key={key}>
                      <span className="font-medium">{label}:</span>{' '}
                      {String(value)}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Marque */}
        {product.brand && (
          <div className="mb-6">
            <span className="text-sm text-gray-500">Marque: </span>
            <span className="font-medium">{product.brand}</span>
          </div>
        )}

        {/* Variantes éligibles */}
        <VariantsSection
          currentProductId={product.product_id}
          variantGroupId={product.variant_group_id}
          eligible_variants_count={product.eligible_variants_count}
        />

        {/* Actions */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Quantité</label>
            <input
              type="number"
              defaultValue="1"
              min="1"
              className="border rounded-lg px-4 py-2 w-24"
            />
          </div>
          <button className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
            Ajouter au panier
          </button>
        </div>
      </div>
    </div>
  );
}
