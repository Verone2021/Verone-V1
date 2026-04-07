'use client';

/**
 * BillingAddressSection — Section "Adresse de facturation"
 * 3 modes : enseigne parente, restaurant, adresse existante / nouvelle
 *
 * @module BillingAddressSection
 */

import { MapPin } from 'lucide-react';

import type { AddressBO } from '../../hooks/linkme/use-organisation-addresses-bo';
import type { OrganisationWithEnseigne } from '../../hooks/linkme/use-enseigne-details';

import {
  OrganisationAddressCard,
  EnseigneParentCard,
  CreateNewAddressCard,
} from './OrganisationAddressCard';
import { NewAddressForm, type NewAddressFormData } from './NewAddressForm';
import { SectionHeader } from './SectionHeader';
import type { SelectedAddress } from './ContactsAddressesSection.types';

// ============================================================================
// TYPES
// ============================================================================

interface BillingAddressSectionProps {
  orgWithEnseigne: OrganisationWithEnseigne | null | undefined;
  billingAddress: SelectedAddress | null;
  billingAddresses: AddressBO[];
  isComplete: boolean;
  isOpen: boolean;
  showNewForm: boolean;
  isSubmitting: boolean;
  onToggle: () => void;
  onSelectEnseigne: () => void;
  onSelectRestaurant: () => void;
  onSelectExisting: (address: AddressBO) => void;
  onShowNewForm: () => void;
  onHideNewForm: () => void;
  onCreateAddress: (formData: NewAddressFormData) => Promise<void>;
}

// ============================================================================
// COMPOSANT
// ============================================================================

export function BillingAddressSection({
  orgWithEnseigne,
  billingAddress,
  billingAddresses,
  isComplete,
  isOpen,
  showNewForm,
  isSubmitting,
  onToggle,
  onSelectEnseigne,
  onSelectRestaurant,
  onSelectExisting,
  onShowNewForm,
  onHideNewForm,
  onCreateAddress,
}: BillingAddressSectionProps) {
  const hasEnseigne = !!orgWithEnseigne?.enseigne;

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
          {/* Address options grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Enseigne parent option */}
            {hasEnseigne && orgWithEnseigne?.enseigne && (
              <EnseigneParentCard
                name={orgWithEnseigne.enseigne.name}
                logoUrl={orgWithEnseigne.enseigne.logoUrl}
                address={orgWithEnseigne.enseigne.address}
                isSelected={billingAddress?.mode === 'enseigne'}
                onClick={onSelectEnseigne}
              />
            )}

            {/* Restaurant option */}
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

            {/* Existing billing addresses */}
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

            {/* New address card */}
            <CreateNewAddressCard
              onClick={onShowNewForm}
              isActive={showNewForm}
              label="Nouvelle adresse de facturation"
            />
          </div>

          {/* New address form */}
          {showNewForm && (
            <NewAddressForm
              onSubmit={onCreateAddress}
              onCancel={onHideNewForm}
              isSubmitting={isSubmitting}
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
