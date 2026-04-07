'use client';

import { AddressAutocomplete, type AddressResult } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { spacing, colors } from '@verone/ui';
import { MapPin, Navigation } from 'lucide-react';
import { type UseFormReturn } from 'react-hook-form';

import type { OrganisationFormData } from './types';

interface AddressSectionProps {
  form: UseFormReturn<OrganisationFormData>;
  isSubmitting: boolean;
  isCustomer: boolean;
}

export function AddressSection({
  form,
  isSubmitting,
  isCustomer,
}: AddressSectionProps) {
  const handleBillingAddressSelect = (address: AddressResult) => {
    form.setValue('billing_address_line1', address.streetAddress);
    form.setValue('billing_city', address.city);
    form.setValue('billing_postal_code', address.postalCode);
    form.setValue('billing_region', address.region ?? '');
    form.setValue('billing_country', address.countryCode ?? 'FR');
    if (!form.getValues('has_different_shipping_address')) {
      form.setValue('latitude', address.latitude ?? null);
      form.setValue('longitude', address.longitude ?? null);
    }
  };

  const handleShippingAddressSelect = (address: AddressResult) => {
    form.setValue('shipping_address_line1', address.streetAddress);
    form.setValue('shipping_city', address.city);
    form.setValue('shipping_postal_code', address.postalCode);
    form.setValue('shipping_region', address.region ?? '');
    form.setValue('shipping_country', address.countryCode ?? 'FR');
    form.setValue('latitude', address.latitude ?? null);
    form.setValue('longitude', address.longitude ?? null);
  };

  return (
    <div>
      <h3
        className="text-lg font-semibold flex items-center gap-2"
        style={{
          color: colors.text.DEFAULT,
          marginBottom: spacing[4],
        }}
      >
        <MapPin className="h-5 w-5" />
        Adresse de facturation
      </h3>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[3],
        }}
      >
        <AddressAutocomplete
          value={form.watch('billing_address_line1') ?? ''}
          onChange={value => form.setValue('billing_address_line1', value)}
          onSelect={handleBillingAddressSelect}
          placeholder="Rechercher une adresse..."
          id="org-billing-address"
          disabled={isSubmitting}
        />
        <Input
          id="billing_address_line2"
          {...form.register('billing_address_line2')}
          placeholder="Complément d'adresse (bâtiment, étage...)"
          disabled={isSubmitting}
          style={{
            borderColor: colors.border.DEFAULT,
            color: colors.text.DEFAULT,
            borderRadius: '8px',
          }}
        />
      </div>

      {/* Toggle adresse de livraison différente (clients uniquement) */}
      {isCustomer && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            marginTop: spacing[4],
          }}
        >
          <Checkbox
            id="has_different_shipping_org"
            checked={form.watch('has_different_shipping_address')}
            onCheckedChange={(checked: boolean) => {
              form.setValue('has_different_shipping_address', checked);
              if (!checked) {
                form.setValue('shipping_address_line1', '');
                form.setValue('shipping_address_line2', '');
                form.setValue('shipping_postal_code', '');
                form.setValue('shipping_city', '');
                form.setValue('shipping_region', '');
                form.setValue('shipping_country', 'FR');
              }
            }}
          />
          <Label
            htmlFor="has_different_shipping_org"
            className="text-sm font-medium cursor-pointer"
            style={{ color: colors.text.DEFAULT }}
          >
            Adresse de livraison différente
          </Label>
        </div>
      )}

      {/* Adresse de livraison (conditionnelle, clients uniquement) */}
      {isCustomer && form.watch('has_different_shipping_address') && (
        <div
          style={{
            marginTop: spacing[4],
            paddingTop: spacing[4],
            borderTop: `1px solid ${colors.border.DEFAULT}`,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing[3],
          }}
        >
          <h3
            className="text-lg font-semibold flex items-center gap-2"
            style={{ color: colors.text.DEFAULT }}
          >
            <MapPin className="h-5 w-5" />
            Adresse de livraison
          </h3>
          <AddressAutocomplete
            value={form.watch('shipping_address_line1') ?? ''}
            onChange={value => form.setValue('shipping_address_line1', value)}
            onSelect={handleShippingAddressSelect}
            placeholder="Rechercher une adresse de livraison..."
            id="org-shipping-address"
            disabled={isSubmitting}
          />
          <Input
            id="shipping_address_line2"
            {...form.register('shipping_address_line2')}
            placeholder="Complément d'adresse (bâtiment, étage...)"
            disabled={isSubmitting}
            style={{
              borderColor: colors.border.DEFAULT,
              color: colors.text.DEFAULT,
              borderRadius: '8px',
            }}
          />
        </div>
      )}

      {/* Coordonnées GPS (lecture seule) */}
      {(form.watch('latitude') ?? form.watch('longitude')) && (
        <div
          style={{
            marginTop: spacing[3],
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: spacing[3],
          }}
        >
          <div className="flex items-center gap-2 text-green-700">
            <Navigation className="h-4 w-4" />
            <span className="text-sm font-medium">Coordonnées GPS</span>
            <span className="text-xs text-green-600 ml-auto">
              (mises à jour automatiquement)
            </span>
          </div>
          <div className="mt-1 pl-6 text-sm text-green-800 font-mono">
            {form.watch('latitude')?.toFixed(6)},{' '}
            {form.watch('longitude')?.toFixed(6)}
          </div>
        </div>
      )}
    </div>
  );
}
