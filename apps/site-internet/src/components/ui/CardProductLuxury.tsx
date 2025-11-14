import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@verone/utils';

/**
 * CardProductLuxury - Design System Vérone
 *
 * Card produit e-commerce minimaliste luxury
 * - Image hover scale
 * - Typographie Playfair pour titre
 * - Border subtile
 * - Transitions fluides 700ms
 */

export interface CardProductLuxuryProps {
  id: string;
  name: string;
  description?: string;
  price?: number | null;
  imageUrl?: string | null;
  href: string;
  className?: string;
  priority?: boolean;
}

export function CardProductLuxury({
  name,
  description,
  price,
  imageUrl,
  href,
  className,
  priority = false,
}: CardProductLuxuryProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group block border border-verone-gray-200 hover:shadow-luxury transition-all duration-500',
        className
      )}
    >
      {/* Image Container avec hover scale */}
      <div className="relative bg-verone-gray-100 h-80 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full bg-verone-gray-200 flex items-center justify-center">
            <p className="text-verone-gray-400 text-sm uppercase tracking-wider">
              Image à venir
            </p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title Playfair */}
        <h4 className="font-playfair text-xl font-semibold text-verone-black mb-2 group-hover:text-verone-gray-700 transition-colors duration-300">
          {name}
        </h4>

        {/* Description */}
        {description && (
          <p className="text-sm text-verone-gray-600 mb-4 leading-relaxed line-clamp-2">
            {description}
          </p>
        )}

        {/* Footer: Price + CTA */}
        <div className="flex justify-between items-center">
          {/* Prix ou "Sur demande" */}
          <span className="text-lg font-semibold text-verone-black">
            {price != null && price > 0
              ? `${(price / 100).toFixed(2)} €`
              : 'Sur demande'}
          </span>

          {/* CTA Ghost */}
          <span className="text-xs uppercase tracking-wide text-verone-gray-600 group-hover:text-verone-black transition-colors duration-300">
            Découvrir →
          </span>
        </div>
      </div>
    </Link>
  );
}
