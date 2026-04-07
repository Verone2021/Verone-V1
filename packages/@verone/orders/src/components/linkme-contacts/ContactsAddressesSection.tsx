'use client';

/**
 * ContactsAddressesSection - Section Contacts & Adresses (Étape 5)
 *
 * Workflow utilisateur:
 * 1. Contact de facturation (sélection ou création)
 * 2. Adresse de facturation (enseigne parente ou restaurant ou nouvelle)
 * 3. Contact de livraison (option "Même que facturation")
 * 4. Adresse de livraison (option "Même que facturation" ou "Adresse restaurant")
 *
 * @module ContactsAddressesSection
 * @since 2026-01-20
 */

import { useEffect } from 'react';

import { Loader2 } from 'lucide-react';

import {
  useOrganisationContactsBO,
  useCreateContactBO,
} from '../../hooks/linkme/use-organisation-contacts-bo';
import {
  useOrganisationAddressesBO,
  useCreateAddressBO,
} from '../../hooks/linkme/use-organisation-addresses-bo';
import { useOrganisationWithEnseigne } from '../../hooks/linkme/use-enseigne-details';

import { BillingContactSection } from './BillingContactSection';
import { BillingAddressSection } from './BillingAddressSection';
import { DeliveryContactSection } from './DeliveryContactSection';
import { DeliveryAddressSection } from './DeliveryAddressSection';
import { useContactsAddressesState } from './use-contacts-addresses-state';
import { useContactsAddressesHandlers } from './use-contacts-addresses-handlers';

import type { ContactsAddressesSectionProps } from './ContactsAddressesSection.types';

// ============================================================================
// RE-EXPORTS TYPES PUBLICS
// ============================================================================

export type {
  SelectedContact,
  SelectedAddress,
  ContactsAddressesData,
} from './ContactsAddressesSection.types';

// ============================================================================
// COMPOSANT PRINCIPAL (orchestrateur)
// ============================================================================

