'use client';

import { useCallback } from 'react';

import { Badge } from '@verone/ui';
import { cn } from '@verone/utils';
import { Plus } from 'lucide-react';

import { ProductThumbnail } from '@verone/products/components/images/ProductThumbnail';

import type { ProductData } from './types';
import { getPrimaryImage } from './utils';

// ============================================================================
// COMPOSANT - AvailableProductCard (EXTERNE pour éviter re-renders)
// ============================================================================

interface AvailableProductCardProps {
  product: ProductData;
  showImages: boolean;
  onAdd: (product: ProductData) => void;
}

export function AvailableProductCard({
  product,
  showImages,
  onAdd,
}: AvailableProductCardProps) {
  const primaryImage = showImages ? getPrimaryImage(product) : null;
  const supplierName = product.supplier
    ? product.supplier.has_different_trade_name && product.supplier.trade_name
      ? product.supplier.trade_name
      : product.supplier.legal_name
    : null;

  // Construire catégorie complète pour tooltip (hover)
  const categoryPath = product.subcategory?.category?.family
    ? [
        product.subcategory.category.family.name,
        product.subcategory.category?.name,
        product.subcategory?.name,
      ]
        .filter(Boolean)
        .join(' > ')
    : null;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.warn('🔥 CLIC Ajouter (externe):', product.name);
      onAdd(product);
    },
    [product, onAdd]
  );

  return (
    <div
      className={cn(
        'group flex gap-2 p-3 border rounded-lg',
        'transition-colors duration-150',
        'border-gray-200 bg-white',
        'hover:ring-2 hover:ring-[#3b86d1] hover:shadow-md'
      )}
      title={categoryPath ?? undefined}
    >
      {/* Image */}
      {showImages && (
        <ProductThumbnail
          src={primaryImage}
          alt={product.name}
          size="sm"
          className="flex-shrink-0"
        />
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="font-semibold text-sm truncate text-gray-900 leading-tight">
            {product.name}
          </p>
          {product.creation_mode === 'sourcing' && (
            <Badge
              variant="outline"
              className="h-4 text-xs px-1.5 py-0 bg-[#844fc1]/10 border-[#844fc1]/20 text-[#844fc1] flex-shrink-0"
            >
              Sourcing
            </Badge>
          )}
        </div>

        <div className="space-y-0.5">
          {product.sku && (
            <p className="text-xs font-mono text-gray-500 leading-tight">
              {product.sku}
            </p>
          )}
          {supplierName && (
            <p className="text-xs text-[#6c7293] truncate leading-tight">
              {supplierName}
            </p>
          )}
        </div>
      </div>

      {/* Bouton Add */}
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'flex-shrink-0 w-9 h-9 rounded-full',
          'flex items-center justify-center',
          'bg-[#3b86d1] text-white',
          'transition-colors duration-150',
          'hover:bg-[#2d6ba8]',
          'cursor-pointer',
          'relative z-10'
        )}
        aria-label={`Ajouter ${product.name}`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
