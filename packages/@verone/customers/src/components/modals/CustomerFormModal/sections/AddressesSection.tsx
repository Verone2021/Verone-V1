import { MapPin, Navigation } from 'lucide-react';

import type { UseFormReturn } from 'react-hook-form';

import { AddressAutocomplete, type AddressResult } from '@verone/ui';
import { Checkbox, Input, Label } from '@verone/ui';

import type { CustomerFormData } from '../schema';

interface AddressesSectionProps {
  form: UseFormReturn<CustomerFormData>;
  onBillingAddressSelect: (address: AddressResult) => void;
  onShippingAddressSelect: (address: AddressResult) => void;
}

export function AddressesSection({
  form,
  onBillingAddressSelect,
  onShippingAddressSelect,
}: AddressesSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">Adresses</h3>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">
          Adresse de facturation
        </h4>
        <AddressAutocomplete
          value={form.watch('billing_address_line1') ?? ''}
          onChange={value => form.setValue('billing_address_line1', value)}
          onSelect={onBillingAddressSelect}
          placeholder="Rechercher une adresse..."
          id="billing-address-create"
        />
        <Input
          {...form.register('billing_address_line2')}
          placeholder="Complément d'adresse (bâtiment, étage...)"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="has_different_shipping"
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
          htmlFor="has_different_shipping"
          className="text-sm font-medium cursor-pointer"
        >
          Adresse de livraison différente
        </Label>
      </div>

      {form.watch('has_different_shipping_address') && (
        <div className="space-y-3 border-t border-gray-200 pt-3">
          <h4 className="text-sm font-medium text-gray-700">
            Adresse de livraison
          </h4>
          <AddressAutocomplete
            value={form.watch('shipping_address_line1') ?? ''}
            onChange={value => form.setValue('shipping_address_line1', value)}
            onSelect={onShippingAddressSelect}
            placeholder="Rechercher une adresse de livraison..."
            id="shipping-address-create"
          />
          <Input
            {...form.register('shipping_address_line2')}
            placeholder="Complément d'adresse (bâtiment, étage...)"
          />
        </div>
      )}

      {(form.watch('latitude') ?? form.watch('longitude')) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
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
