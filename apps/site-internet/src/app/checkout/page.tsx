'use client';

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { formatPrice } from '@verone/utils';
import { ArrowLeft, Lock, ShoppingCart, Truck } from 'lucide-react';

import { useCart } from '@/contexts/CartContext';

export default function CheckoutPage() {
  const { items, itemCount, subtotal } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect to cart if empty
  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12 text-center">
        <ShoppingCart className="h-12 w-12 text-verone-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-playfair font-bold text-verone-black mb-2">
          Votre panier est vide
        </h1>
        <p className="text-verone-gray-500 mb-6">
          Ajoutez des articles avant de passer commande.
        </p>
        <Link
          href="/catalogue"
          className="inline-block bg-verone-black text-verone-white px-6 py-3 rounded-lg font-medium hover:bg-verone-gray-800 transition-colors text-sm"
        >
          Voir le catalogue
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            product_id: item.product_id,
            name: item.name,
            price_ttc: item.price_ttc,
            quantity: item.quantity,
            include_assembly: item.include_assembly,
            assembly_price: item.assembly_price,
            eco_participation: item.eco_participation,
          })),
          customer: {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            postalCode: formData.get('postalCode'),
            city: formData.get('city'),
          },
        }),
      });

      const data = (await response.json()) as {
        url?: string;
        error?: string;
      };

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('[Checkout] No redirect URL:', data.error);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('[Checkout] Submit failed:', error);
      setIsSubmitting(false);
    }
  };

  const shippingEstimate = subtotal >= 500 ? 0 : 49;
  const total = subtotal + shippingEstimate;

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
      <Link
        href="/panier"
        className="inline-flex items-center gap-2 text-sm text-verone-gray-500 hover:text-verone-black transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au panier
      </Link>

      <h1 className="text-3xl font-playfair font-bold text-verone-black mb-8">
        Finaliser ma commande
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form - 3 columns */}
        <div className="lg:col-span-3">
          <form
            onSubmit={e => {
              void handleSubmit(e).catch(error => {
                console.error('[Checkout] Form submit failed:', error);
              });
            }}
            className="space-y-6"
          >
            {/* Shipping info */}
            <div className="border border-verone-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-verone-black mb-4">
                Informations de livraison
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-verone-gray-700 mb-1.5"
                    >
                      Prénom
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      autoComplete="given-name"
                      className="w-full px-4 py-3 border border-verone-gray-300 rounded-lg focus:ring-2 focus:ring-verone-black focus:border-transparent outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-verone-gray-700 mb-1.5"
                    >
                      Nom
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      autoComplete="family-name"
                      className="w-full px-4 py-3 border border-verone-gray-300 rounded-lg focus:ring-2 focus:ring-verone-black focus:border-transparent outline-none transition-all text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-verone-gray-700 mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="w-full px-4 py-3 border border-verone-gray-300 rounded-lg focus:ring-2 focus:ring-verone-black focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-verone-gray-700 mb-1.5"
                  >
                    Téléphone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    className="w-full px-4 py-3 border border-verone-gray-300 rounded-lg focus:ring-2 focus:ring-verone-black focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-verone-gray-700 mb-1.5"
                  >
                    Adresse
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    required
                    autoComplete="street-address"
                    className="w-full px-4 py-3 border border-verone-gray-300 rounded-lg focus:ring-2 focus:ring-verone-black focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="postalCode"
                      className="block text-sm font-medium text-verone-gray-700 mb-1.5"
                    >
                      Code postal
                    </label>
                    <input
                      id="postalCode"
                      name="postalCode"
                      type="text"
                      required
                      autoComplete="postal-code"
                      className="w-full px-4 py-3 border border-verone-gray-300 rounded-lg focus:ring-2 focus:ring-verone-black focus:border-transparent outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="city"
                      className="block text-sm font-medium text-verone-gray-700 mb-1.5"
                    >
                      Ville
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      required
                      autoComplete="address-level2"
                      className="w-full px-4 py-3 border border-verone-gray-300 rounded-lg focus:ring-2 focus:ring-verone-black focus:border-transparent outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-verone-black text-verone-white py-4 rounded-lg font-medium hover:bg-verone-gray-800 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="h-4 w-4" />
              {isSubmitting
                ? 'Redirection vers le paiement...'
                : `Payer ${formatPrice(total)}`}
            </button>

            <p className="text-xs text-verone-gray-400 text-center">
              Paiement sécurisé par Stripe. Vos données bancaires ne sont jamais
              stockées sur nos serveurs.
            </p>
          </form>
        </div>

        {/* Order summary - 2 columns */}
        <div className="lg:col-span-2">
          <div className="border border-verone-gray-200 rounded-lg p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-verone-black mb-4">
              Récapitulatif ({itemCount} article{itemCount > 1 ? 's' : ''})
            </h2>

            {/* Items */}
            <div className="space-y-4 mb-6">
              {items.map(item => {
                const itemTotal =
                  (item.price_ttc +
                    item.eco_participation +
                    (item.include_assembly ? item.assembly_price : 0)) *
                  item.quantity;
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-verone-gray-50 flex-shrink-0">
                      {item.primary_image_url ? (
                        <Image
                          src={item.primary_image_url}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-contain p-1"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ShoppingCart className="h-4 w-4 text-verone-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-verone-black truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-verone-gray-500">
                        Qté : {item.quantity}
                      </p>
                      {item.include_assembly && (
                        <p className="text-xs text-blue-600">+ Montage</p>
                      )}
                    </div>
                    <p className="text-sm font-medium text-verone-black">
                      {formatPrice(itemTotal)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="space-y-3 border-t border-verone-gray-100 pt-4">
              <div className="flex justify-between text-sm text-verone-gray-600">
                <span>Sous-total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-verone-gray-600">
                <span className="flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" />
                  Livraison
                </span>
                <span>
                  {shippingEstimate === 0 ? (
                    <span className="text-green-600 font-medium">Offerte</span>
                  ) : (
                    formatPrice(shippingEstimate)
                  )}
                </span>
              </div>
              {shippingEstimate > 0 && (
                <p className="text-xs text-verone-gray-400">
                  Livraison offerte dès 500 &euro;
                </p>
              )}
              <div className="border-t border-verone-gray-100 pt-3 flex justify-between text-lg font-bold text-verone-black">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
