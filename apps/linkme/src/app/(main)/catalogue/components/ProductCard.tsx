'use client';

/**
 * ProductCard E-commerce - Design Luxe 2026
 * Design spacieux et élégant style showroom haut de gamme
 * SANS bordure - Cartes blanches avec hover effects
 */

import { useState } from 'react';

import Image from 'next/image';

import { Package, Plus, Sparkles, Star } from 'lucide-react';

import type { LinkMeCatalogProduct } from '@/lib/hooks/use-linkme-catalog';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: LinkMeCatalogProduct;
  canAddToSelection: boolean;
  onAddToSelection: () => void;
  showCustomBadge?: boolean;
}

/**
 * Calcule le prix client LinkMe avec commission
 * Formule: prix_vente × (1 + commission_rate / 100)
 */
function calculateCustomerPrice(
  sellingPriceHT: number,
  commissionRate: number | null
): number {
  const commission = commissionRate ?? 0;
  return sellingPriceHT * (1 + commission / 100);
}

/**
 * Formate le prix en euros
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function ProductCard({
  product,
  canAddToSelection,
  onAddToSelection,
  showCustomBadge = false,
}: ProductCardProps): JSX.Element {
  const [isHovered, setIsHovered] = useState(false);
  const displayTitle = product.custom_title || product.name;

  // Prix client calculé = prix vente × (1 + commission%)
  const customerPriceHT = calculateCustomerPrice(
    product.selling_price_ht,
    product.channel_commission_rate
  );

  // Calculer la marge en pourcentage
  const marginPercent = product.channel_commission_rate ?? 0;

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          'bg-white border border-gray-100 rounded-xl overflow-hidden transition-all duration-300',
          'hover:shadow-2xl hover:bg-gray-50/50 hover:scale-[1.02]'
        )}
      >
        {/* Image Container - Carré avec object-contain (style Amazon) */}
        <div className="relative aspect-square overflow-hidden bg-white">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={displayTitle}
              fill
              className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <Package className="h-12 w-12 text-gray-200" />
            </div>
          )}

          {/* Gradient Overlay on Hover */}
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent transition-opacity duration-300',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
          />

          {/* Product Name Overlay on Hover */}
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 p-6 transition-all duration-300',
              isHovered
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            )}
          >
            <h3 className="text-white text-xl font-semibold line-clamp-2">
              {displayTitle}
            </h3>
            <p className="text-white/80 text-sm mt-1">
              {product.category_name}
            </p>
          </div>

          {/* Margin Badge - Top Right */}
          {marginPercent > 0 && (
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
              <span className="text-xs font-medium text-linkme-turquoise">
                {marginPercent}% marge
              </span>
            </div>
          )}

          {/* Featured Badge - Top Left */}
          {product.is_featured && (
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1 bg-linkme-mauve text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
                <Star className="h-3 w-3 fill-current" />
                Vedette
              </span>
            </div>
          )}

          {/* Custom Badge */}
          {showCustomBadge && !product.is_featured && (
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1 bg-linkme-royal text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
                <Sparkles className="h-3 w-3" />
                Sur mesure
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-6 space-y-4">
          {/* Product Name (visible when not hovering) */}
          <div
            className={cn(
              'transition-opacity duration-300',
              isHovered ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'
            )}
          >
            <h3 className="text-xl font-semibold text-linkme-marine mb-1 line-clamp-2">
              {displayTitle}
            </h3>
            <p className="text-sm text-gray-500">{product.category_name}</p>
          </div>

          {/* Pricing */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-linkme-marine">
                {formatPrice(customerPriceHT)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Coût: {formatPrice(product.selling_price_ht)}
              </p>
            </div>

            {/* Add to Selection Button - Appears on Hover */}
            <button
              onClick={onAddToSelection}
              disabled={!canAddToSelection}
              className={cn(
                'px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 shadow-lg whitespace-nowrap',
                isHovered
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4',
                canAddToSelection
                  ? 'bg-linkme-turquoise text-white hover:opacity-90'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
            >
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Ajouter
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ProductListItem - Vue liste
 * Design compact pour affichage en liste
 */
interface ProductListItemProps {
  product: LinkMeCatalogProduct;
  canAddToSelection: boolean;
  onAddToSelection: () => void;
  showCustomBadge?: boolean;
}

export function ProductListItem({
  product,
  canAddToSelection,
  onAddToSelection,
  showCustomBadge = false,
}: ProductListItemProps): JSX.Element {
  const displayTitle = product.custom_title || product.name;

  // Prix client calculé = prix vente × (1 + commission%)
  const customerPriceHT = calculateCustomerPrice(
    product.selling_price_ht,
    product.channel_commission_rate
  );

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors group">
      {/* Image */}
      <div className="w-16 h-16 bg-white border border-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={displayTitle}
            fill
            className="object-contain p-1"
            sizes="64px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <Package className="h-6 w-6 text-gray-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-linkme-marine truncate text-sm group-hover:text-linkme-turquoise transition-colors">
            {displayTitle}
          </h3>
          {showCustomBadge && (
            <span className="inline-flex items-center gap-0.5 bg-linkme-royal/10 text-linkme-royal text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0">
              <Sparkles className="h-2.5 w-2.5" />
              Sur mesure
            </span>
          )}
          {product.is_featured && (
            <span className="inline-flex items-center gap-0.5 bg-linkme-mauve/10 text-linkme-mauve text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0">
              <Star className="h-2.5 w-2.5 fill-current" />
              Vedette
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">
          {product.category_name && (
            <span className="text-gray-400">{product.category_name} • </span>
          )}
          <span className="font-mono text-gray-400">{product.reference}</span>
        </p>
      </div>

      {/* Prix */}
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-linkme-marine">
          {formatPrice(customerPriceHT)}
        </p>
        <p className="text-[10px] text-gray-400">HT</p>
      </div>

      {/* Action */}
      <button
        onClick={onAddToSelection}
        disabled={!canAddToSelection}
        className={cn(
          'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex-shrink-0',
          canAddToSelection
            ? 'bg-linkme-turquoise text-white hover:bg-linkme-turquoise/90 hover:shadow-md'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        )}
      >
        <Plus className="h-3.5 w-3.5" />
        <span className="hidden lg:inline">Ajouter</span>
      </button>
    </div>
  );
}
