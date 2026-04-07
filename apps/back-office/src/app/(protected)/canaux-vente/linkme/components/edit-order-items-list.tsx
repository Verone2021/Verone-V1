'use client';

import { cn } from '@verone/utils';
import { Package, Plus, Minus, Lock } from 'lucide-react';

import { type EditableItem } from './use-edit-linkme-order';

interface EditOrderItemsListProps {
  items: EditableItem[];
  isEditable: boolean;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onUpdateItemPrice: (itemId: string, newPrice: number) => void;
  onUpdateItemMarginRate: (itemId: string, newRate: number) => void;
}

export function EditOrderItemsList({
  items,
  isEditable,
  onUpdateQuantity,
  onUpdateItemPrice,
  onUpdateItemMarginRate,
}: EditOrderItemsListProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        <Package className="h-4 w-4 inline mr-1" />
        Produits ({items.length})
      </label>
      <div className="space-y-2 max-h-[340px] overflow-y-auto">
        {items.map(item => {
          const priceChanged = item.unit_price_ht !== item.originalUnitPriceHt;
          const qtyChanged = item.quantity !== item.originalQuantity;

          return (
            <div
              key={item.id}
              className={cn(
                'p-3 rounded-lg border',
                priceChanged
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200'
              )}
            >
              {/* Ligne 1: Nom + Quantite */}
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {item.product_name}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    className="p-1 hover:bg-gray-200 rounded"
                    disabled={item.quantity <= 1}
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
                </div>
                {qtyChanged && (
                  <span className="text-xs text-blue-600">
                    (etait {item.originalQuantity})
                  </span>
                )}
              </div>

              {/* Ligne 2: Prix / Marge (editable si draft) */}
              <div className="mt-2 grid grid-cols-4 gap-2 items-end">
                {/* Prix base HT (lecture seule) */}
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">
                    Prix base HT
                  </label>
                  <div className="px-2 py-1.5 bg-gray-100 rounded text-xs text-gray-500 tabular-nums">
                    {item.base_price_ht.toFixed(2)} EUR
                  </div>
                </div>

                {/* Prix vente HT (editable si draft) */}
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">
                    Prix vente HT
                  </label>
                  {isEditable ? (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price_ht}
                      onChange={e =>
                        onUpdateItemPrice(
                          item.id,
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="px-2 py-1.5 bg-gray-100 rounded text-xs text-gray-500 tabular-nums flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      {item.unit_price_ht.toFixed(2)} EUR
                    </div>
                  )}
                </div>

                {/* Marge % (editable si draft) */}
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">
                    Marge %
                  </label>
                  {isEditable ? (
                    <input
                      type="number"
                      min="0"
                      max="99.9"
                      step="0.1"
                      value={item.editableMarginRate}
                      onChange={e =>
                        onUpdateItemMarginRate(
                          item.id,
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="px-2 py-1.5 bg-gray-100 rounded text-xs text-gray-500 tabular-nums flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      {item.editableMarginRate.toFixed(1)}%
                    </div>
                  )}
                </div>

                {/* Total ligne */}
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">
                    Total HT
                  </label>
                  <div className="px-2 py-1.5 bg-gray-100 rounded text-xs font-medium tabular-nums">
                    {(item.unit_price_ht * item.quantity).toFixed(2)} EUR
                  </div>
                </div>
              </div>

              {/* Indicateur de modification prix */}
              {priceChanged && (
                <p className="mt-1 text-[10px] text-blue-600">
                  Prix modifie (etait {item.originalUnitPriceHt.toFixed(2)} EUR)
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
