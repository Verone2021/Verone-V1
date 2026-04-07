'use client';

import { Package, Minus, Plus, Trash2 } from 'lucide-react';

import type { CartItem } from './types';

interface CartTotals {
  productsHt: number;
  totalFrais: number;
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  totalRetrocession: number;
}

interface CartSectionProps {
  cart: CartItem[];
  cartTotals: CartTotals;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveFromCart: (itemId: string) => void;
  onUpdateUnitPrice: (itemId: string, newPrice: number) => void;
  onUpdateRetrocessionRate: (itemId: string, newRatePercent: number) => void;
}

export function CartSection({
  cart,
  cartTotals,
  onUpdateQuantity,
  onRemoveFromCart,
  onUpdateUnitPrice,
  onUpdateRetrocessionRate,
}: CartSectionProps) {
  if (cart.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">
        Panier ({cart.length} produit{cart.length > 1 ? 's' : ''})
      </p>
      <div className="space-y-2">
        {cart.map(item => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
          >
            <Package className="h-4 w-4 text-gray-400" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {item.product_name}
              </p>
              <p className="text-xs text-gray-500">
                {item.unit_price_ht.toFixed(2)}€ HT × {item.quantity} ={' '}
                {(item.unit_price_ht * item.quantity).toFixed(2)}€ HT
              </p>
              <p className="text-xs text-orange-600">
                Marge: {(item.retrocession_rate * 100).toFixed(0)}% (
                {(
                  (item.unit_price_ht - item.base_price_ht) *
                  item.quantity
                ).toFixed(2)}
                €)
              </p>
              <div className="mt-1 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600 whitespace-nowrap">
                    Prix vente HT
                  </label>
                  <input
                    type="number"
                    value={item.unit_price_ht}
                    onChange={e =>
                      onUpdateUnitPrice(
                        item.id,
                        parseFloat(e.target.value) || 0
                      )
                    }
                    min={0}
                    step={0.01}
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-xs text-gray-500">€</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600 whitespace-nowrap">
                    Marge
                  </label>
                  <input
                    type="number"
                    value={parseFloat(
                      (item.retrocession_rate * 100).toFixed(2)
                    )}
                    onChange={e =>
                      onUpdateRetrocessionRate(
                        item.id,
                        parseFloat(e.target.value) || 0
                      )
                    }
                    min={0}
                    max={100}
                    step={0.5}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateQuantity(item.id, -1)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm font-medium">
                {item.quantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(item.id, 1)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => onRemoveFromCart(item.id)}
                className="p-1 hover:bg-red-100 rounded text-red-600 ml-2"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Totaux */}
      <div className="border-t border-gray-200 pt-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total HT</span>
          <span className="font-medium">{cartTotals.totalHt.toFixed(2)}€</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">TVA</span>
          <span>{cartTotals.totalTva.toFixed(2)}€</span>
        </div>
        <div className="flex justify-between text-sm font-medium">
          <span>Total TTC</span>
          <span>{cartTotals.totalTtc.toFixed(2)}€</span>
        </div>
        <div className="flex justify-between text-sm text-orange-600">
          <span>Marge affilié</span>
          <span>-{cartTotals.totalRetrocession.toFixed(2)}€</span>
        </div>
      </div>
    </div>
  );
}
