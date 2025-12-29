'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  ArrowLeft,
  Lock,
  Package,
  CreditCard,
  Truck,
  User,
  AlertCircle,
} from 'lucide-react';

import { useCart } from '../../../components/cart/CartProvider';
import type { LinkMeOrderData } from '../../../lib/revolut';

// Déclaration du type pour le SDK Revolut (chargé dynamiquement)
declare global {
  interface Window {
    RevolutCheckout?: (
      token: string,
      mode: 'sandbox' | 'prod'
    ) => Promise<RevolutCheckoutInstance>;
  }
}

interface RevolutCheckoutInstance {
  payWithPopup: (options: {
    locale?: string;
    email?: string;
    name?: string;
    phone?: string;
    billingAddress?: {
      countryCode: string;
      postcode: string;
      city: string;
      streetLine1: string;
      streetLine2?: string;
    };
    onSuccess: () => void;
    onError: (error: { type: string; message: string }) => void;
    onCancel?: () => void;
  }) => void;
  destroy: () => void;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

interface CheckoutFormData {
  // Contact
  email: string;
  phone: string;
  // Shipping
  firstName: string;
  lastName: string;
  company: string;
  address: string;
  addressComplement: string;
  postalCode: string;
  city: string;
  country: string;
  countryCode: string;
  // Billing (if different)
  useSameForBilling: boolean;
  billingFirstName: string;
  billingLastName: string;
  billingCompany: string;
  billingAddress: string;
  billingAddressComplement: string;
  billingPostalCode: string;
  billingCity: string;
  billingCountry: string;
  billingCountryCode: string;
}

const COUNTRY_CODES: Record<string, string> = {
  France: 'FR',
  Belgique: 'BE',
  Suisse: 'CH',
  Luxembourg: 'LU',
};

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    affiliateId,
    selectionId,
    totalHT,
    totalTVA,
    totalTTC,
    itemCount,
    clearCart,
  } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [revolutLoaded, setRevolutLoaded] = useState(false);
  const revolutInstanceRef = useRef<RevolutCheckoutInstance | null>(null);

  const [formData, setFormData] = useState<CheckoutFormData>({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    company: '',
    address: '',
    addressComplement: '',
    postalCode: '',
    city: '',
    country: 'France',
    countryCode: 'FR',
    useSameForBilling: true,
    billingFirstName: '',
    billingLastName: '',
    billingCompany: '',
    billingAddress: '',
    billingAddressComplement: '',
    billingPostalCode: '',
    billingCity: '',
    billingCountry: 'France',
    billingCountryCode: 'FR',
  });

  const shippingCost = 0;
  const finalTotal = totalTTC + shippingCost;

  // Charger le SDK Revolut
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.RevolutCheckout) {
      const script = document.createElement('script');
      script.src = 'https://merchant.revolut.com/embed.js';
      script.async = true;
      script.onload = () => {
        setRevolutLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Revolut SDK');
        setPaymentError('Impossible de charger le module de paiement');
      };
      document.head.appendChild(script);
    } else if (window.RevolutCheckout) {
      setRevolutLoaded(true);
    }

    return () => {
      if (revolutInstanceRef.current) {
        revolutInstanceRef.current.destroy();
      }
    };
  }, []);

  const updateFormData = useCallback(
    (field: keyof CheckoutFormData, value: string | boolean) => {
      setFormData(prev => {
        const updated = { ...prev, [field]: value };
        // Mettre à jour le code pays si le pays change
        if (field === 'country' && typeof value === 'string') {
          updated.countryCode = COUNTRY_CODES[value] || 'FR';
        }
        if (field === 'billingCountry' && typeof value === 'string') {
          updated.billingCountryCode = COUNTRY_CODES[value] || 'FR';
        }
        return updated;
      });
    },
    []
  );

  const validateForm = (): boolean => {
    if (!formData.email || !formData.phone) {
      setPaymentError('Veuillez remplir vos informations de contact');
      return false;
    }
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.address ||
      !formData.postalCode ||
      !formData.city
    ) {
      setPaymentError('Veuillez remplir votre adresse de livraison');
      return false;
    }
    if (!formData.useSameForBilling) {
      if (
        !formData.billingFirstName ||
        !formData.billingLastName ||
        !formData.billingAddress ||
        !formData.billingPostalCode ||
        !formData.billingCity
      ) {
        setPaymentError('Veuillez remplir votre adresse de facturation');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (!validateForm()) return;

    if (!revolutLoaded || !window.RevolutCheckout) {
      setPaymentError(
        "Le module de paiement n'est pas encore chargé. Veuillez réessayer."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Préparer les données de commande
      const orderData: LinkMeOrderData = {
        customer: {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: {
            streetLine1: formData.address,
            streetLine2: formData.addressComplement || undefined,
            city: formData.city,
            postcode: formData.postalCode,
            countryCode: formData.countryCode,
          },
        },
        items: items.map(item => ({
          product_id: item.product_id,
          selection_item_id: item.selection_item_id,
          name: item.name,
          quantity: item.quantity,
          unit_price_ht: item.selling_price_ht,
          total_price_ht: item.selling_price_ht * item.quantity,
        })),
        affiliate_id: affiliateId || '',
        selection_id: selectionId || '',
        total_ht: totalHT,
        total_ttc: totalTTC,
        total_tva: totalTVA,
      };

      // Créer la commande Revolut via notre API
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!result.success || !result.token) {
        throw new Error(result.error || 'Échec de création de la commande');
      }

      // Déterminer le mode (sandbox ou prod) via variable d'environnement
      const mode =
        process.env.NEXT_PUBLIC_REVOLUT_ENVIRONMENT === 'prod'
          ? 'prod'
          : 'sandbox';

      // Initialiser Revolut Checkout avec le token
      const instance = await window.RevolutCheckout(result.token, mode);
      revolutInstanceRef.current = instance;

      // Adresse de facturation
      const billingAddress = formData.useSameForBilling
        ? {
            countryCode: formData.countryCode,
            postcode: formData.postalCode,
            city: formData.city,
            streetLine1: formData.address,
            streetLine2: formData.addressComplement || undefined,
          }
        : {
            countryCode: formData.billingCountryCode,
            postcode: formData.billingPostalCode,
            city: formData.billingCity,
            streetLine1: formData.billingAddress,
            streetLine2: formData.billingAddressComplement || undefined,
          };

      // Ouvrir le popup de paiement
      instance.payWithPopup({
        locale: 'fr',
        email: formData.email,
        name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        billingAddress,
        onSuccess: () => {
          // Paiement réussi
          clearCart();
          router.push(`/confirmation?order=${result.order_ref}`);
        },
        onError: error => {
          console.error('Payment error:', error);
          setPaymentError(
            error.message || 'Le paiement a échoué. Veuillez réessayer.'
          );
          setIsSubmitting(false);
        },
        onCancel: () => {
          setIsSubmitting(false);
        },
      });
    } catch (error) {
      console.error('Checkout error:', error);
      setPaymentError(
        error instanceof Error ? error.message : 'Une erreur est survenue'
      );
      setIsSubmitting(false);
    }
  };

  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Votre panier est vide
        </h1>
        <p className="text-gray-600 mb-6 text-sm">
          Ajoutez des produits à votre panier pour passer commande.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm"
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
          <div className="flex items-center justify-between">
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au panier
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Lock className="h-4 w-4" />
              Paiement sécurisé
            </div>
          </div>
        </div>
      </div>

      {/* Steps Progress */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-blue-600 font-medium">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Informations</span>
            </div>
            <div className="w-8 h-px bg-blue-600" />
            <div className="flex items-center gap-2 text-blue-600 font-medium">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Livraison</span>
            </div>
            <div className="w-8 h-px bg-blue-600" />
            <div className="flex items-center gap-2 text-blue-600 font-medium">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Paiement</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Error Message */}
        {paymentError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium text-sm">
                Erreur de paiement
              </p>
              <p className="text-red-600 text-xs">{paymentError}</p>
            </div>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          {/* Checkout Form */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Contact Information */}
              <div className="bg-white rounded-lg border p-4">
                <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informations de contact
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => updateFormData('email', e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="votre@email.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={e => updateFormData('phone', e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-lg border p-4">
                <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Adresse de livraison
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={e =>
                        updateFormData('firstName', e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={e => updateFormData('lastName', e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Société (optionnel)
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={e => updateFormData('company', e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Adresse *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={e => updateFormData('address', e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Numéro et nom de rue"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Complément d'adresse
                    </label>
                    <input
                      type="text"
                      value={formData.addressComplement}
                      onChange={e =>
                        updateFormData('addressComplement', e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Bâtiment, étage, code..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Code postal *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.postalCode}
                      onChange={e =>
                        updateFormData('postalCode', e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Ville *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={e => updateFormData('city', e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Pays
                    </label>
                    <select
                      value={formData.country}
                      onChange={e => updateFormData('country', e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="France">France</option>
                      <option value="Belgique">Belgique</option>
                      <option value="Suisse">Suisse</option>
                      <option value="Luxembourg">Luxembourg</option>
                    </select>
                  </div>
                </div>

                {/* Same billing address checkbox */}
                <div className="mt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.useSameForBilling}
                      onChange={e =>
                        updateFormData('useSameForBilling', e.target.checked)
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-700">
                      Utiliser la même adresse pour la facturation
                    </span>
                  </label>
                </div>
              </div>

              {/* Billing Address (if different) */}
              {!formData.useSameForBilling && (
                <div className="bg-white rounded-lg border p-4">
                  <h2 className="text-base font-bold text-gray-900 mb-3">
                    Adresse de facturation
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.billingFirstName}
                        onChange={e =>
                          updateFormData('billingFirstName', e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Nom *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.billingLastName}
                        onChange={e =>
                          updateFormData('billingLastName', e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Société (optionnel)
                      </label>
                      <input
                        type="text"
                        value={formData.billingCompany}
                        onChange={e =>
                          updateFormData('billingCompany', e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Adresse *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.billingAddress}
                        onChange={e =>
                          updateFormData('billingAddress', e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Complément d'adresse
                      </label>
                      <input
                        type="text"
                        value={formData.billingAddressComplement}
                        onChange={e =>
                          updateFormData(
                            'billingAddressComplement',
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Code postal *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.billingPostalCode}
                        onChange={e =>
                          updateFormData('billingPostalCode', e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Ville *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.billingCity}
                        onChange={e =>
                          updateFormData('billingCity', e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Pays
                      </label>
                      <select
                        value={formData.billingCountry}
                        onChange={e =>
                          updateFormData('billingCountry', e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="France">France</option>
                        <option value="Belgique">Belgique</option>
                        <option value="Suisse">Suisse</option>
                        <option value="Luxembourg">Luxembourg</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Section */}
              <div className="bg-white rounded-lg border p-4">
                <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Paiement sécurisé
                </h2>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900 text-sm">
                        Paiement par carte bancaire
                      </p>
                      <p className="text-xs text-blue-700">
                        Visa, Mastercard, American Express - Sécurisé par
                        Revolut
                      </p>
                    </div>
                  </div>
                </div>
                {!revolutLoaded && (
                  <div className="mt-3 flex items-center gap-2 text-gray-500">
                    <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">
                      Chargement du module de paiement...
                    </span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !revolutLoaded}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Payer {formatPrice(finalTotal)}
                  </>
                )}
              </button>

              <p className="text-[10px] text-gray-500 text-center">
                En confirmant votre commande, vous acceptez nos conditions
                générales de vente. Le paiement est sécurisé par Revolut.
              </p>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5 mt-6 lg:mt-0">
            <div className="bg-white rounded-lg border p-4 sticky top-4">
              <h2 className="text-base font-bold text-gray-900 mb-3">
                Votre commande ({itemCount}{' '}
                {itemCount > 1 ? 'articles' : 'article'})
              </h2>

              {/* Items */}
              <div className="divide-y max-h-64 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="py-2 flex gap-2">
                    <div className="relative w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="h-4 w-4" />
                        </div>
                      )}
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gray-700 text-white text-[10px] rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-gray-500">{item.sku}</p>
                    </div>
                    <p className="text-xs font-medium text-gray-900">
                      {formatPrice(item.selling_price_ht * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t mt-3 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sous-total HT</span>
                  <span>{formatPrice(totalHT)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">TVA (20%)</span>
                  <span>{formatPrice(totalTVA)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Livraison</span>
                  <span className="text-green-600">Gratuite</span>
                </div>
              </div>

              <div className="border-t mt-3 pt-3">
                <div className="flex justify-between text-base font-bold">
                  <span>Total TTC</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
