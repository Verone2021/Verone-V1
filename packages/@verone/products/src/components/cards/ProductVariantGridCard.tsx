'use client';

import * as React from 'react';

import Image from 'next/image';

import { Package2 } from 'lucide-react';

import { Badge } from '@verone/ui';
import {
  formatStatusForDisplay,
  type ProductStatus,
} from '@/lib/product-status-utils';
import { cn } from '@verone/utils';

interface ProductVariantGridCardProps {
  variant: {
    id: string;
    name: string;
    sku?: string | null;
    selling_price?: number | null;
    price_ht?: number | null;
    status?: string | null;
    primary_image_url?: string | null;
    variant_attributes?: Record<string, string | number> | null;
    is_primary?: boolean;
  };
  onClick?: (variantId: string) => void;
  isCurrentProduct?: boolean;
  className?: string;
}

// Helper: Formater prix compact
function formatPriceCompact(price: number | null | undefined): string {
  if (price === null || price === undefined) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

export function ProductVariantGridCard({
  variant,
  onClick,
  isCurrentProduct = false,
  className,
}: ProductVariantGridCardProps) {
  const price = variant.selling_price ?? variant.price_ht;
  const statusDisplay = variant.status
    ? formatStatusForDisplay(variant.status as ProductStatus)
    : { label: '—', variant: 'secondary' as const };

  // Extraire 2 premiers attributs pour affichage compact
  const attributes = variant.variant_attributes
    ? Object.entries(variant.variant_attributes).slice(0, 2)
    : [];

  const handleClick = () => {
    if (onClick && !isCurrentProduct) {
      onClick(variant.id);
    }
  };

  return (
    <div
      className={cn(
        'group relative border rounded-lg p-2 transition-all duration-150',
        'hover:shadow-md',
        isCurrentProduct
          ? 'border-primary-500 bg-primary-50/50 shadow-sm'
          : 'border-neutral-200 bg-white hover:border-primary-300',
        !isCurrentProduct && onClick && 'cursor-pointer',
        isCurrentProduct && 'ring-2 ring-primary-500 ring-offset-1',
        className
      )}
      onClick={handleClick}
      role={onClick && !isCurrentProduct ? 'button' : undefined}
      tabIndex={onClick && !isCurrentProduct ? 0 : undefined}
      onKeyDown={e => {
        if (
          onClick &&
          !isCurrentProduct &&
          (e.key === 'Enter' || e.key === ' ')
        ) {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-current={isCurrentProduct ? 'true' : undefined}
    >
      {/* Badge "Actuel" si c'est le produit courant */}
      {isCurrentProduct && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge className="text-xs bg-primary-600 text-white shadow-md">
            Actuel
          </Badge>
        </div>
      )}

      {/* Badge "Principal" si variante principale du groupe */}
      {variant.is_primary && !isCurrentProduct && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge className="text-xs bg-purple-600 text-white shadow-md">
            Principal
          </Badge>
        </div>
      )}

      <div className="flex gap-2">
        {/* Image thumbnail 60x60 */}
        <div className="relative w-16 h-16 flex-shrink-0 bg-neutral-50 rounded-md overflow-hidden border border-neutral-100">
          {variant.primary_image_url ? (
            <Image
              src={variant.primary_image_url}
              alt={variant.name}
              fill
              className="object-cover"
              sizes="64px"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package2 className="h-6 w-6 text-neutral-300" />
            </div>
          )}
        </div>

        {/* Infos produit */}
        <div className="flex-1 min-w-0 space-y-0.5">
          {/* Nom */}
          <h4 className="text-xs font-medium text-neutral-900 truncate leading-tight">
            {variant.name}
          </h4>

          {/* SKU */}
          {variant.sku && (
            <p className="text-xs text-neutral-500 font-mono truncate leading-tight">
              {variant.sku}
            </p>
          )}

          {/* Prix */}
          <p
            className={cn(
              'text-sm font-semibold leading-tight',
              price ? 'text-primary-600' : 'text-neutral-400'
            )}
          >
            {formatPriceCompact(price)}
          </p>
        </div>
      </div>

      {/* Attributs variantes (2 max) */}
      {attributes.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {attributes.map(([key, value]) => (
            <span
              key={key}
              className="text-xs text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded truncate max-w-full"
            >
              {key}: <span className="font-medium">{value}</span>
            </span>
          ))}
        </div>
      )}

      {/* Status badge */}
      <div className="mt-1.5">
        <Badge
          variant={statusDisplay.variant}
          className="text-xs px-1.5 py-0.5 font-normal"
        >
          {statusDisplay.label}
        </Badge>
      </div>

      {/* Hover overlay pour navigation */}
      {onClick && !isCurrentProduct && (
        <div className="absolute inset-0 rounded-lg bg-primary-500/0 group-hover:bg-primary-500/5 transition-colors duration-150 pointer-events-none" />
      )}
    </div>
  );
}
