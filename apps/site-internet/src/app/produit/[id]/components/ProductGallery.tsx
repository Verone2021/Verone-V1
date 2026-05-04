/**
 * ProductGallery - Galerie photos produit avec lightbox
 * Features:
 * - Image principale aspect-[4/3] avec padding p-4
 * - Miniatures cliquables 6 cols, h-16
 * - Lightbox Dialog fullscreen au clic
 * - Hover zoom 2x (optionnel)
 */

'use client';

import { useState } from 'react';

import { CloudflareImage, Dialog, DialogContent } from '@verone/ui';
import { X } from 'lucide-react';

export interface ProductGalleryImage {
  url: string;
  cloudflareId: string | null;
}

interface ProductGalleryProps {
  images: ProductGalleryImage[]; // images (première = primary)
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [showLightbox, setShowLightbox] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-[500px] max-h-[60vh] bg-gray-200 rounded-lg flex items-center justify-center">
          <span className="text-gray-400">Aucune image</span>
        </div>
      </div>
    );
  }

  const selected = images[selectedIdx] ?? images[0];
  if (!selected) return null;

  return (
    <div className="space-y-4">
      {/* Image principale cliquable pour lightbox */}
      <button
        onClick={() => setShowLightbox(true)}
        className="relative h-[500px] max-h-[60vh] w-full bg-gray-50 rounded-lg overflow-hidden group cursor-zoom-in"
      >
        <CloudflareImage
          cloudflareId={selected.cloudflareId}
          fallbackSrc={selected.url}
          alt={productName}
          fill
          className="object-contain p-4"
          priority
        />
      </button>

      {/* Miniatures cliquables */}
      {images.length > 1 && (
        <div className="grid grid-cols-6 gap-1.5">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setSelectedIdx(index)}
              className={`relative h-16 w-full rounded-lg overflow-hidden border-2 transition-all ${
                selectedIdx === index
                  ? 'border-gray-900 ring-2 ring-gray-200'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
              aria-label={`Voir ${productName} - vue ${index + 1}`}
            >
              <CloudflareImage
                cloudflareId={img.cloudflareId}
                fallbackSrc={img.url}
                alt={`${productName} - vue ${index + 1}`}
                fill
                className="object-contain bg-white p-0.5"
                sizes="(max-width: 768px) 16vw, 8vw"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox fullscreen */}
      <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black/95">
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          <div className="relative w-full h-full flex items-center justify-center p-8">
            <CloudflareImage
              cloudflareId={selected.cloudflareId}
              fallbackSrc={selected.url}
              alt={productName}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 rounded-full px-4 py-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIdx(index)}
                  className={`relative w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
                    selectedIdx === index
                      ? 'border-white'
                      : 'border-transparent hover:border-white/50'
                  }`}
                  aria-label={`Vue ${index + 1}`}
                >
                  <CloudflareImage
                    cloudflareId={img.cloudflareId}
                    fallbackSrc={img.url}
                    alt={`Vue ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
