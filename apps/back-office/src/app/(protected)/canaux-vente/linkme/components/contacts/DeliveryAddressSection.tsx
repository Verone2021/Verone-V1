'use client';

import { MapPin } from 'lucide-react';

import { Checkbox, Label } from '@verone/ui';

import type { useCreateAddressBO } from '../../hooks/use-organisation-addresses-bo';
import type { useOrganisationWithEnseigne } from '../../hooks/use-enseigne-details';

import type { SelectedAddress } from './ContactsAddressesSection.types';
import { SectionHeader } from './SectionHeader';
import {
  OrganisationAddressCard,
  CreateNewAddressCard,
} from './OrganisationAddressCard';
import { NewAddressForm, type NewAddressFormData } from './NewAddressForm';

interface DeliveryAddressSectionProps {
  deliveryAddress: SelectedAddress | null;
  deliverySameAsBillingAddress: boolean;
  orgWithEnseigne: ReturnType<typeof useOrganisationWithEnseigne>['data'];
  isOpen: boolean;
  showNewForm: boolean;
  isComplete: boolean;
  createAddressPending: ReturnType<typeof useCreateAddressBO>['isPending'];
  onToggle: () => void;
  onSameAsBillingChange: (checked: boolean) => void;
  onSelectRestaurant: () => void;
  onShowNewForm: () => void;
  onHideNewForm: () => void;
  onCreateAddress: (formData: NewAddressFormData) => Promise<void>;
}

export function DeliveryAddressSection({
  deliveryAddress,
  deliverySameAsBillingAddress,
  orgWithEnseigne,
  isOpen,
  showNewForm,
  isComplete,
  createAddressPending,
  onToggle,
  onSameAsBillingChange,
  onSelectRestaurant,
  onShowNewForm,
  onHideNewForm,
  onCreateAddress,
}: DeliveryAddressSectionProps) {
  const subtitle = deliverySameAsBillingAddress
    ? 'Identique à la facturation'
    : deliveryAddress?.mode === 'restaurant'
      ? `Restaurant: ${orgWithEnseigne?.tradeName ?? orgWithEnseigne?.legalName}`
      : deliveryAddress?.customAddress
        ? deliveryAddress.customAddress.city
        : 'Sélectionnez une adresse';

  return (
    <div className="border rounded-lg overflow-hidden">
      <SectionHeader
        icon={<MapPin className="h-4 w-4" />}
        title="Adresse de livraison"
        subtitle={subtitle}
        isComplete={isComplete}
        isOpen={isOpen}
        onToggle={onToggle}
      />

      {isOpen && (
        <div className="p-4 pt-0 space-y-3">
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Checkbox
              id="delivery-same-billing-address"
              checked={deliverySameAsBillingAddress}
              onCheckedChange={onSameAsBillingChange}
            />
            <Label
              htmlFor="delivery-same-billing-address"
              className="text-sm font-normal cursor-pointer"
            >
              Identique à l&apos;adresse de facturation
            </Label>
          </div>

          {!deliverySameAsBillingAddress && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {orgWithEnseigne && (
                  <OrganisationAddressCard
                    id={orgWithEnseigne.id}
                    name={
                      orgWithEnseigne.tradeName ?? orgWithEnseigne.legalName
                    }
                    logoUrl={orgWithEnseigne.logoUrl}
                    ownershipType={orgWithEnseigne.ownershipType}
                    address={orgWithEnseigne.address}
                    label="Adresse du restaurant"
                    isSelected={deliveryAddress?.mode === 'restaurant'}
                    onClick={onSelectRestaurant}
                  />
                )}

                <CreateNewAddressCard
                  onClick={onShowNewForm}
                  isActive={showNewForm}
                  label="Nouvelle adresse de livraison"
                />
              </div>

              {showNewForm && (
                <NewAddressForm
                  onSubmit={onCreateAddress}
                  onCancel={onHideNewForm}
                  isSubmitting={createAddressPending}
                  sectionLabel="Nouvelle adresse de livraison"
                  defaultCountry={orgWithEnseigne?.address?.country ?? 'FR'}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
