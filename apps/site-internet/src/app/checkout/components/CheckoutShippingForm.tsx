'use client';

import { CreditCard, Lock, Package, Shield } from 'lucide-react';

import { formatPrice } from '@verone/utils';

const inputClass =
  'w-full px-4 py-3 border border-verone-gray-300 rounded-lg focus:ring-2 focus:ring-verone-black focus:border-transparent outline-none transition-all text-sm';

const COUNTRY_OPTIONS = [
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgique' },
  { value: 'CH', label: 'Suisse' },
  { value: 'LU', label: 'Luxembourg' },
  { value: 'MC', label: 'Monaco' },
];

interface CheckoutShippingFormProps {
  useSameBillingAddress: boolean;
  onSameBillingAddressChange: (value: boolean) => void;
  isSubmitting: boolean;
  total: number;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function CheckoutShippingForm({
  useSameBillingAddress,
  onSameBillingAddressChange,
  isSubmitting,
  total,
  onSubmit,
}: CheckoutShippingFormProps) {
  return (
    <form
      onSubmit={e => {
        void onSubmit(e);
      }}
      className="space-y-6"
    >
      {/* Shipping address */}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                {COUNTRY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
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
            onChange={e => onSameBillingAddressChange(e.target.checked)}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  {COUNTRY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit button */}
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
  );
}
