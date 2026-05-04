'use client';

import { Camera, Package } from 'lucide-react';

import { CloudflareImage } from '@verone/ui';

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
  const cloudflareId = primaryImage?.cloudflare_image_id ?? null;
  const publicUrl = primaryImage?.public_url ?? null;
  const hasImage = !!(cloudflareId ?? publicUrl);
  const imageCount = images.length;

  return (
    <div
      className="relative flex-shrink-0 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden cursor-pointer group border border-gray-200"
      onClick={onOpenPhotosModal}
    >
      {hasImage && !imagesLoading ? (
        <CloudflareImage
          cloudflareId={cloudflareId}
          fallbackSrc={publicUrl}
          alt={primaryImage?.alt_text ?? product.name}
          width={128}
          height={128}
          className="w-full h-full object-contain"
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
          {imageCount > 0 ? `${imageCount} photo(s)` : 'Ajouter'}
        </div>
      </div>
    </div>
  );
}
