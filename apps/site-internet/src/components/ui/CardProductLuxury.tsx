import Image from 'next/image';
import Link from 'next/link';

import { Heart, ShoppingBag } from 'lucide-react';

import { cn } from '@verone/utils';

import { StarRating } from './StarRating';

export interface CardProductLuxuryProps {
  id: string;
  name: string;
  description?: string;
  price?: number | null;
  imageUrl?: string | null;
  href: string;
  className?: string;
  priority?: boolean;
  averageRating?: number;
  reviewCount?: number;
  subcategoryName?: string;
  discountRate?: number;
  publicationDate?: string;
  variantsCount?: number;
  stockStatus?: string | null;
  onAddToCart?: () => void;
  onToggleWishlist?: () => void;
  isInWishlist?: boolean;
}

function isNew(publicationDate?: string): boolean {
  if (!publicationDate) return false;
  const pub = new Date(publicationDate);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return pub >= thirtyDaysAgo;
}

export function CardProductLuxury({
  name,
  description,
  price,
  imageUrl,
  href,
  className,
  priority = false,
  averageRating,
  reviewCount,
  subcategoryName,
  discountRate,
  publicationDate,
  variantsCount,
  stockStatus,
  onAddToCart,
  onToggleWishlist,
  isInWishlist = false,
}: CardProductLuxuryProps) {
  const hasDiscount = discountRate != null && discountRate > 0;
  const originalPrice =
    hasDiscount && price != null && discountRate != null
      ? price / (1 - discountRate / 100)
      : null;
  const showNewBadge = isNew(publicationDate);
  const isOutOfStock = stockStatus === 'out_of_stock';

  return (
    <div
      className={cn(
        'group relative border border-verone-gray-200 hover:shadow-luxury transition-all duration-500',
        className
      )}
    >
      {/* Wishlist heart */}
      {onToggleWishlist && (
        <button
          type="button"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWishlist();
          }}
          className="absolute top-3 right-3 z-10 p-2 bg-verone-white/80 backdrop-blur-sm hover:bg-verone-white transition-colors"
          aria-label={
            isInWishlist ? 'Retirer des favoris' : 'Ajouter aux favoris'
          }
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-colors',
              isInWishlist
                ? 'fill-red-500 text-red-500'
                : 'text-verone-gray-400 hover:text-red-500'
            )}
          />
        </button>
      )}

      <Link href={href} className="block">
        {/* Image Container */}
        <div className="relative bg-verone-gray-50 aspect-square overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className={cn(
                'object-contain p-4 group-hover:scale-105 transition-transform duration-700',
                isOutOfStock && 'opacity-60'
              )}
              priority={priority}
            />
          ) : (
            <div className="w-full h-full bg-verone-gray-200 flex items-center justify-center">
              <p className="text-verone-gray-400 text-sm uppercase tracking-wider">
                Image à venir
              </p>
            </div>
          )}

          {/* Badges top-left */}
          <div className="absolute top-3 left-3 flex items-start gap-1.5 z-10">
            <div className="flex flex-col gap-1.5">
              {isOutOfStock && (
                <span className="px-2 py-0.5 bg-verone-gray-700 text-white text-[10px] font-semibold uppercase tracking-wider">
                  Rupture de stock
                </span>
              )}
              {showNewBadge && !isOutOfStock && (
                <span className="px-2 py-0.5 bg-green-600 text-white text-[10px] font-semibold uppercase tracking-wider">
                  Nouveau
                </span>
              )}
              {hasDiscount && discountRate != null && (
                <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-semibold uppercase tracking-wider">
                  -{Math.round(discountRate)}%
                </span>
              )}
            </div>
            {variantsCount != null && variantsCount > 1 && (
              <span className="px-2 py-0.5 bg-verone-white/90 text-verone-gray-700 text-[10px] font-medium backdrop-blur-sm">
                {variantsCount} variantes
              </span>
            )}
          </div>

          {/* Add to cart overlay */}
          {onAddToCart && !isOutOfStock && (
            <button
              type="button"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                onAddToCart();
              }}
              className="absolute bottom-0 left-0 right-0 py-3 bg-verone-black/90 text-verone-white text-xs font-medium uppercase tracking-wide flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Ajouter
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Category label */}
          {subcategoryName && (
            <p className="text-[10px] text-verone-gray-500 uppercase tracking-widest mb-1">
              {subcategoryName}
            </p>
          )}

          {/* Title Playfair */}
          <h4 className="font-playfair text-xl font-semibold text-verone-black mb-1 group-hover:text-verone-gray-700 transition-colors duration-300">
            {name}
          </h4>

          {/* Star Rating */}
          {averageRating != null && reviewCount != null && reviewCount > 0 && (
            <div className="mb-2">
              <StarRating
                average={averageRating}
                count={reviewCount}
                size="sm"
              />
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-sm text-verone-gray-600 mb-4 leading-relaxed line-clamp-2">
              {description}
            </p>
          )}

          {/* Footer: Price + CTA */}
          <div className="flex justify-between items-center">
            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  'text-lg font-semibold',
                  hasDiscount ? 'text-red-600' : 'text-verone-black'
                )}
              >
                {price != null && price > 0
                  ? `${price.toFixed(2)} €`
                  : 'Sur demande'}
              </span>
              {hasDiscount && originalPrice != null && (
                <span className="text-sm text-verone-gray-400 line-through">
                  {originalPrice.toFixed(2)} €
                </span>
              )}
            </div>

            {/* CTA Ghost */}
            <span className="text-xs uppercase tracking-wide text-verone-gray-600 group-hover:text-verone-black transition-colors duration-300">
              Découvrir →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
