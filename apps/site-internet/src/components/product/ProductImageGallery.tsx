'use client';

import { useState } from 'react';
import Image from 'next/image';

import { cn } from '@/lib/utils';

/**
 * ProductImageGallery - Galerie images style WestWing
 *
 * Design :
 * - Image principale 420×560 (ratio 3:4)
 * - 4 thumbnails navigation horizontale
 * - Clic thumbnail change image principale
 * - Image par défaut si aucune image
 *
 * Props :
 * - images : Array d'images triées par display_order
 * - productName : Alt text
 */

interface ProductImage {
  id: string;
  url: string;
  is_primary: boolean;
  display_order: number;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Si aucune image, afficher placeholder
  if (!images || images.length === 0) {
    return (
      <div className="space-y-4">
        <div className="relative aspect-[3/4] bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg
              className="mx-auto h-16 w-16 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Aucune image disponible</p>
          </div>
        </div>
      </div>
    );
  }

  const currentImage = images[selectedIndex] || images[0];

  return (
    <div className="space-y-4">
      {/* Image principale - ratio 3:4 comme WestWing */}
      <div className="relative aspect-[3/4] bg-white border border-gray-200 rounded-lg overflow-hidden group">
        <Image
          src={currentImage.url}
          alt={`${productName} - Image ${selectedIndex + 1}`}
          fill
          className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          priority={selectedIndex === 0}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Thumbnails navigation - max 4 visibles */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.slice(0, 4).map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'relative aspect-square border-2 rounded-md overflow-hidden transition-all duration-200',
                index === selectedIndex
                  ? 'border-black ring-2 ring-black ring-offset-2'
                  : 'border-gray-300 hover:border-gray-500 hover:scale-105'
              )}
              aria-label={`Voir image ${index + 1}`}
            >
              <Image
                src={image.url}
                alt={`${productName} - Miniature ${index + 1}`}
                fill
                className="object-cover"
                sizes="100px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Indicateur nombre total d'images si > 4 */}
      {images.length > 4 && (
        <p className="text-sm text-gray-500 text-center">
          {images.length} photos disponibles
        </p>
      )}
    </div>
  );
}
