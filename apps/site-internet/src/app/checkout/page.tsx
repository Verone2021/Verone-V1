'use client';

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { formatPrice } from '@verone/utils';
import {
  ArrowLeft,
  Check,
  CreditCard,
  Lock,
  Package,
  Shield,
  ShoppingCart,
  Truck,
} from 'lucide-react';

import { trackBeginCheckout } from '@/components/analytics/GoogleAnalytics';
import { useCart } from '@/contexts/CartContext';

interface PromoResult {
  valid: boolean;
  code: string;
  name: string;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
}

interface ShippingConfigPublic {
  standard_enabled: boolean;
  standard_label: string;
  standard_price_cents: number;
  express_enabled: boolean;
  express_label: string;
  express_price_cents: number;
  free_shipping_enabled: boolean;
  free_shipping_threshold_cents: number;
  free_shipping_applies_to: 'standard' | 'all';
  shipping_info_message?: string;
}

const CHECKOUT_STEPS = [
  { label: 'Panier', icon: ShoppingCart, done: true },
  { label: 'Livraison', icon: Truck, done: false },
  { label: 'Paiement', icon: CreditCard, done: false },
  { label: 'Confirmation', icon: Check, done: false },
];

export default function CheckoutPage() {
  const { items, itemCount, subtotal } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useSameBillingAddress, setUseSameBillingAddress] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [shippingConfig, setShippingConfig] =
    useState<ShippingConfigPublic | null>(null);
  const hasTrackedCheckout = useRef(false);

  // Fetch shipping config from API
  useEffect(() => {
    void fetch('/api/shipping-config')
      .then(res => res.json() as Promise<ShippingConfigPublic>)
      .then(data => setShippingConfig(data))
      .catch(err => {
        console.error('[Checkout] Failed to fetch shipping config:', err);
      });
  }, []);

  // GA4: track begin_checkout once
  useEffect(() => {
    if (items.length > 0 && !hasTrackedCheckout.current) {
      trackBeginCheckout(subtotal, itemCount);
      hasTrackedCheckout.current = true;
    }
  }, [items.length, subtotal, itemCount]);

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    setPromoResult(null);

    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim(), subtotal }),
      });
      const data = (await res.json()) as PromoResult & { error?: string };

      if (res.ok && data.valid) {
        setPromoResult(data);
      } else {
        setPromoError(data.error ?? 'Code invalide');
      }
    } catch {
      setPromoError('Erreur de connexion');
    }

    setPromoLoading(false);
  };

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

      // Build billing address if different from shipping
      const billingData = useSameBillingAddress
        ? undefined
        : {
            address: (formData.get('billingAddress') as string) || '',
            postalCode: (formData.get('billingPostalCode') as string) || '',
            city: (formData.get('billingCity') as string) || '',
            country: (formData.get('billingCountry') as string) || 'FR',
          };

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
            country: formData.get('country'),
          },
          ...(billingData ? { billing: billingData } : {}),
          ...(promoResult
            ? {
                discount: {
                  code: promoResult.code,
                  amount: promoResult.discount_amount,
                },
              }
            : {}),
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

  const discount = promoResult?.discount_amount ?? 0;

  // Compute shipping estimate from config (Stripe will show the real options)
  const shippingEstimate = (() => {
    if (!shippingConfig) return 0; // Loading state
    if (!shippingConfig.standard_enabled) return 0;
    const subtotalCents = Math.round(subtotal * 100);
    const isFree =
      shippingConfig.free_shipping_enabled &&
      subtotalCents >= shippingConfig.free_shipping_threshold_cents;
    return isFree ? 0 : shippingConfig.standard_price_cents / 100;
  })();
  const total = subtotal - discount + shippingEstimate;

  const inputClass =
    'w-full px-4 py-3 border border-verone-gray-300 rounded-lg focus:ring-2 focus:ring-verone-black focus:border-transparent outline-none transition-all text-sm';

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
      {/* Progress bar */}
      <div className="mb-10">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {CHECKOUT_STEPS.map((step, i) => {
            const isActive = i === 1;
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step.done
                        ? 'bg-green-500 text-white'
                        : isActive
                          ? 'bg-verone-black text-verone-white'
                          : 'bg-verone-gray-200 text-verone-gray-400'
                    }`}
                  >
                    {step.done ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={`text-xs mt-1.5 ${
                      isActive
                        ? 'text-verone-black font-medium'
                        : 'text-verone-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < CHECKOUT_STEPS.length - 1 && (
                  <div
                    className={`w-12 md:w-20 h-0.5 mx-2 mb-5 ${
                      step.done ? 'bg-green-500' : 'bg-verone-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Link
        href="/panier"
        className="inline-flex items-center gap-2 text-sm text-verone-gray-500 hover:text-verone-black transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au panier
      </Link>

      <h1 className="text-3xl font-playfair font-bold text-verone-black mb-8">
        Finaliser ma commande
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
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
                Adresse de livraison
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
                      className={inputClass}
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
                      className={inputClass}
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
                    className={inputClass}
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
                    className={inputClass}
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
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
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
                      className={inputClass}
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
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="country"
                      className="block text-sm font-medium text-verone-gray-700 mb-1.5"
                    >
                      Pays
                    </label>
                    <select
                      id="country"
                      name="country"
                      required
                      autoComplete="country"
                      className={inputClass}
                      defaultValue="FR"
                    >
                      <option value="FR">France</option>
                      <option value="BE">Belgique</option>
                      <option value="CH">Suisse</option>
                      <option value="LU">Luxembourg</option>
                      <option value="MC">Monaco</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing address toggle */}
            <div className="border border-verone-gray-200 rounded-lg p-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSameBillingAddress}
                  onChange={e => setUseSameBillingAddress(e.target.checked)}
                  className="w-4 h-4 accent-verone-black"
                />
                <span className="text-sm text-verone-gray-700">
                  Utiliser la même adresse pour la facturation
                </span>
              </label>

              {!useSameBillingAddress && (
                <div className="mt-4 space-y-4 pt-4 border-t border-verone-gray-100">
                  <h3 className="text-sm font-semibold text-verone-black">
                    Adresse de facturation
                  </h3>
                  <div>
                    <label
                      htmlFor="billingAddress"
                      className="block text-sm font-medium text-verone-gray-700 mb-1.5"
                    >
                      Adresse
                    </label>
                    <input
                      id="billingAddress"
                      name="billingAddress"
                      type="text"
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label
                        htmlFor="billingPostalCode"
                        className="block text-sm font-medium text-verone-gray-700 mb-1.5"
                      >
                        Code postal
                      </label>
                      <input
                        id="billingPostalCode"
                        name="billingPostalCode"
                        type="text"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="billingCity"
                        className="block text-sm font-medium text-verone-gray-700 mb-1.5"
                      >
                        Ville
                      </label>
                      <input
                        id="billingCity"
                        name="billingCity"
                        type="text"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="billingCountry"
                        className="block text-sm font-medium text-verone-gray-700 mb-1.5"
                      >
                        Pays
                      </label>
                      <select
                        id="billingCountry"
                        name="billingCountry"
                        className={inputClass}
                        defaultValue="FR"
                      >
                        <option value="FR">France</option>
                        <option value="BE">Belgique</option>
                        <option value="CH">Suisse</option>
                        <option value="LU">Luxembourg</option>
                        <option value="MC">Monaco</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
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

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-2">
              <div className="flex items-center gap-1.5 text-verone-gray-400">
                <Lock className="h-3.5 w-3.5" />
                <span className="text-xs">Paiement sécurisé SSL</span>
              </div>
              <div className="flex items-center gap-1.5 text-verone-gray-400">
                <CreditCard className="h-3.5 w-3.5" />
                <span className="text-xs">Visa, Mastercard, Amex</span>
              </div>
              <div className="flex items-center gap-1.5 text-verone-gray-400">
                <Shield className="h-3.5 w-3.5" />
                <span className="text-xs">Stripe certifié PCI-DSS</span>
              </div>
              <div className="flex items-center gap-1.5 text-verone-gray-400">
                <Package className="h-3.5 w-3.5" />
                <span className="text-xs">Retours 30 jours</span>
              </div>
            </div>
          </form>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="border border-verone-gray-200 rounded-lg p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-verone-black mb-4">
              Récapitulatif ({itemCount} article{itemCount > 1 ? 's' : ''})
            </h2>

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

            {/* Promo code */}
            <div className="border-t border-verone-gray-100 pt-4 mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Code promo"
                  className="flex-1 px-3 py-2 border border-verone-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-verone-black"
                />
                <button
                  type="button"
                  onClick={() => {
                    void applyPromo().catch(err => {
                      console.error('[Promo]', err);
                    });
                  }}
                  disabled={promoLoading || !promoCode.trim()}
                  className="px-4 py-2 text-sm border border-verone-black text-verone-black hover:bg-verone-black hover:text-verone-white transition-colors disabled:opacity-30"
                >
                  {promoLoading ? '...' : 'Appliquer'}
                </button>
              </div>
              {promoError && (
                <p className="text-xs text-red-500 mt-1.5">{promoError}</p>
              )}
              {promoResult && (
                <p className="text-xs text-green-600 mt-1.5">
                  {promoResult.name} : -
                  {formatPrice(promoResult.discount_amount)}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm text-verone-gray-600">
                <span>Sous-total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Réduction ({promoResult?.code})</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
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
              {shippingEstimate > 0 &&
                shippingConfig?.free_shipping_enabled &&
                shippingConfig.shipping_info_message && (
                  <p className="text-xs text-verone-gray-400">
                    {shippingConfig.shipping_info_message}
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
