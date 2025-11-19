'use client';

/**
 * Composant: ProductPhotosSection
 * Section galerie photos du produit
 */

import Image from 'next/image';

import { Badge } from '@verone/ui';
import { Star } from 'lucide-react';

import type { SiteInternetProduct } from '../../../types';

interface ProductPhotosSectionProps {
  product: SiteInternetProduct;
}

export default function ProductPhotosSection({
  product,
}: ProductPhotosSectionProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Photos du produit
        </h2>
        <Badge variant="outline">
          {product.image_urls.length} photo
          {product.image_urls.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Galerie */}
      {product.image_urls.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {product.image_urls.map((url, index) => {
            const isPrimary = url === product.primary_image_url;
            return (
              <div
                key={index}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                  isPrimary
                    ? 'border-blue-500 ring-4 ring-blue-100'
                    : 'border-gray-200'
                }`}
              >
                <Image
                  src={url}
                  alt={`${product.name} - Photo ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                {isPrimary && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic text-center py-8">
          Aucune photo
        </p>
      )}
    </div>
  );
}
