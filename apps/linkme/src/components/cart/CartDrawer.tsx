'use client';

import Image from 'next/image';
import Link from 'next/link';

import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';

import { useCart } from './CartProvider';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

export function CartDrawer() {
  const {
    items,
    isCartOpen,
    closeCart,
    removeItem,
    updateQuantity,
    totalHT,
    totalTTC,
    totalTVA,
    itemCount,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Panier ({itemCount})
          </h2>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Fermer le panier"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-3">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Votre panier est vide</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map(item => (
                <li
                  key={item.id}
                  className="flex gap-3 p-2.5 bg-gray-50 rounded-lg"
                >
                  {/* Image */}
                  <div className="relative w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-xs line-clamp-2">
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {item.sku}
                    </p>
                    <p className="text-xs font-semibold mt-1">
                      {formatPrice(item.selling_price_ht)} HT
                    </p>

                    {/* Quantité */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="p-0.5 hover:bg-gray-200 rounded"
                        aria-label="Diminuer quantité"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-medium w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="p-0.5 hover:bg-gray-200 rounded"
                        aria-label="Augmenter quantité"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-0.5 hover:bg-red-100 rounded text-red-600 ml-auto"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer avec totaux */}
        {items.length > 0 && (
          <div className="border-t p-3 space-y-3">
            {/* Totaux */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Sous-total HT</span>
                <span>{formatPrice(totalHT)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">TVA (20%)</span>
                <span>{formatPrice(totalTVA)}</span>
              </div>
              <div className="flex justify-between font-semibold text-sm pt-1.5 border-t">
                <span>Total TTC</span>
                <span>{formatPrice(totalTTC)}</span>
              </div>
            </div>

            {/* Bouton Commander */}
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full bg-blue-600 text-white text-center py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
            >
              Commander
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
