'use client';

import { useEffect } from 'react';

import { Loader2 } from 'lucide-react';

import {
  useOrganisationContactsBO,
  useCreateContactBO,
} from '../../hooks/use-organisation-contacts-bo';
import {
  useOrganisationAddressesBO,
  useCreateAddressBO,
} from '../../hooks/use-organisation-addresses-bo';
import { useOrganisationWithEnseigne } from '../../hooks/use-enseigne-details';

import type { ContactsAddressesSectionProps } from './ContactsAddressesSection.types';
import { useContactsAddressesState } from './use-contacts-addresses-state';
import { useContactsAddressesHandlers } from './use-contacts-addresses-handlers';
import { BillingContactSection } from './BillingContactSection';
import { BillingAddressSection } from './BillingAddressSection';
import { DeliveryContactSection } from './DeliveryContactSection';
import { DeliveryAddressSection } from './DeliveryAddressSection';

export type {
  SelectedContact,
  SelectedAddress,
  ContactsAddressesData,
} from './ContactsAddressesSection.types';

export function ContactsAddressesSection({
  organisationId,
  data,
  onUpdate,
  visible = true,
}: ContactsAddressesSectionProps) {
  const {
    billingContactOpen,
    setBillingContactOpen,
    billingAddressOpen,
    setBillingAddressOpen,
    deliveryContactOpen,
    setDeliveryContactOpen,
    deliveryAddressOpen,
    setDeliveryAddressOpen,
    showNewBillingContactForm,
    setShowNewBillingContactForm,
    showNewBillingAddressForm,
    setShowNewBillingAddressForm,
    showNewDeliveryContactForm,
    setShowNewDeliveryContactForm,
    showNewDeliveryAddressForm,
    setShowNewDeliveryAddressForm,
  } = useContactsAddressesState();

  const { data: contactsData, isLoading: contactsLoading } =
    useOrganisationContactsBO(organisationId);
  const { data: addressesData, isLoading: addressesLoading } =
    useOrganisationAddressesBO(organisationId);
  const { data: orgWithEnseigne, isLoading: enseigneLoading } =
    useOrganisationWithEnseigne(organisationId);

  const createContact = useCreateContactBO();
  const createAddress = useCreateAddressBO();

  const contacts = contactsData?.contacts ?? [];
  const billingAddresses = addressesData?.billing ?? [];
  const hasEnseigne = !!orgWithEnseigne?.enseigne;

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

  const handlers = useContactsAddressesHandlers({
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

  if (!visible || !organisationId) return null;

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
            billingContactId={data.billingContact?.id}
            billingContactName={
              data.billingContact
                ? `${data.billingContact.firstName} ${data.billingContact.lastName}`
                : undefined
            }
            isOpen={billingContactOpen}
            showNewForm={showNewBillingContactForm}
            isSubmitting={createContact.isPending}
            isComplete={!!data.billingContact}
            onToggle={() => setBillingContactOpen(!billingContactOpen)}
            onSelectContact={handlers.handleSelectBillingContact}
            onShowNewForm={() => setShowNewBillingContactForm(true)}
            onHideNewForm={() => setShowNewBillingContactForm(false)}
            onCreateContact={handlers.handleCreateBillingContact}
            createContactPending={createContact.isPending}
          />

          <BillingAddressSection
            billingAddress={data.billingAddress}
            billingAddresses={billingAddresses}
            orgWithEnseigne={orgWithEnseigne}
            hasEnseigne={hasEnseigne}
            isOpen={billingAddressOpen}
            showNewForm={showNewBillingAddressForm}
            isComplete={!!data.billingAddress}
            createAddressPending={createAddress.isPending}
            onToggle={() => setBillingAddressOpen(!billingAddressOpen)}
            onSelectEnseigne={handlers.handleSelectBillingAddressEnseigne}
            onSelectRestaurant={handlers.handleSelectBillingAddressRestaurant}
            onSelectExisting={handlers.handleSelectBillingAddressExisting}
            onShowNewForm={() => setShowNewBillingAddressForm(true)}
            onHideNewForm={() => setShowNewBillingAddressForm(false)}
            onCreateAddress={handlers.handleCreateBillingAddress}
          />

          <DeliveryContactSection
            contacts={contacts}
            deliveryContactId={data.deliveryContact?.id}
            deliverySameAsBillingContact={data.deliverySameAsBillingContact}
            deliveryContactName={
              data.deliveryContact
                ? `${data.deliveryContact.firstName} ${data.deliveryContact.lastName}`
                : undefined
            }
            isOpen={deliveryContactOpen}
            showNewForm={showNewDeliveryContactForm}
            isComplete={
              data.deliverySameAsBillingContact || !!data.deliveryContact
            }
            createContactPending={createContact.isPending}
            onToggle={() => setDeliveryContactOpen(!deliveryContactOpen)}
            onSameAsBillingChange={
              handlers.handleDeliverySameAsBillingContactChange
            }
            onSelectContact={handlers.handleSelectDeliveryContact}
            onShowNewForm={() => setShowNewDeliveryContactForm(true)}
            onHideNewForm={() => setShowNewDeliveryContactForm(false)}
            onCreateContact={handlers.handleCreateDeliveryContact}
          />

          <DeliveryAddressSection
            deliveryAddress={data.deliveryAddress}
            deliverySameAsBillingAddress={data.deliverySameAsBillingAddress}
            orgWithEnseigne={orgWithEnseigne}
            isOpen={deliveryAddressOpen}
            showNewForm={showNewDeliveryAddressForm}
            isComplete={
              data.deliverySameAsBillingAddress || !!data.deliveryAddress
            }
            createAddressPending={createAddress.isPending}
            onToggle={() => setDeliveryAddressOpen(!deliveryAddressOpen)}
            onSameAsBillingChange={
              handlers.handleDeliverySameAsBillingAddressChange
            }
            onSelectRestaurant={handlers.handleSelectDeliveryAddressRestaurant}
            onShowNewForm={() => setShowNewDeliveryAddressForm(true)}
            onHideNewForm={() => setShowNewDeliveryAddressForm(false)}
            onCreateAddress={handlers.handleCreateDeliveryAddress}
          />
        </div>
      )}
    </div>
  );
}

export default ContactsAddressesSection;
