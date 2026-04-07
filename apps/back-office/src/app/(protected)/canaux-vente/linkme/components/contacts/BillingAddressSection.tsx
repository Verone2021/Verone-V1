'use client';

import { MapPin } from 'lucide-react';

import type { AddressBO } from '../../hooks/use-organisation-addresses-bo';
import type { useCreateAddressBO } from '../../hooks/use-organisation-addresses-bo';
import type { useOrganisationWithEnseigne } from '../../hooks/use-enseigne-details';

import type { SelectedAddress } from './ContactsAddressesSection.types';
import { SectionHeader } from './SectionHeader';
import {
  OrganisationAddressCard,
  EnseigneParentCard,
  CreateNewAddressCard,
} from './OrganisationAddressCard';
import { NewAddressForm, type NewAddressFormData } from './NewAddressForm';

interface BillingAddressSectionProps {
  billingAddress: SelectedAddress | null;
  billingAddresses: AddressBO[];
  orgWithEnseigne: ReturnType<typeof useOrganisationWithEnseigne>['data'];
  hasEnseigne: boolean;
  isOpen: boolean;
  showNewForm: boolean;
  isComplete: boolean;
  createAddressPending: ReturnType<typeof useCreateAddressBO>['isPending'];
  onToggle: () => void;
  onSelectEnseigne: () => void;
  onSelectRestaurant: () => void;
  onSelectExisting: (address: AddressBO) => void;
  onShowNewForm: () => void;
  onHideNewForm: () => void;
  onCreateAddress: (formData: NewAddressFormData) => Promise<void>;
}

export function BillingAddressSection({
  billingAddress,
  billingAddresses,
  orgWithEnseigne,
  hasEnseigne,
  isOpen,
  showNewForm,
  isComplete,
  createAddressPending,
  onToggle,
  onSelectEnseigne,
  onSelectRestaurant,
  onSelectExisting,
  onShowNewForm,
  onHideNewForm,
  onCreateAddress,
}: BillingAddressSectionProps) {
  const subtitle =
    billingAddress?.mode === 'enseigne'
      ? `Enseigne: ${orgWithEnseigne?.enseigne?.name}`
      : billingAddress?.mode === 'restaurant'
        ? `Restaurant: ${orgWithEnseigne?.tradeName ?? orgWithEnseigne?.legalName}`
        : billingAddress?.customAddress
          ? billingAddress.customAddress.city
          : 'Sélectionnez une adresse';

  return (
    <div className="border rounded-lg overflow-hidden">
      <SectionHeader
        icon={<MapPin className="h-4 w-4" />}
        title="Adresse de facturation"
        subtitle={subtitle}
        isComplete={isComplete}
        isOpen={isOpen}
        onToggle={onToggle}
      />

      {isOpen && (
        <div className="p-4 pt-0 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {hasEnseigne && orgWithEnseigne?.enseigne && (
              <EnseigneParentCard
                name={orgWithEnseigne.enseigne.name}
                logoUrl={orgWithEnseigne.enseigne.logoUrl}
                address={orgWithEnseigne.enseigne.address}
                isSelected={billingAddress?.mode === 'enseigne'}
                onClick={onSelectEnseigne}
              />
            )}

            {orgWithEnseigne && (
              <OrganisationAddressCard
                id={orgWithEnseigne.id}
                name={orgWithEnseigne.tradeName ?? orgWithEnseigne.legalName}
                logoUrl={orgWithEnseigne.logoUrl}
                ownershipType={orgWithEnseigne.ownershipType}
                address={orgWithEnseigne.address}
                label="Restaurant"
                isSelected={billingAddress?.mode === 'restaurant'}
                onClick={onSelectRestaurant}
              />
            )}

            {billingAddresses.map(address => (
              <OrganisationAddressCard
                key={address.id}
                id={address.id}
                name={address.label ?? address.addressLine1}
                address={{
                  line1: address.addressLine1,
                  line2: address.addressLine2,
                  postalCode: address.postalCode,
                  city: address.city,
                  country: address.country,
                }}
                isSelected={
                  billingAddress?.mode === 'existing' &&
                  billingAddress.addressId === address.id
                }
                onClick={() => onSelectExisting(address)}
              />
            ))}

            <CreateNewAddressCard
              onClick={onShowNewForm}
              isActive={showNewForm}
              label="Nouvelle adresse de facturation"
            />
          </div>

          {showNewForm && (
            <NewAddressForm
              onSubmit={onCreateAddress}
              onCancel={onHideNewForm}
              isSubmitting={createAddressPending}
              sectionLabel="Nouvelle adresse de facturation"
              showLegalFields
              defaultCountry={orgWithEnseigne?.address?.country ?? 'FR'}
            />
          )}
        </div>
      )}
    </div>
  );
}
