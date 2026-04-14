'use client';

/**
 * OrderSummaryTable - Tableau récapitulatif de commande
 *
 * @module OrderSummaryTable
 * @since 2026-04-14
 */

import { calculateMargin } from '@verone/utils';
import { FileText, Minus, Plus, Trash2 } from 'lucide-react';

import type { CartItem, CartTotals } from '../types';

interface OrderSummaryTableProps {
  cart: CartItem[];
  cartTotals: CartTotals;
  notes: string;
  onNotesChange: (v: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveFromCart: (id: string) => void;
}

export function OrderSummaryTable({
  cart,
  cartTotals,
  notes,
  onNotesChange,
  onUpdateQuantity,
  onRemoveFromCart,
}: OrderSummaryTableProps) {
  return (
    <div className="bg-white border rounded-xl shadow-sm">
      <div className="px-5 py-4 border-b bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Récapitulatif</h3>
        </div>
      </div>
      <div className="p-4">
        <div className="border rounded-lg overflow-hidden mb-4">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 text-left">Produit</th>
                <th className="px-4 py-3 text-center">Qté</th>
                <th className="px-4 py-3 text-right">Prix HT</th>
                <th className="px-4 py-3 text-right">Total HT</th>
                <th className="px-4 py-3 text-right">Marge</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {cart.map(item => {
                const lineHt = item.quantity * item.unitPriceHt;
                const { gainEuros } = calculateMargin({
                  basePriceHt: item.basePriceHt,
                  marginRate: item.marginRate,
                });
                const lineMargin = gainEuros * item.quantity;
                return (
                  <tr key={item.selectionItemId} className="text-sm">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {item.productName}
                      </p>
                      <p className="text-xs text-gray-500">{item.productSku}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.selectionItemId, -1)
                          }
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.selectionItemId, 1)
                          }
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {item.unitPriceHt.toFixed(2)} €
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {lineHt.toFixed(2)} €
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">
                      +{lineMargin.toFixed(2)} €
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onRemoveFromCart(item.selectionItemId)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-80 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total HT</span>
              <span className="font-medium">
                {cartTotals.totalHt.toFixed(2)} €
              </span>
            </div>
            {cartTotals.tvaDetails.map(tva => (
              <div
                key={tva.rate}
                className="flex justify-between text-gray-500"
              >
                <span>TVA ({(tva.rate * 100).toFixed(0)}%)</span>
                <span>{tva.amount.toFixed(2)} €</span>
              </div>
            ))}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total TTC</span>
              <span>{cartTotals.totalTtc.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-green-600 pt-2 border-t">
              <span className="font-medium">Votre commission</span>
              <span className="font-bold">
                +{cartTotals.totalMargin.toFixed(2)} €
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optionnel)
          </label>
          <textarea
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            placeholder="Instructions spéciales..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
}