export function ContactsAddressesSection({
  organisationId,
  data,
  onUpdate,
  visible = true,
}: ContactsAddressesSectionProps) {
  // États UI centralisés
  const uiState = useContactsAddressesState();
  const {
    billingContactOpen,
    billingAddressOpen,
    deliveryContactOpen,
    deliveryAddressOpen,
    showNewBillingContactForm,
    showNewBillingAddressForm,
    showNewDeliveryContactForm,
    showNewDeliveryAddressForm,
    setBillingContactOpen,
    setBillingAddressOpen,
    setDeliveryContactOpen,
    setDeliveryAddressOpen,
    setShowNewBillingContactForm,
    setShowNewBillingAddressForm,
    setShowNewDeliveryContactForm,
    setShowNewDeliveryAddressForm,
  } = uiState;

  // Data hooks
  const { data: contactsData, isLoading: contactsLoading } =
    useOrganisationContactsBO(organisationId);
  const { data: addressesData, isLoading: addressesLoading } =
    useOrganisationAddressesBO(organisationId);
  const { data: orgWithEnseigne, isLoading: enseigneLoading } =
    useOrganisationWithEnseigne(organisationId);

  // Mutations
  const createContact = useCreateContactBO();
  const createAddress = useCreateAddressBO();

  // Computed values
  const contacts = contactsData?.contacts ?? [];
  const billingAddresses = addressesData?.billing ?? [];

  // Auto-select restaurant address when org loads and no billing address selected
  useEffect(() => {
    if (!orgWithEnseigne || data.billingAddress !== null) return;
    const addr = orgWithEnseigne.address;
    if (!addr?.line1) return;

    onUpdate({
      billingAddress: {
        mode: 'restaurant',
        addressId: null,
        customAddress: {
          addressLine1: addr.line1,
          postalCode: addr.postalCode ?? '',
          city: addr.city ?? '',
          country: addr.country ?? 'FR',
        },
      },
      deliverySameAsBillingAddress: true,
    });
  }, [orgWithEnseigne, data.billingAddress, onUpdate]);

  // Completion status
  const billingContactComplete = !!data.billingContact;
  const billingAddressComplete = !!data.billingAddress;
  const deliveryContactComplete =
    data.deliverySameAsBillingContact || !!data.deliveryContact;
  const deliveryAddressComplete =
    data.deliverySameAsBillingAddress || !!data.deliveryAddress;

  // Handlers centralisés
  const {
    handleSelectBillingContact,
    handleCreateBillingContact,
    handleSelectBillingAddressEnseigne,
    handleSelectBillingAddressRestaurant,
    handleSelectBillingAddressExisting,
    handleCreateBillingAddress,
    handleDeliverySameAsBillingContactChange,
    handleSelectDeliveryContact,
    handleCreateDeliveryContact,
    handleDeliverySameAsBillingAddressChange,
    handleSelectDeliveryAddressRestaurant,
    handleCreateDeliveryAddress,
  } = useContactsAddressesHandlers({
    organisationId,
    data,
    orgWithEnseigne,
    createContact,
    createAddress,
    onUpdate,
    setBillingContactOpen,
    setBillingAddressOpen,
    setDeliveryContactOpen,
    setDeliveryAddressOpen,
    setShowNewBillingContactForm,
    setShowNewBillingAddressForm,
    setShowNewDeliveryContactForm,
    setShowNewDeliveryAddressForm,
  });

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!visible || !organisationId) {
    return null;
  }

  const isLoading = contactsLoading || addressesLoading || enseigneLoading;

  return (
    <div className="space-y-4 border-t pt-6">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Contacts & Adresses
      </h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="space-y-2">
          <BillingContactSection
            contacts={contacts}
            billingContact={data.billingContact}
            isComplete={billingContactComplete}
            isOpen={billingContactOpen}
            showNewForm={showNewBillingContactForm}
            isSubmitting={createContact.isPending}
            onToggle={() => setBillingContactOpen(!billingContactOpen)}
            onSelectContact={handleSelectBillingContact}
            onShowNewForm={() => setShowNewBillingContactForm(true)}
            onHideNewForm={() => setShowNewBillingContactForm(false)}
            onCreateContact={handleCreateBillingContact}
          />

          <BillingAddressSection
            orgWithEnseigne={orgWithEnseigne}
            billingAddress={data.billingAddress}
            billingAddresses={billingAddresses}
            isComplete={billingAddressComplete}
            isOpen={billingAddressOpen}
            showNewForm={showNewBillingAddressForm}
            isSubmitting={createAddress.isPending}
            onToggle={() => setBillingAddressOpen(!billingAddressOpen)}
            onSelectEnseigne={handleSelectBillingAddressEnseigne}
            onSelectRestaurant={handleSelectBillingAddressRestaurant}
            onSelectExisting={handleSelectBillingAddressExisting}
            onShowNewForm={() => setShowNewBillingAddressForm(true)}
            onHideNewForm={() => setShowNewBillingAddressForm(false)}
            onCreateAddress={handleCreateBillingAddress}
          />

          <DeliveryContactSection
            contacts={contacts}
            deliveryContact={data.deliveryContact}
            deliverySameAsBillingContact={data.deliverySameAsBillingContact}
            isComplete={deliveryContactComplete}
            isOpen={deliveryContactOpen}
            showNewForm={showNewDeliveryContactForm}
            isSubmitting={createContact.isPending}
            onToggle={() => setDeliveryContactOpen(!deliveryContactOpen)}
            onSameAsBillingChange={handleDeliverySameAsBillingContactChange}
            onSelectContact={handleSelectDeliveryContact}
            onShowNewForm={() => setShowNewDeliveryContactForm(true)}
            onHideNewForm={() => setShowNewDeliveryContactForm(false)}
            onCreateContact={handleCreateDeliveryContact}
          />

          <DeliveryAddressSection
            orgWithEnseigne={orgWithEnseigne}
            deliveryAddress={data.deliveryAddress}
            deliverySameAsBillingAddress={data.deliverySameAsBillingAddress}
            isComplete={deliveryAddressComplete}
            isOpen={deliveryAddressOpen}
            showNewForm={showNewDeliveryAddressForm}
            isSubmitting={createAddress.isPending}
            onToggle={() => setDeliveryAddressOpen(!deliveryAddressOpen)}
            onSameAsBillingChange={handleDeliverySameAsBillingAddressChange}
            onSelectRestaurant={handleSelectDeliveryAddressRestaurant}
            onShowNewForm={() => setShowNewDeliveryAddressForm(true)}
            onHideNewForm={() => setShowNewDeliveryAddressForm(false)}
            onCreateAddress={handleCreateDeliveryAddress}
          />
        </div>
      )}
    </div>
  );
}

export default ContactsAddressesSection;

export type { ContactsAddressesSectionProps };
