import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@verone/utils';

import {
  ProductVariantSwatches,
  type ProductVariant,
} from './ProductVariantSwatches';

/**
 * CardProductLuxury - Design System Vérone (WestWing-style)
 *
 * Card produit e-commerce minimaliste luxury haute densité
 * - Aspect ratio 3:4 portrait (WestWing)
 * - Grid 6 colonnes desktop, 2 mobile
 * - Image hover scale
 * - Typographie compact (16px)
 * - Content minimaliste (nom + prix uniquement)
 * - Transitions fluides 700ms
 */

export interface CardProductLuxuryProps {
  id: string;
  name: string;
  price?: number | null;
  imageUrl?: string | null;
  href: string;
  className?: string;
  priority?: boolean;
  variants?: ProductVariant[]; // Variantes couleurs/textures
}

export function CardProductLuxury({
  name,
  price,
  imageUrl,
  href,
  className,
  priority = false,
  variants,
}: CardProductLuxuryProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group block border border-verone-gray-200 hover:shadow-luxury transition-all duration-500',
        className
      )}
    >
      {/* Image Container */}
      <div className="relative bg-white aspect-[3/4] overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-2"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full bg-verone-gray-100 flex items-center justify-center">
            <p className="text-verone-gray-400 text-sm uppercase tracking-wider">
              Image à venir
            </p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <h4 className="text-sm font-medium text-verone-black group-hover:text-verone-gray-700 transition-colors duration-300 line-clamp-2">
          {name}
        </h4>

        {/* Prix + Variants Swatches */}
        <div className="flex items-center justify-between gap-2">
          {/* Prix */}
          <span className="text-base font-bold text-verone-black">
            {price != null && price > 0
              ? `${(price / 100).toFixed(2)} €`
              : 'Sur demande'}
          </span>

          {/* Variants Swatches (si présents) */}
          {variants && variants.length > 1 && (
            <ProductVariantSwatches
              variants={variants}
              maxVisible={4}
              size="sm"
            />
          )}
        </div>
      </div>
    </Link>
  );
}
