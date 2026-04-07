'use client';

import { ButtonV2 } from '@verone/ui';
import { Building, Home, Navigation, Copy } from 'lucide-react';

import { COUNTRIES } from './address-edit.types';
import type { Organisation } from './address-edit.types';

interface AddressReadViewProps {
  organisation: Organisation;
  onCopy: (
    addressData: Record<string, string | null | undefined>,
    title: string
  ) => Promise<void>;
}

function renderAddress(
  addressData: Record<string, string | null | undefined>,
  icon: React.ReactNode,
  title: string,
  onCopy: (
    addressData: Record<string, string | null | undefined>,
    title: string
  ) => Promise<void>
) {
  if (!addressData.line1 && !addressData.city && !addressData.country)
    return null;

  return (
    <div className="bg-gray-50 p-3 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon}
          <div className="text-xs font-medium text-gray-600 uppercase">
            {title}
          </div>
        </div>
        <ButtonV2
          variant="outline"
          size="md"
          onClick={() => void onCopy(addressData, title)}
          title={`Copier ${title}`}
        >
          <Copy className="h-4 w-4" />
        </ButtonV2>
      </div>
      <div className="flex-1 pl-6">
        {addressData.line1 && (
          <div className="text-sm text-black">{addressData.line1}</div>
        )}
        {addressData.line2 && (
          <div className="text-sm text-black opacity-80">
            {addressData.line2}
          </div>
        )}
        {(addressData.postal_code ?? addressData.city) && (
          <div className="text-sm text-black mt-1">
            {addressData.postal_code && `${addressData.postal_code} `}
            {addressData.city}
          </div>
        )}
        {addressData.region && (
          <div className="text-sm text-black opacity-80">
            {addressData.region}
          </div>
        )}
        {addressData.country && addressData.country !== 'FR' && (
          <div className="text-sm text-black font-medium mt-1">
            {COUNTRIES.find(c => c.code === addressData.country)?.name ??
              addressData.country}
          </div>
        )}
      </div>
    </div>
  );
}

export function AddressReadView({
  organisation,
  onCopy,
}: AddressReadViewProps) {
  const billingData = {
    line1: organisation.billing_address_line1 ?? organisation.address_line1,
    line2: organisation.billing_address_line2 ?? organisation.address_line2,
    postal_code: organisation.billing_postal_code ?? organisation.postal_code,
    city: organisation.billing_city ?? organisation.city,
    region: organisation.billing_region ?? organisation.region,
    country: organisation.billing_country ?? organisation.country,
  };

  const shippingData = {
    line1: organisation.shipping_address_line1,
    line2: organisation.shipping_address_line2,
    postal_code: organisation.shipping_postal_code,
    city: organisation.shipping_city,
    region: organisation.shipping_region,
    country: organisation.shipping_country,
  };

  const hasBillingAddress =
    billingData.line1 ?? billingData.city ?? billingData.country;
  const hasShippingAddress =
    shippingData.line1 ?? shippingData.city ?? shippingData.country;
  const hasLegacyAddress =
    organisation.address_line1 ?? organisation.city ?? organisation.country;

  return (
    <div className="space-y-3">
      {hasBillingAddress &&
        renderAddress(
          billingData,
          <Building className="h-4 w-4 mt-1 text-gray-600" />,
          'Adresse de facturation',
          onCopy
        )}

      {hasShippingAddress &&
        organisation.has_different_shipping_address &&
        renderAddress(
          shippingData,
          <Home className="h-4 w-4 mt-1 text-gray-600" />,
          'Adresse de livraison',
          onCopy
        )}

      {hasBillingAddress && !organisation.has_different_shipping_address && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <div className="text-sm text-blue-700">
            📦 Adresse de livraison identique à l'adresse de facturation
          </div>
        </div>
      )}

      {(organisation.latitude ?? organisation.longitude) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-700">
            <Navigation className="h-4 w-4" />
            <span className="text-sm font-medium">Coordonnées GPS</span>
            <span className="text-xs text-green-600 ml-auto">
              Adresse de livraison
            </span>
          </div>
          <div className="mt-2 pl-6 text-sm text-green-800 font-mono">
            {organisation.latitude?.toFixed(6)},{' '}
            {organisation.longitude?.toFixed(6)}
          </div>
        </div>
      )}

      {!hasBillingAddress && !hasShippingAddress && !hasLegacyAddress && (
        <div className="text-center text-gray-400 text-xs italic py-4">
          <Building className="h-8 w-8 mx-auto mb-2 opacity-30" />
          Aucune adresse renseignée
        </div>
      )}
    </div>
  );
}
