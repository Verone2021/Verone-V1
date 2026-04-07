'use client';

import { useState, useEffect } from 'react';

import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { cn } from '@verone/utils';
import { Trash2 } from 'lucide-react';

import { ProductThumbnail } from '@verone/products/components/images/ProductThumbnail';

import type { SelectedProduct } from './types';
import { getPrimaryImage } from './utils';

// ============================================================================
// COMPOSANT - QuantityInput (inline)
// ============================================================================

function QuantityInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
  const [localVal, setLocalVal] = useState(String(value));

  useEffect(() => {
    setLocalVal(String(value));
  }, [value]);

  return (
    <Input
      type="number"
      min="1"
      value={localVal}
      onChange={e => setLocalVal(e.target.value)}
      onBlur={() => {
        const parsed = parseInt(localVal);
        const final = isNaN(parsed) || parsed < 1 ? 1 : parsed;
        setLocalVal(String(final));
        onChange(final);
      }}
      onClick={e => e.stopPropagation()}
      className="w-24 h-7 text-xs"
    />
  );
}

// ============================================================================
// COMPOSANT - SelectedProductCard (EXTERNE pour éviter re-renders)
// ============================================================================

interface SelectedProductCardProps {
  product: SelectedProduct;
  index: number;
  showImages: boolean;
  showQuantity: boolean;
  onRemove: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

export function SelectedProductCard({
  product,
  index,
  showImages,
  showQuantity,
  onRemove,
  onUpdateQuantity,
}: SelectedProductCardProps) {
  const primaryImage = showImages ? getPrimaryImage(product) : null;

  return (
    <div
      className={cn(
        'group flex gap-2 p-3 border rounded-lg',
        'transition-all duration-150',
        'border-[#38ce3c] bg-[#38ce3c]/5'
      )}
    >
      {/* Badge Position */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#844fc1] text-white flex items-center justify-center font-bold text-xs">
        {index + 1}
      </div>

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
        <p className="font-semibold text-sm truncate text-gray-900 mb-0.5 leading-tight">
          {product.name}
        </p>
        <div className="space-y-0.5">
          {product.sku && (
            <p className="text-xs font-mono text-gray-500 leading-tight">
              {product.sku}
            </p>
          )}
          {showQuantity && product.quantity && (
            <div className="flex items-center gap-2">
              <Label className="text-xs text-[#6c7293]">Quantité:</Label>
              <QuantityInput
                value={product.quantity}
                onChange={val => onUpdateQuantity(product.id, val)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bouton Remove */}
      <button
        type="button"
        onClick={() => onRemove(product.id)}
        className={cn(
          'flex-shrink-0 w-9 h-9 rounded-full',
          'flex items-center justify-center',
          'bg-red-50 text-red-600',
          'transition-all duration-150',
          'hover:bg-red-600 hover:text-white hover:scale-110',
          'active:scale-95'
        )}
        title="Retirer ce produit"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
