'use client';

import { formatPrice } from '@verone/utils';
import { ShoppingCart } from 'lucide-react';

interface StickyAddToCartProps {
  productName: string;
  priceTTC: number;
  onAddToCart: () => void;
  isAdded: boolean;
}

export function StickyAddToCart({
  productName,
  priceTTC,
  onAddToCart,
  isAdded,
}: StickyAddToCartProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-verone-white border-t border-verone-gray-200 shadow-lg px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-verone-black truncate">
            {productName}
          </p>
          <p className="text-base font-bold text-verone-black">
            {formatPrice(priceTTC)}
          </p>
        </div>
        <button
          type="button"
          onClick={onAddToCart}
          className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium text-sm transition-colors ${
            isAdded
              ? 'bg-green-600 text-white'
              : 'bg-verone-black text-verone-white hover:bg-verone-gray-800'
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          {isAdded ? 'Ajouté !' : 'Ajouter'}
        </button>
      </div>
    </div>
  );
}
