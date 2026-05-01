'use client';

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  CloudflareImage,
} from '@verone/ui';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';

import type { EditableItem } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface ProductsSectionProps {
  items: EditableItem[];
  activeItemsCount: number;
  productsHt: number;
  selectionId: string | null;
  formatPrice: (amount: number) => string;
  updateQuantity: (itemId: string, delta: number) => void;
  setQuantity: (itemId: string, quantity: number) => void;
  toggleDeleteItem: (itemId: string) => void;
  removeNewItem: (productId: string) => void;
  updateItemPrice: (itemId: string, newPrice: number) => void;
  onAddProductOpen: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductsSection({
  items,
  activeItemsCount,
  productsHt,
  selectionId,
  formatPrice,
  updateQuantity,
  setQuantity,
  toggleDeleteItem,
  removeNewItem,
  updateItemPrice,
  onAddProductOpen,
}: ProductsSectionProps) {
  return (
    <AccordionItem
      value="products"
      className="bg-white rounded-xl border shadow-sm"
    >
      <AccordionTrigger className="px-6 py-4 hover:no-underline">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#5DBEBB]/10 rounded-lg">
            <ShoppingBag className="h-5 w-5 text-[#5DBEBB]" />
          </div>
          <div className="text-left">
            <h2 className="text-base font-semibold text-[#183559]">Produits</h2>
            <p className="text-sm text-gray-500">
              {activeItemsCount} article{activeItemsCount > 1 ? 's' : ''} |{' '}
              {formatPrice(productsHt)} HT
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-6">
        <div className="space-y-3">
          {items.map(item => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                item._delete
                  ? 'bg-red-50 border-red-200 opacity-60'
                  : item._isNew
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* Image */}
              <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-gray-200">
                <CloudflareImage
                  cloudflareId={null}
                  fallbackSrc={item.product_image_url}
                  alt={item.product_name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={`font-medium text-sm truncate ${
                      item._delete
                        ? 'line-through text-gray-400'
                        : 'text-[#183559]'
                    }`}
                  >
                    {item.product_name}
                  </p>
                  {item._isNew && (
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-700 border-green-300 text-xs"
                    >
                      Nouveau
                    </Badge>
                  )}
                  {item.is_affiliate_product && (
                    <Badge
                      variant="outline"
                      className="bg-blue-100 text-blue-700 border-blue-300 text-xs"
                    >
                      Produit affilié
                    </Badge>
                  )}
                </div>
                {item.is_affiliate_product && !item._delete ? (
                  <div className="space-y-1 mt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        Prix vente HT :
                      </span>
                      <input
                        type="number"
                        value={item.unit_price_ht}
                        onChange={e =>
                          updateItemPrice(
                            item._isNew ? item.product_id : item.id,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        min={0}
                        step={0.01}
                        className="w-24 px-2 py-0.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#5DBEBB]"
                      />
                      <span className="text-xs text-gray-500">
                        × {item.quantity} ={' '}
                        <span className="font-medium">
                          {formatPrice(item.unit_price_ht * item.quantity)} HT
                        </span>
                      </span>
                    </div>
                    <p className="text-xs text-blue-600">
                      Commission Verone :{' '}
                      {(item.affiliate_commission_rate * 100).toFixed(2)}% ={' '}
                      {formatPrice(
                        item.unit_price_ht * item.affiliate_commission_rate
                      )}
                    </p>
                    <p className="text-xs text-green-600">
                      Votre revenu net :{' '}
                      {formatPrice(
                        item.unit_price_ht *
                          (1 - item.affiliate_commission_rate)
                      )}{' '}
                      / unité
                    </p>
                    {item.unit_price_ht !== item.original_unit_price_ht && (
                      <p className="text-xs text-[#5DBEBB] font-medium">
                        (prix initial :{' '}
                        {formatPrice(item.original_unit_price_ht)})
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    {item.product_sku && `${item.product_sku} | `}
                    {formatPrice(item.unit_price_ht)} HT x {item.quantity} ={' '}
                    <span className="font-medium">
                      {formatPrice(item.unit_price_ht * item.quantity)} HT
                    </span>
                  </p>
                )}
              </div>

              {/* Quantity controls */}
              {!item._delete && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(
                        item._isNew ? item.product_id : item.id,
                        -1
                      )
                    }
                    disabled={item.quantity <= 1}
                    className="p-1.5 hover:bg-gray-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={e =>
                      setQuantity(
                        item._isNew ? item.product_id : item.id,
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="w-12 text-center text-sm font-semibold text-[#183559] border rounded py-1 focus:outline-none focus:ring-2 focus:ring-[#5DBEBB]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item._isNew ? item.product_id : item.id, 1)
                    }
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Modified indicator */}
              {item.quantity !== item.originalQuantity &&
                !item._delete &&
                !item._isNew && (
                  <span className="text-xs text-[#5DBEBB] font-medium whitespace-nowrap">
                    (etait {item.originalQuantity})
                  </span>
                )}

              {/* Delete/restore button */}
              {item._isNew ? (
                <button
                  type="button"
                  onClick={() => removeNewItem(item.product_id)}
                  className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                  title="Retirer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleDeleteItem(item.id)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    item._delete
                      ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      : 'text-red-500 hover:bg-red-100'
                  }`}
                  title={item._delete ? 'Annuler la suppression' : 'Supprimer'}
                >
                  {item._delete ? (
                    <Plus className="h-4 w-4" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add product button */}
        {selectionId && (
          <button
            type="button"
            onClick={onAddProductOpen}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-[#5DBEBB]/40 rounded-lg text-[#5DBEBB] hover:bg-[#5DBEBB]/5 transition-colors font-medium text-sm"
          >
            <Plus className="h-4 w-4" />
            Ajouter un produit depuis la selection
          </button>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
