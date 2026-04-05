'use client';

import { Badge } from '@verone/ui';
import { cn } from '@verone/utils';
import { Package, Plus } from 'lucide-react';

import { ProductThumbnail } from '@verone/products/components/images/ProductThumbnail';

import type { ProductData } from './types';
import { getPrimaryImage } from './utils';

// ============================================================================
// COMPOSANT - ProductGridView (vue grille pour produits disponibles)
// ============================================================================

interface ProductGridViewProps {
  products: ProductData[];
  showImages: boolean;
  onAdd: (product: ProductData) => void;
}

export function ProductGridView({
  products,
  showImages,
  onAdd,
}: ProductGridViewProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {products.map(product => {
        const primaryImage = showImages ? getPrimaryImage(product) : null;
        return (
          <div
            key={product.id}
            className={cn(
              'group border rounded-lg overflow-hidden',
              'transition-all duration-150',
              'border-gray-200 bg-white',
              'hover:ring-2 hover:ring-[#3b86d1] hover:shadow-md'
            )}
          >
            {/* Image area */}
            <div className="aspect-square bg-gray-50 relative overflow-hidden">
              {primaryImage ? (
                <ProductThumbnail
                  src={primaryImage}
                  alt={product.name}
                  size="lg"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-12 w-12 text-gray-200" />
                </div>
              )}
              {product.creation_mode === 'sourcing' && (
                <Badge
                  variant="outline"
                  className="absolute top-2 left-2 h-5 text-xs px-1.5 py-0 bg-[#844fc1]/10 border-[#844fc1]/20 text-[#844fc1]"
                >
                  Sourcing
                </Badge>
              )}
            </div>
            {/* Info + button */}
            <div className="p-3">
              <p className="font-semibold text-sm truncate text-gray-900 mb-0.5">
                {product.name}
              </p>
              {product.sku && (
                <p className="text-xs font-mono text-gray-400 truncate mb-2">
                  {product.sku}
                </p>
              )}
              <button
                type="button"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAdd(product);
                }}
                className={cn(
                  'w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium',
                  'bg-[#3b86d1] text-white',
                  'transition-colors duration-150',
                  'hover:bg-[#2d6ba8]',
                  'cursor-pointer'
                )}
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
