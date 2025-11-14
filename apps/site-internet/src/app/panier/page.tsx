'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useCartStore } from '@/store/cart-store';

export default function PanierPage() {
  const items = useCartStore(state => state.items);
  const itemsCount = useCartStore(state => state.itemsCount);
  const subtotal = useCartStore(state => state.subtotal);
  const total = useCartStore(state => state.total);
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const removeItem = useCartStore(state => state.removeItem);

  // État vide
  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 text-center">
        <h1 className="font-playfair text-4xl font-bold text-verone-black mb-6">
          Votre panier est vide
        </h1>
        <p className="text-verone-gray-600 mb-8 text-lg">
          Découvrez notre sélection de mobilier haut de gamme
        </p>
        <Link
          href="/catalogue"
          className="inline-block px-8 py-4 bg-verone-black text-white font-semibold uppercase tracking-wider hover:bg-verone-gray-800 transition-colors duration-300"
        >
          Voir le catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
      <h1 className="font-playfair text-4xl font-bold text-verone-black mb-2">
        Mon Panier
      </h1>
      <p className="text-verone-gray-600 mb-12">
        {itemsCount} article{itemsCount > 1 ? 's' : ''}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Liste produits */}
        <div className="lg:col-span-2 space-y-6">
          {items.map(item => (
            <div
              key={`${item.productId}-${item.variantId || 'default'}`}
              className="border border-verone-gray-200 p-6 flex gap-6"
            >
              {/* Image */}
              <Link
                href={`/produit/${item.productSlug}`}
                className="relative w-32 h-32 bg-white border border-verone-gray-200 flex-shrink-0"
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.productName}
                    fill
                    sizes="128px"
                    className="object-contain p-2"
                  />
                ) : (
                  <div className="w-full h-full bg-verone-gray-100 flex items-center justify-center">
                    <span className="text-xs text-verone-gray-400">
                      Pas d'image
                    </span>
                  </div>
                )}
              </Link>

              {/* Infos */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <Link
                    href={`/produit/${item.productSlug}`}
                    className="font-playfair text-xl font-semibold text-verone-black hover:text-verone-gray-700 transition-colors"
                  >
                    {item.productName}
                  </Link>
                  {item.variantName && (
                    <p className="text-sm text-verone-gray-600 mt-1">
                      {item.variantName}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-6 mt-4">
                  {/* Quantité */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          item.quantity - 1,
                          item.variantId
                        )
                      }
                      disabled={item.quantity <= 1}
                      className="w-8 h-8 border border-verone-gray-300 hover:bg-verone-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e =>
                        updateQuantity(
                          item.productId,
                          parseInt(e.target.value) || 1,
                          item.variantId
                        )
                      }
                      min="1"
                      max={item.maxStock}
                      className="w-16 h-8 border border-verone-gray-300 text-center text-sm focus:outline-none focus:ring-2 focus:ring-verone-black"
                    />
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          item.quantity + 1,
                          item.variantId
                        )
                      }
                      disabled={item.quantity >= item.maxStock}
                      className="w-8 h-8 border border-verone-gray-300 hover:bg-verone-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>

                  {/* Supprimer */}
                  <button
                    onClick={() =>
                      removeItem(item.productId, item.variantId)
                    }
                    className="text-sm text-verone-gray-600 hover:text-red-600 transition-colors underline"
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              {/* Prix */}
              <div className="text-right">
                <div className="font-bold text-xl text-verone-black">
                  {((item.price * item.quantity) / 100).toFixed(2)} €
                </div>
                <div className="text-sm text-verone-gray-500 mt-1">
                  {(item.price / 100).toFixed(2)} € × {item.quantity}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Résumé */}
        <div className="lg:col-span-1">
          <div className="border border-verone-gray-200 p-8 sticky top-24">
            <h2 className="font-playfair text-2xl font-bold text-verone-black mb-6">
              Récapitulatif
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-verone-gray-700">
                <span>Sous-total ({itemsCount} article{itemsCount > 1 ? 's' : ''})</span>
                <span className="font-semibold">
                  {(subtotal / 100).toFixed(2)} €
                </span>
              </div>
              <div className="flex justify-between text-verone-gray-700">
                <span>Livraison</span>
                <span className="font-semibold">Calculée au checkout</span>
              </div>
            </div>

            <div className="border-t border-verone-gray-200 pt-4 mb-8">
              <div className="flex justify-between text-xl font-bold text-verone-black">
                <span>Total</span>
                <span>{(total / 100).toFixed(2)} €</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="block w-full bg-verone-black text-white text-center py-4 font-semibold uppercase tracking-wider hover:bg-verone-gray-800 transition-colors duration-300 mb-4"
            >
              Passer commande
            </Link>

            <Link
              href="/catalogue"
              className="block w-full text-center py-3 text-verone-gray-600 hover:text-verone-black transition-colors text-sm"
            >
              Continuer mes achats
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
