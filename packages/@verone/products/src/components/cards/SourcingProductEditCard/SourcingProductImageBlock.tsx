'use client';

import Image from 'next/image';

import { Camera, Package } from 'lucide-react';

import type { ProductImage, SourcingProduct } from './types';

interface SourcingProductImageBlockProps {
  product: SourcingProduct;
  primaryImage?: ProductImage | null;
  images?: ProductImage[];
  imagesLoading?: boolean;
  onOpenPhotosModal: () => void;
}

export function SourcingProductImageBlock({
  product,
  primaryImage,
  images = [],
  imagesLoading = false,
  onOpenPhotosModal,
}: SourcingProductImageBlockProps) {
  return (
    <div
      className="relative flex-shrink-0 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden cursor-pointer group border border-gray-200"
      onClick={onOpenPhotosModal}
    >
      {primaryImage?.public_url && !imagesLoading ? (
        <Image
          src={primaryImage.public_url}
          alt={primaryImage.alt_text ?? product.name}
          fill
          className="object-contain"
          sizes="128px"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {imagesLoading ? (
            <div className="animate-pulse">
              <Package className="h-10 w-10 text-gray-300" />
            </div>
          ) : (
            <Package className="h-10 w-10 text-gray-400" />
          )}
        </div>
      )}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="text-white text-xs font-medium flex items-center gap-1">
          <Camera className="h-4 w-4" />
          {images.length > 0 ? `${images.length} photo(s)` : 'Ajouter'}
        </div>
      </div>
    </div>
  );
}
