'use client';

import { cn } from '@verone/utils';
import { Package, Plus, Minus, Trash2 } from 'lucide-react';
import type { CartItem } from '../../hooks/use-create-linkme-order-form';

interface CartTotals {
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  totalRetrocession: number;
}

interface CartSectionProps {
  cart: CartItem[];
  cartTotals: CartTotals;
  updateQuantity: (itemId: string, delta: number) => void;
  updateUnitPrice: (itemId: string, price: number) => void;
  updateRetrocessionRate: (itemId: string, rate: number) => void;
  updateCommissionRate: (itemId: string, rate: number) => void;
  removeFromCart: (itemId: string) => void;
}

export function CartSection({
  cart,
  cartTotals,
  updateQuantity,
  updateUnitPrice,
  updateRetrocessionRate,
  updateCommissionRate,
  removeFromCart,
}: CartSectionProps) {
  return (
    <div className="space-y-3 border-t pt-6">
      <p className="text-sm font-medium text-gray-700">
        Panier ({cart.length} produit{cart.length > 1 ? 's' : ''})
      </p>
      <div className="space-y-2">
        {cart.map(item => (
          <div
            key={item.id}
            className={cn(
              'p-3 rounded-lg',
              item.is_affiliate_product
                ? 'bg-blue-50 border border-blue-200'
                : 'bg-gray-50'
            )}
          >
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {item.product_name}
                  {item.is_affiliate_product && (
                    <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                      Produit affilié
                    </span>
                  )}
                </p>
                {item.is_affiliate_product ? (
                  <>
                    <p className="text-xs text-gray-500">
                      {item.unit_price_ht.toFixed(2)}€ HT × {item.quantity} ={' '}
                      {(item.unit_price_ht * item.quantity).toFixed(2)}€ HT
                    </p>
                    <p className="text-xs text-blue-600">
                      Commission Verone:{' '}
                      {(item.affiliate_commission_rate * 100).toFixed(0)}% ={' '}
                      {(
                        item.unit_price_ht *
                        item.quantity *
                        item.affiliate_commission_rate
                      ).toFixed(2)}
                      €
                    </p>
                    <p className="text-xs text-green-600">
                      Revenu net affilié:{' '}
                      {(
                        item.unit_price_ht *
                        item.quantity *
                        (1 - item.affiliate_commission_rate)
                      ).toFixed(2)}
                      €
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gray-500">
                      {item.unit_price_ht.toFixed(2)}€ HT × {item.quantity} ={' '}
                      {(item.unit_price_ht * item.quantity).toFixed(2)}€ HT
                    </p>
                    <p className="text-xs text-orange-600">
                      Marge:{' '}
                      {(item.base_price_ht > 0
                        ? ((item.unit_price_ht - item.base_price_ht) /
                            item.base_price_ht) *
                          100
                        : 0
                      ).toFixed(1)}
                      % (
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
                            updateUnitPrice(
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
                            updateRetrocessionRate(
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
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={item.quantity}
                  onChange={e => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val > 0) {
                      updateQuantity(item.id, val - item.quantity);
                    }
                  }}
                  className="w-16 h-8 text-center text-sm font-medium border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-1 hover:bg-red-100 rounded text-red-600 ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {item.is_affiliate_product && (
              <div className="mt-2 pt-2 border-t border-blue-200 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600 whitespace-nowrap">
                    Prix vente HT
                  </label>
                  <input
                    type="number"
                    value={item.unit_price_ht}
                    onChange={e =>
                      updateUnitPrice(item.id, parseFloat(e.target.value) || 0)
                    }
                    min={0}
                    step={0.01}
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-500">€</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600 whitespace-nowrap">
                    Commission
                  </label>
                  <input
                    type="number"
                    value={Math.round(item.affiliate_commission_rate * 100)}
                    onChange={e =>
                      updateCommissionRate(
                        item.id,
                        parseFloat(e.target.value) || 0
                      )
                    }
                    min={0}
                    max={100}
                    step={1}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

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
          <span>Marge affilié HT</span>
          <span>-{cartTotals.totalRetrocession.toFixed(2)}€</span>
        </div>
      </div>
    </div>
  );
}
