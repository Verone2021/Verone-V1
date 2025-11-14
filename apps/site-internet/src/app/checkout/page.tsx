'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  checkoutSchema,
  type CheckoutFormData,
} from '@/lib/validations/checkout';
import { useCartStore } from '@/store/cart-store';

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore(state => state.items);
  const itemsCount = useCartStore(state => state.itemsCount);
  const subtotal = useCartStore(state => state.subtotal);
  const total = useCartStore(state => state.total);
  const clearCart = useCartStore(state => state.clearCart);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect si panier vide
  useEffect(() => {
    if (items.length === 0) {
      router.push('/panier');
    }
  }, [items.length, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      country: 'France',
    },
  });

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);

    try {
      // TODO Phase 5.2: Enregistrer commande dans Supabase
      console.log('Checkout data:', data);
      console.log('Cart items:', items);
      console.log('Total:', total);

      // Simulation API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Clear cart après succès
      clearCart();

      // Redirect vers page confirmation
      router.push('/checkout/confirmation');
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Erreur lors de la validation de la commande');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ne rien afficher si panier vide (redirect en cours)
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
      <h1 className="font-playfair text-4xl font-bold text-verone-black mb-2">
        Finaliser ma commande
      </h1>
      <p className="text-verone-gray-600 mb-12">
        Renseignez vos informations de livraison
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Formulaire Livraison */}
          <div className="lg:col-span-2 space-y-8">
            {/* Informations Personnelles */}
            <div className="border border-verone-gray-200 p-6">
              <h2 className="font-playfair text-2xl font-bold text-verone-black mb-6">
                Informations personnelles
              </h2>

              <div className="space-y-4">
                {/* Nom complet */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-verone-gray-700 mb-2"
                  >
                    Nom complet <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('fullName')}
                    type="text"
                    id="fullName"
                    className={`w-full px-4 py-3 border ${
                      errors.fullName
                        ? 'border-red-500'
                        : 'border-verone-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-verone-black`}
                    placeholder="Jean Dupont"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-verone-gray-700 mb-2"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    className={`w-full px-4 py-3 border ${
                      errors.email
                        ? 'border-red-500'
                        : 'border-verone-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-verone-black`}
                    placeholder="jean.dupont@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Téléphone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-verone-gray-700 mb-2"
                  >
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    id="phone"
                    className={`w-full px-4 py-3 border ${
                      errors.phone
                        ? 'border-red-500'
                        : 'border-verone-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-verone-black`}
                    placeholder="06 12 34 56 78"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Adresse de Livraison */}
            <div className="border border-verone-gray-200 p-6">
              <h2 className="font-playfair text-2xl font-bold text-verone-black mb-6">
                Adresse de livraison
              </h2>

              <div className="space-y-4">
                {/* Adresse ligne 1 */}
                <div>
                  <label
                    htmlFor="addressLine1"
                    className="block text-sm font-medium text-verone-gray-700 mb-2"
                  >
                    Adresse <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('addressLine1')}
                    type="text"
                    id="addressLine1"
                    className={`w-full px-4 py-3 border ${
                      errors.addressLine1
                        ? 'border-red-500'
                        : 'border-verone-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-verone-black`}
                    placeholder="12 rue de la Paix"
                  />
                  {errors.addressLine1 && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.addressLine1.message}
                    </p>
                  )}
                </div>

                {/* Adresse ligne 2 */}
                <div>
                  <label
                    htmlFor="addressLine2"
                    className="block text-sm font-medium text-verone-gray-700 mb-2"
                  >
                    Complément d'adresse (optionnel)
                  </label>
                  <input
                    {...register('addressLine2')}
                    type="text"
                    id="addressLine2"
                    className="w-full px-4 py-3 border border-verone-gray-300 focus:outline-none focus:ring-2 focus:ring-verone-black"
                    placeholder="Appartement 3B, Bâtiment A..."
                  />
                  {errors.addressLine2 && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.addressLine2.message}
                    </p>
                  )}
                </div>

                {/* Code postal + Ville */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="postalCode"
                      className="block text-sm font-medium text-verone-gray-700 mb-2"
                    >
                      Code postal <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('postalCode')}
                      type="text"
                      id="postalCode"
                      className={`w-full px-4 py-3 border ${
                        errors.postalCode
                          ? 'border-red-500'
                          : 'border-verone-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-verone-black`}
                      placeholder="75001"
                    />
                    {errors.postalCode && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.postalCode.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="city"
                      className="block text-sm font-medium text-verone-gray-700 mb-2"
                    >
                      Ville <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('city')}
                      type="text"
                      id="city"
                      className={`w-full px-4 py-3 border ${
                        errors.city
                          ? 'border-red-500'
                          : 'border-verone-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-verone-black`}
                      placeholder="Paris"
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.city.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Pays */}
                <div>
                  <label
                    htmlFor="country"
                    className="block text-sm font-medium text-verone-gray-700 mb-2"
                  >
                    Pays <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('country')}
                    type="text"
                    id="country"
                    className="w-full px-4 py-3 border border-verone-gray-300 bg-verone-gray-50 cursor-not-allowed focus:outline-none"
                    readOnly
                  />
                </div>

                {/* Notes de livraison */}
                <div>
                  <label
                    htmlFor="deliveryNotes"
                    className="block text-sm font-medium text-verone-gray-700 mb-2"
                  >
                    Notes de livraison (optionnel)
                  </label>
                  <textarea
                    {...register('deliveryNotes')}
                    id="deliveryNotes"
                    rows={4}
                    className="w-full px-4 py-3 border border-verone-gray-300 focus:outline-none focus:ring-2 focus:ring-verone-black resize-none"
                    placeholder="Instructions spéciales pour la livraison..."
                  />
                  {errors.deliveryNotes && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.deliveryNotes.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Résumé Commande */}
          <div className="lg:col-span-1">
            <div className="border border-verone-gray-200 p-6 sticky top-24 space-y-6">
              <h2 className="font-playfair text-2xl font-bold text-verone-black">
                Résumé
              </h2>

              {/* Articles */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {items.map(item => (
                  <div
                    key={`${item.productId}-${item.variantId || 'default'}`}
                    className="flex gap-3 pb-4 border-b border-verone-gray-100 last:border-0"
                  >
                    {/* Image miniature */}
                    <div className="relative w-16 h-16 bg-white border border-verone-gray-200 flex-shrink-0">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          sizes="64px"
                          className="object-contain p-1"
                        />
                      ) : (
                        <div className="w-full h-full bg-verone-gray-100" />
                      )}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-verone-black truncate">
                        {item.productName}
                      </p>
                      {item.variantName && (
                        <p className="text-xs text-verone-gray-500 mt-1">
                          {item.variantName}
                        </p>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-verone-gray-600">
                          Qty: {item.quantity}
                        </span>
                        <span className="text-sm font-semibold text-verone-black">
                          {((item.price * item.quantity) / 100).toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totaux */}
              <div className="space-y-3 pt-4 border-t border-verone-gray-200">
                <div className="flex justify-between text-verone-gray-700">
                  <span>
                    Sous-total ({itemsCount} article
                    {itemsCount > 1 ? 's' : ''})
                  </span>
                  <span className="font-semibold">
                    {(subtotal / 100).toFixed(2)} €
                  </span>
                </div>
                <div className="flex justify-between text-verone-gray-700">
                  <span>Livraison</span>
                  <span className="font-semibold text-green-600">Offerte</span>
                </div>
              </div>

              <div className="border-t border-verone-gray-200 pt-4">
                <div className="flex justify-between text-xl font-bold text-verone-black">
                  <span>Total</span>
                  <span>{(total / 100).toFixed(2)} €</span>
                </div>
              </div>

              {/* Bouton Valider */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-verone-black text-white py-4 font-semibold uppercase tracking-wider hover:bg-verone-gray-800 transition-colors duration-300 disabled:bg-verone-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Validation en cours...
                  </>
                ) : (
                  'Valider la commande'
                )}
              </button>

              <Link
                href="/panier"
                className="block w-full text-center py-3 text-verone-gray-600 hover:text-verone-black transition-colors text-sm underline"
              >
                Retour au panier
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
