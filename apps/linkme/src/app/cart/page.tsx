'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, Package } from 'lucide-react';

import { useCart } from '../../components/cart/CartProvider';

const TVA_RATE = 0.20;

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

export default function CartPage() {
  const {
    items,
    affiliateSlug,
    selectionSlug,
    updateQuantity,
    removeItem,
    totalHT,
    totalTVA,
    totalTTC,
    itemCount,
  } = useCart();

  const backLink = affiliateSlug && selectionSlug
    ? `/${affiliateSlug}/${selectionSlug}`
    : '/';

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Votre panier est vide
        </h1>
        <p className="text-gray-600 mb-8">
          Parcourez nos sélections pour découvrir nos produits.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Découvrir nos sélections
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link
            href={backLink}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Continuer mes achats
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Votre panier ({itemCount} {itemCount > 1 ? 'articles' : 'article'})
        </h1>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-lg border divide-y">
              {items.map(item => (
                <div key={item.id} className="p-4 flex gap-4">
                  {/* Product Image */}
                  <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.sku}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatPrice(item.selling_price_ht)} HT / unité
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center border rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-12 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 hover:bg-gray-100"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatPrice(item.selling_price_ht * item.quantity)}
                    </p>
                    <p className="text-sm text-gray-500">HT</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4 mt-8 lg:mt-0">
            <div className="bg-white rounded-lg border p-6 sticky top-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Récapitulatif
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sous-total HT</span>
                  <span className="font-medium">{formatPrice(totalHT)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">TVA (20%)</span>
                  <span className="font-medium">{formatPrice(totalTVA)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Livraison</span>
                  <span>Calculée à l'étape suivante</span>
                </div>
              </div>

              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total TTC</span>
                  <span>{formatPrice(totalTTC)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="mt-6 block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Passer la commande
              </Link>

              <p className="text-xs text-gray-500 text-center mt-4">
                Paiement sécurisé par Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
