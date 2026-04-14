'use client';

/**
 * SphereSpotlightModal - Modal de preview pour SphereImageGrid
 *
 * @module SphereSpotlightModal
 * @since 2026-04-14
 */

import Image from 'next/image';
import { X } from 'lucide-react';

import type { SphereImageData } from './sphere-image-grid.types';

interface SphereSpotlightModalProps {
  image: SphereImageData;
  onClose: () => void;
}

export function SphereSpotlightModal({
  image,
  onClose,
}: SphereSpotlightModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
      onClick={onClose}
      style={{ animation: 'fadeIn 0.3s ease-out' }}
    >
      <div
        className="bg-white rounded-xl max-w-md w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.3s ease-out' }}
      >
        <div className="relative aspect-square">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-8 h-8 bg-black bg-opacity-50 rounded-full text-white flex items-center justify-center hover:bg-opacity-70 transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {(image.title ?? image.description) && (
          <div className="p-6">
            {image.title && (
              <h3 className="text-xl font-bold mb-2">{image.title}</h3>
            )}
            {image.description && (
              <p className="text-gray-600">{image.description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
