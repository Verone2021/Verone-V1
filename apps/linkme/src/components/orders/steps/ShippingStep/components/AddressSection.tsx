'use client';

import { Card, cn } from '@verone/ui';
import { MapPin, Check, AlertCircle } from 'lucide-react';

import type { Address } from '@/lib/hooks/use-entity-addresses';
import type { PartialAddressData } from '../../../schemas/order-form.schema';
import { AddressCard } from '../../contacts/AddressCard';
import { AddressForm } from '../../contacts/AddressForm';

interface AddressSectionProps {
  isAddressComplete: boolean;
  isAddressEditMode: boolean;
  addressFormData: PartialAddressData;
  addressesLoading: boolean;
  shippingAddresses: Address[];
  restaurantAddress: Address | null;
  selectedAddressId: string | null;
  showAddressForm: boolean;
  onAddressFormChange: (newAddress: PartialAddressData) => void;
  onSelectAddress: (address: Address) => void;
  onSelectRestaurantAddress: () => void;
  onCreateNewAddress: () => void;
}

export function AddressSection({
  isAddressComplete,
  isAddressEditMode,
  addressFormData,
  addressesLoading,
  shippingAddresses,
  restaurantAddress,
  selectedAddressId,
  showAddressForm,
  onAddressFormChange,
  onSelectAddress,
  onSelectRestaurantAddress,
  onCreateNewAddress,
}: AddressSectionProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            isAddressComplete
              ? 'bg-green-100 text-green-600'
              : 'bg-purple-100 text-purple-600'
          )}
        >
          {isAddressComplete ? (
            <Check className="h-5 w-5" />
          ) : (
            <MapPin className="h-5 w-5" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Adresse de livraison</h3>
          <p className="text-sm text-gray-500">
            Ou souhaitez-vous etre livre ?
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GAUCHE: Formulaire adresse */}
        <Card
          className={cn(
            'p-4 transition-all',
            isAddressEditMode
              ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200'
              : 'bg-gray-50 border-dashed border-gray-300'
          )}
        >
          {isAddressEditMode && (
            <div className="flex items-center gap-3 pb-4 border-b border-purple-200 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-purple-900">
                  Adresse de livraison
                </h4>
                <p className="text-xs text-purple-600">
                  Lieu de reception de la commande
                </p>
              </div>
            </div>
          )}

          {!isAddressEditMode && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <MapPin className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-1">
                Aucune adresse selectionnee
              </p>
              <p className="text-xs text-gray-400">
                Cliquez sur une adresse a droite pour la selectionner
              </p>
            </div>
          )}

          {isAddressEditMode && (
            <AddressForm
              address={addressFormData}
              onChange={onAddressFormChange}
              showLegalFields={false}
              idPrefix="shipping-address"
            />
          )}
        </Card>

        {/* DROITE: Adresses existantes */}
        <Card className="p-4">
          <div className="flex items-center gap-2 pb-3 border-b mb-4">
            <MapPin className="h-4 w-4 text-purple-600" />
            <h4 className="font-medium text-gray-700">Adresses disponibles</h4>
          </div>

          {addressesLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
            </div>
          )}

          {!addressesLoading && (
            <div className="space-y-3">
              {restaurantAddress && (
                <AddressCard
                  address={restaurantAddress}
                  isSelected={selectedAddressId === 'restaurant'}
                  onClick={onSelectRestaurantAddress}
                  badge={
                    !restaurantAddress.addressLine1 ||
                    !restaurantAddress.postalCode
                      ? 'Incomplet'
                      : 'Restaurant'
                  }
                />
              )}

              {shippingAddresses.map(address => (
                <AddressCard
                  key={address.id}
                  address={address}
                  isSelected={selectedAddressId === address.id}
                  onClick={() => onSelectAddress(address)}
                />
              ))}

              <Card
                className={cn(
                  'p-3 cursor-pointer transition-all hover:shadow-md border-dashed',
                  showAddressForm
                    ? 'border-2 border-blue-500 bg-blue-50/50'
                    : 'hover:border-gray-400'
                )}
                onClick={onCreateNewAddress}
              >
                <div className="flex items-center justify-center gap-2 h-full min-h-[60px]">
                  <MapPin
                    className={cn(
                      'h-5 w-5',
                      showAddressForm ? 'text-blue-500' : 'text-gray-400'
                    )}
                  />
                  <span
                    className={cn(
                      'font-medium text-sm',
                      showAddressForm ? 'text-blue-600' : 'text-gray-600'
                    )}
                  >
                    + Nouvelle adresse
                  </span>
                </div>
              </Card>

              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-purple-700">
                    Les adresses de livraison sont conservees pour vos
                    prochaines commandes.
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Card>
  );
}
