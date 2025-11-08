'use client';

import { useState, useEffect } from 'react';

import { MapPin, Home, Building, Copy } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Separator } from '@verone/ui';

interface AddressData {
  address_line1?: string;
  address_line2?: string;
  postal_code?: string;
  city?: string;
  region?: string;
  country?: string;
}

interface AddressSelectorProps {
  form: UseFormReturn<any>;
  className?: string;
}

export function AddressSelector({ form, className }: AddressSelectorProps) {
  const [hasDifferentShipping, setHasDifferentShipping] = useState(false);

  // Surveiller les changements du checkbox dans le formulaire
  const formHasDifferentShipping = form.watch('has_different_shipping_address');

  useEffect(() => {
    setHasDifferentShipping(formHasDifferentShipping || false);
  }, [formHasDifferentShipping]);

  // Fonction pour copier l'adresse de facturation vers la livraison
  const copyBillingToShipping = () => {
    const billingData = {
      shipping_address_line1: form.getValues('billing_address_line1'),
      shipping_address_line2: form.getValues('billing_address_line2'),
      shipping_postal_code: form.getValues('billing_postal_code'),
      shipping_city: form.getValues('billing_city'),
      shipping_region: form.getValues('billing_region'),
      shipping_country: form.getValues('billing_country'),
    };

    Object.entries(billingData).forEach(([key, value]) => {
      form.setValue(key, value);
    });
  };

  // Fonction pour vider l'adresse de livraison
  const clearShippingAddress = () => {
    const shippingFields = [
      'shipping_address_line1',
      'shipping_address_line2',
      'shipping_postal_code',
      'shipping_city',
      'shipping_region',
      'shipping_country',
    ];

    shippingFields.forEach(field => {
      form.setValue(field, '');
    });
  };

  // Gérer le changement du checkbox
  const handleShippingToggle = (checked: boolean) => {
    setHasDifferentShipping(checked);
    form.setValue('has_different_shipping_address', checked);

    if (!checked) {
      // Si on désactive, vider l'adresse de livraison
      clearShippingAddress();
    }
  };

  return (
    <div className={className}>
      {/* Adresse de Facturation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building className="h-5 w-5" />
            Adresse de Facturation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="billing_address_line1">Adresse ligne 1 *</Label>
              <Input
                id="billing_address_line1"
                placeholder="123 rue de la République"
                {...form.register('billing_address_line1')}
              />
              {form.formState.errors.billing_address_line1 && (
                <p className="text-sm text-red-600 mt-1">
                  {String(
                    form.formState.errors.billing_address_line1?.message ||
                      'Champ requis'
                  )}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="billing_address_line2">Adresse ligne 2</Label>
              <Input
                id="billing_address_line2"
                placeholder="Appartement, étage, bâtiment..."
                {...form.register('billing_address_line2')}
              />
            </div>

            <div>
              <Label htmlFor="billing_postal_code">Code postal *</Label>
              <Input
                id="billing_postal_code"
                placeholder="75001"
                {...form.register('billing_postal_code')}
              />
              {form.formState.errors.billing_postal_code && (
                <p className="text-sm text-red-600 mt-1">
                  {String(
                    form.formState.errors.billing_postal_code?.message ||
                      'Champ requis'
                  )}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="billing_city">Ville *</Label>
              <Input
                id="billing_city"
                placeholder="Paris"
                {...form.register('billing_city')}
              />
              {form.formState.errors.billing_city && (
                <p className="text-sm text-red-600 mt-1">
                  {String(
                    form.formState.errors.billing_city?.message ||
                      'Champ requis'
                  )}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="billing_region">Région/Département</Label>
              <Input
                id="billing_region"
                placeholder="Île-de-France"
                {...form.register('billing_region')}
              />
            </div>

            <div>
              <Label htmlFor="billing_country">Pays</Label>
              <Input
                id="billing_country"
                placeholder="FR"
                {...form.register('billing_country')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Toggle Adresse de Livraison */}
      <div className="flex items-center space-x-2 mb-4">
        <Checkbox
          id="different_shipping"
          checked={hasDifferentShipping}
          onCheckedChange={handleShippingToggle}
        />
        <Label htmlFor="different_shipping" className="text-sm font-medium">
          L'adresse de livraison est différente de l'adresse de facturation
        </Label>
      </div>

      {/* Adresse de Livraison (conditionnelle) */}
      {hasDifferentShipping && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Home className="h-5 w-5" />
                Adresse de Livraison
              </CardTitle>
              <ButtonV2
                type="button"
                variant="outline"
                size="sm"
                onClick={copyBillingToShipping}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copier adresse de facturation
              </ButtonV2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="shipping_address_line1">
                  Adresse ligne 1 *
                </Label>
                <Input
                  id="shipping_address_line1"
                  placeholder="456 avenue des Champs"
                  {...form.register('shipping_address_line1')}
                />
                {form.formState.errors.shipping_address_line1 && (
                  <p className="text-sm text-red-600 mt-1">
                    {String(
                      form.formState.errors.shipping_address_line1?.message ||
                        'Champ requis'
                    )}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="shipping_address_line2">Adresse ligne 2</Label>
                <Input
                  id="shipping_address_line2"
                  placeholder="Appartement, étage, bâtiment..."
                  {...form.register('shipping_address_line2')}
                />
              </div>

              <div>
                <Label htmlFor="shipping_postal_code">Code postal *</Label>
                <Input
                  id="shipping_postal_code"
                  placeholder="75008"
                  {...form.register('shipping_postal_code')}
                />
                {form.formState.errors.shipping_postal_code && (
                  <p className="text-sm text-red-600 mt-1">
                    {String(
                      form.formState.errors.shipping_postal_code?.message ||
                        'Champ requis'
                    )}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="shipping_city">Ville *</Label>
                <Input
                  id="shipping_city"
                  placeholder="Paris"
                  {...form.register('shipping_city')}
                />
                {form.formState.errors.shipping_city && (
                  <p className="text-sm text-red-600 mt-1">
                    {String(
                      form.formState.errors.shipping_city?.message ||
                        'Champ requis'
                    )}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="shipping_region">Région/Département</Label>
                <Input
                  id="shipping_region"
                  placeholder="Île-de-France"
                  {...form.register('shipping_region')}
                />
              </div>

              <div>
                <Label htmlFor="shipping_country">Pays</Label>
                <Input
                  id="shipping_country"
                  placeholder="FR"
                  {...form.register('shipping_country')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
