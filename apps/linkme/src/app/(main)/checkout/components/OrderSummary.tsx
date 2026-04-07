import Image from 'next/image';

import { Package } from 'lucide-react';

import type { CartItem } from '../../../../types';

import { formatPrice } from '../helpers';

interface OrderSummaryProps {
  items: CartItem[];
  itemCount: number;
  totalHT: number;
  totalTVA: number;
  finalTotal: number;
}

export function OrderSummary({
  items,
  itemCount,
  totalHT,
  totalTVA,
  finalTotal,
}: OrderSummaryProps) {
  return (
    <div className="bg-white rounded-lg border p-4 sticky top-4">
      <h2 className="text-base font-bold text-gray-900 mb-3">
        Votre commande ({itemCount} {itemCount > 1 ? 'articles' : 'article'})
      </h2>

      <div className="divide-y max-h-64 overflow-y-auto">
        {items.map(item => (
          <div key={item.id} className="py-2 flex gap-2">
            <div className="relative w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Package className="h-4 w-4" />
                </div>
              )}
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gray-700 text-white text-[10px] rounded-full flex items-center justify-center">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {item.name}
              </p>
              <p className="text-[10px] text-gray-500">{item.sku}</p>
            </div>
            <p className="text-xs font-medium text-gray-900">
              {formatPrice(item.selling_price_ht * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="border-t mt-3 pt-3 space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Sous-total HT</span>
          <span>{formatPrice(totalHT)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">TVA (20%)</span>
          <span>{formatPrice(totalTVA)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Livraison</span>
          <span className="text-green-600">Gratuite</span>
        </div>
      </div>

      <div className="border-t mt-3 pt-3">
        <div className="flex justify-between text-base font-bold">
          <span>Total TTC</span>
          <span>{formatPrice(finalTotal)}</span>
        </div>
      </div>
    </div>
  );
}
