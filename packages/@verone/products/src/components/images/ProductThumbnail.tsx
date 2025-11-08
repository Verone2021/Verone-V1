'use client';

import Image from 'next/image';

import { Package } from 'lucide-react';

import { cn } from '@verone/utils';

/**
 * Composant réutilisable pour afficher une miniature de produit
 * Utilise Next.js Image pour l'optimisation automatique
 *
 * @example
 * <ProductThumbnail
 *   src={product.primary_image_url}
 *   alt={product.name}
 *   size="md"
 * />
 */

export interface ProductThumbnailProps {
  /** URL de l'image produit (peut être null) */
  src: string | null | undefined;
  /** Texte alternatif (nom du produit) */
  alt: string;
  /** Taille de la miniature */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Classe CSS additionnelle */
  className?: string;
  /** Priorité de chargement (pour images above the fold) */
  priority?: boolean;
}

const sizeClasses = {
  xs: 'w-8 h-8',
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
};

const sizePx = {
  xs: 32,
  sm: 48,
  md: 64,
  lg: 96,
  xl: 128,
};

export function ProductThumbnail({
  src,
  alt,
  size = 'sm',
  className,
  priority = false,
}: ProductThumbnailProps) {
  const hasImage = !!src;

  return (
    <div
      className={cn(
        'rounded overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0 relative',
        sizeClasses[size],
        className
      )}
    >
      {hasImage ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes={`${sizePx[size]}px`}
          priority={priority}
          onError={e => {
            // Fallback si image ne charge pas
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      ) : null}
      {/* Fallback icon si pas d'image ou erreur */}
      <div
        className={cn(
          'w-full h-full bg-gray-200 flex items-center justify-center absolute inset-0',
          hasImage && 'hidden'
        )}
      >
        <Package
          className={cn(
            'text-gray-400',
            size === 'xs' && 'h-3 w-3',
            size === 'sm' && 'h-4 w-4',
            size === 'md' && 'h-5 w-5',
            size === 'lg' && 'h-6 w-6',
            size === 'xl' && 'h-8 w-8'
          )}
        />
      </div>
    </div>
  );
}
