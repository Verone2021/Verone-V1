import Image from 'next/image';
import { Package, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';

import type { CartSummaryProps } from './types';

export function CartSummary({
  cart,
  cartTotals,
  formatPrice,
  onUpdateQuantity,
  onRemoveItem,
}: CartSummaryProps) {
  return (
    <div className="hidden md:flex w-[35%] bg-gray-50 border-r flex-col">
      <div className="flex-shrink-0 px-4 py-3 border-b bg-white flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Récapitulatif</h3>
          <p className="text-xs text-gray-500">
            {cartTotals.totalItems} article
            {cartTotals.totalItems > 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total TTC</p>
          <p className="font-bold text-gray-900">
            {formatPrice(cartTotals.totalTtc)}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ShoppingCart className="h-12 w-12 mb-2" />
            <p className="text-sm">Panier vide</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr className="text-xs text-gray-500 uppercase">
                <th className="px-3 py-2 text-left font-medium">Produit</th>
                <th className="px-2 py-2 text-center font-medium w-24">Qté</th>
                <th className="px-3 py-2 text-right font-medium w-24">
                  Prix HT
                </th>
                <th className="px-3 py-2 text-right font-medium w-24">Total</th>
                {onRemoveItem && <th className="px-2 py-2 w-10" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cart.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                        {item.product_image ? (
                          <Image
                            src={item.product_image}
                            alt={item.product_name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate text-xs">
                          {item.product_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.product_sku}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    {onUpdateQuantity ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="h-3 w-3 text-gray-600" />
                        </button>
                        <span className="w-6 text-center text-gray-600">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(item.id, item.quantity + 1)
                          }
                          className="p-1 rounded hover:bg-gray-200 transition-colors"
                        >
                          <Plus className="h-3 w-3 text-gray-600" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center text-gray-600">
                        {item.quantity}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600">
                    {formatPrice(item.selling_price_ht)}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-gray-900">
                    {formatPrice(item.selling_price_ttc * item.quantity)}
                  </td>
                  {onRemoveItem && (
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1 rounded hover:bg-red-100 transition-colors text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex-shrink-0 px-4 py-3 border-t bg-white">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>HT: {formatPrice(cartTotals.totalHt)}</span>
          <span>TVA: {formatPrice(cartTotals.totalTva)}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900">
          <span>Total TTC</span>
          <span className="text-lg">{formatPrice(cartTotals.totalTtc)}</span>
        </div>
      </div>
    </div>
  );
}
