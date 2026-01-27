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

import { useState, useCallback } from 'react';

import { User, MapPin, Loader2, ChevronDown, Check } from 'lucide-react';

import { cn, Checkbox, Label } from '@verone/ui';

import {
  useOrganisationContactsBO,
  useCreateContactBO,
  type ContactBO,
} from '../../hooks/use-organisation-contacts-bo';
import {
  useOrganisationAddressesBO,
  useCreateAddressBO,
  type AddressBO,
} from '../../hooks/use-organisation-addresses-bo';
import { useOrganisationWithEnseigne } from '../../hooks/use-enseigne-details';

import { ContactCardBO, CreateNewContactCard } from './ContactCardBO';
import {
  OrganisationAddressCard,
  EnseigneParentCard,
  CreateNewAddressCard,
} from './OrganisationAddressCard';
import { NewContactForm, type NewContactFormData } from './NewContactForm';
import { NewAddressForm, type NewAddressFormData } from './NewAddressForm';

// ============================================================================
// TYPES
// ============================================================================

/** Selected billing/delivery contact */
export interface SelectedContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

/** Selected billing/delivery address */
export interface SelectedAddress {
  mode: 'restaurant' | 'enseigne' | 'existing' | 'new';
  addressId?: string | null;
  customAddress?: {
    addressLine1: string;
    postalCode: string;
    city: string;
    country: string;
  } | null;
}

export interface ContactsAddressesData {
  billingContact: SelectedContact | null;
  billingAddress: SelectedAddress | null;
  deliveryContact: SelectedContact | null;
  deliverySameAsBillingContact: boolean;
  deliveryAddress: SelectedAddress | null;
  deliverySameAsBillingAddress: boolean;
}

interface ContactsAddressesSectionProps {
  /** ID de l'organisation (restaurant) sélectionnée */
  organisationId: string | null;
  /** Données actuelles */
  data: ContactsAddressesData;
  /** Callback de mise à jour */
  onUpdate: (data: Partial<ContactsAddressesData>) => void;
  /** Afficher cette section */
  visible?: boolean;
}

// ============================================================================
// SUB-COMPONENT: Section Header
// ============================================================================

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  isComplete?: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

function SectionHeader({
  icon,
  title,
  subtitle,
  isComplete = false,
  isOpen,
  onToggle,
}: SectionHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            isComplete
              ? 'bg-green-100 text-green-600'
              : 'bg-gray-100 text-gray-500'
          )}
        >
          {isComplete ? <Check className="h-4 w-4" /> : icon}
        </div>
        <div className="text-left">
          <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <ChevronDown
        className={cn(
          'h-4 w-4 text-gray-400 transition-transform',
          isOpen && 'rotate-180'
        )}
      />
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ContactsAddressesSection({
  organisationId,
  data,
  onUpdate,
  visible = true,
}: ContactsAddressesSectionProps) {
  // Section states
  const [billingContactOpen, setBillingContactOpen] = useState(true);
  const [billingAddressOpen, setBillingAddressOpen] = useState(false);
  const [deliveryContactOpen, setDeliveryContactOpen] = useState(false);
  const [deliveryAddressOpen, setDeliveryAddressOpen] = useState(false);

  // Form states
  const [showNewBillingContactForm, setShowNewBillingContactForm] =
    useState(false);
  const [showNewBillingAddressForm, setShowNewBillingAddressForm] =
    useState(false);
  const [showNewDeliveryContactForm, setShowNewDeliveryContactForm] =
    useState(false);
  const [showNewDeliveryAddressForm, setShowNewDeliveryAddressForm] =
    useState(false);

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
  const contacts = contactsData?.contacts || [];
  const billingAddresses = addressesData?.billing || [];
  const hasEnseigne = !!orgWithEnseigne?.enseigne;

  // Completion status
  const billingContactComplete = !!data.billingContact;
  const billingAddressComplete = !!data.billingAddress;
  const deliveryContactComplete =
    data.deliverySameAsBillingContact || !!data.deliveryContact;
  const deliveryAddressComplete =
    data.deliverySameAsBillingAddress || !!data.deliveryAddress;

  // ============================================================================
  // HANDLERS: Billing Contact
  // ============================================================================

  const handleSelectBillingContact = useCallback(
    (contact: ContactBO) => {
      onUpdate({
        billingContact: {
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
        },
      });
      setShowNewBillingContactForm(false);
      // Auto-open next section
      setBillingContactOpen(false);
      setBillingAddressOpen(true);
    },
    [onUpdate]
  );

  const handleCreateBillingContact = useCallback(
    async (formData: NewContactFormData) => {
      if (!organisationId) return;

      const result = await createContact.mutateAsync({
        organisationId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        title: formData.title || undefined,
        isBillingContact: true,
      });

      onUpdate({
        billingContact: {
          id: result.id,
          firstName: result.first_name,
          lastName: result.last_name,
          email: result.email,
          phone: null,
        },
      });
      setShowNewBillingContactForm(false);
      setBillingContactOpen(false);
      setBillingAddressOpen(true);
    },
    [organisationId, createContact, onUpdate]
  );

  // ============================================================================
  // HANDLERS: Billing Address
  // ============================================================================

  const handleSelectBillingAddressEnseigne = useCallback(() => {
    onUpdate({
      billingAddress: {
        mode: 'enseigne',
        addressId: null,
        customAddress: null,
      },
    });
    setShowNewBillingAddressForm(false);
    setBillingAddressOpen(false);
    setDeliveryContactOpen(true);
  }, [onUpdate]);

  const handleSelectBillingAddressRestaurant = useCallback(() => {
    onUpdate({
      billingAddress: {
        mode: 'restaurant',
        addressId: null,
        customAddress: null,
      },
    });
    setShowNewBillingAddressForm(false);
    setBillingAddressOpen(false);
    setDeliveryContactOpen(true);
  }, [onUpdate]);

  const handleSelectBillingAddressExisting = useCallback(
    (address: AddressBO) => {
      onUpdate({
        billingAddress: {
          mode: 'existing',
          addressId: address.id,
          customAddress: null,
        },
      });
      setShowNewBillingAddressForm(false);
      setBillingAddressOpen(false);
      setDeliveryContactOpen(true);
    },
    [onUpdate]
  );

  const handleCreateBillingAddress = useCallback(
    async (formData: NewAddressFormData) => {
      if (!organisationId) return;

      await createAddress.mutateAsync({
        ownerId: organisationId,
        ownerType: 'organisation',
        addressType: 'billing',
        label: formData.label || undefined,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2 || undefined,
        postalCode: formData.postalCode,
        city: formData.city,
        country: formData.country,
        legalName: formData.legalName || undefined,
        siret: formData.siret || undefined,
        vatNumber: formData.vatNumber || undefined,
      });

      onUpdate({
        billingAddress: {
          mode: 'new',
          addressId: null,
          customAddress: {
            addressLine1: formData.addressLine1,
            postalCode: formData.postalCode,
            city: formData.city,
            country: formData.country,
          },
        },
      });
      setShowNewBillingAddressForm(false);
      setBillingAddressOpen(false);
      setDeliveryContactOpen(true);
    },
    [organisationId, createAddress, onUpdate]
  );

  // ============================================================================
  // HANDLERS: Delivery Contact (similar to billing)
  // ============================================================================

  const handleDeliverySameAsBillingContactChange = useCallback(
    (checked: boolean) => {
      onUpdate({
        deliverySameAsBillingContact: checked,
        deliveryContact: checked ? null : data.deliveryContact,
      });
      if (checked) {
        setDeliveryContactOpen(false);
        setDeliveryAddressOpen(true);
      }
    },
    [onUpdate, data.deliveryContact]
  );

  const handleSelectDeliveryContact = useCallback(
    (contact: ContactBO) => {
      onUpdate({
        deliveryContact: {
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
        },
        deliverySameAsBillingContact: false,
      });
      setShowNewDeliveryContactForm(false);
      setDeliveryContactOpen(false);
      setDeliveryAddressOpen(true);
    },
    [onUpdate]
  );

  const handleCreateDeliveryContact = useCallback(
    async (formData: NewContactFormData) => {
      if (!organisationId) return;

      const result = await createContact.mutateAsync({
        organisationId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        title: formData.title || undefined,
        isDeliveryContact: true,
      });

      onUpdate({
        deliveryContact: {
          id: result.id,
          firstName: result.first_name,
          lastName: result.last_name,
          email: result.email,
          phone: null,
        },
        deliverySameAsBillingContact: false,
      });
      setShowNewDeliveryContactForm(false);
      setDeliveryContactOpen(false);
      setDeliveryAddressOpen(true);
    },
    [organisationId, createContact, onUpdate]
  );

  // ============================================================================
  // HANDLERS: Delivery Address
  // ============================================================================

  const handleDeliverySameAsBillingAddressChange = useCallback(
    (checked: boolean) => {
      onUpdate({
        deliverySameAsBillingAddress: checked,
        deliveryAddress: checked ? null : data.deliveryAddress,
      });
      if (checked) {
        setDeliveryAddressOpen(false);
      }
    },
    [onUpdate, data.deliveryAddress]
  );

  const handleSelectDeliveryAddressRestaurant = useCallback(() => {
    onUpdate({
      deliveryAddress: {
        mode: 'restaurant',
        addressId: null,
        customAddress: null,
      },
      deliverySameAsBillingAddress: false,
    });
    setShowNewDeliveryAddressForm(false);
    setDeliveryAddressOpen(false);
  }, [onUpdate]);

  const handleCreateDeliveryAddress = useCallback(
    async (formData: NewAddressFormData) => {
      if (!organisationId) return;

      await createAddress.mutateAsync({
        ownerId: organisationId,
        ownerType: 'organisation',
        addressType: 'shipping',
        label: formData.label || undefined,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2 || undefined,
        postalCode: formData.postalCode,
        city: formData.city,
        country: formData.country,
      });

      onUpdate({
        deliveryAddress: {
          mode: 'new',
          addressId: null,
          customAddress: {
            addressLine1: formData.addressLine1,
            postalCode: formData.postalCode,
            city: formData.city,
            country: formData.country,
          },
        },
        deliverySameAsBillingAddress: false,
      });
      setShowNewDeliveryAddressForm(false);
      setDeliveryAddressOpen(false);
    },
    [organisationId, createAddress, onUpdate]
  );

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
          {/* ============================================ */}
          {/* 1. CONTACT DE FACTURATION */}
          {/* ============================================ */}
          <div className="border rounded-lg overflow-hidden">
            <SectionHeader
              icon={<User className="h-4 w-4" />}
              title="Contact de facturation"
              subtitle={
                data.billingContact
                  ? `${data.billingContact.firstName} ${data.billingContact.lastName}`
                  : 'Sélectionnez un contact'
              }
              isComplete={billingContactComplete}
              isOpen={billingContactOpen}
              onToggle={() => setBillingContactOpen(!billingContactOpen)}
            />

            {billingContactOpen && (
              <div className="p-4 pt-0 space-y-3">
                {/* Contacts grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {contacts.map(contact => (
                    <ContactCardBO
                      key={contact.id}
                      contact={contact}
                      isSelected={data.billingContact?.id === contact.id}
                      onClick={() => handleSelectBillingContact(contact)}
                    />
                  ))}
                  <CreateNewContactCard
                    onClick={() => setShowNewBillingContactForm(true)}
                    isActive={showNewBillingContactForm}
                  />
                </div>

                {/* New contact form */}
                {showNewBillingContactForm && (
                  <NewContactForm
                    onSubmit={handleCreateBillingContact}
                    onCancel={() => setShowNewBillingContactForm(false)}
                    isSubmitting={createContact.isPending}
                    sectionLabel="Nouveau contact de facturation"
                  />
                )}
              </div>
            )}
          </div>

          {/* ============================================ */}
          {/* 2. ADRESSE DE FACTURATION */}
          {/* ============================================ */}
          <div className="border rounded-lg overflow-hidden">
            <SectionHeader
              icon={<MapPin className="h-4 w-4" />}
              title="Adresse de facturation"
              subtitle={
                data.billingAddress?.mode === 'enseigne'
                  ? `Enseigne: ${orgWithEnseigne?.enseigne?.name}`
                  : data.billingAddress?.mode === 'restaurant'
                    ? `Restaurant: ${orgWithEnseigne?.tradeName || orgWithEnseigne?.legalName}`
                    : data.billingAddress?.customAddress
                      ? data.billingAddress.customAddress.city
                      : 'Sélectionnez une adresse'
              }
              isComplete={billingAddressComplete}
              isOpen={billingAddressOpen}
              onToggle={() => setBillingAddressOpen(!billingAddressOpen)}
            />

            {billingAddressOpen && (
              <div className="p-4 pt-0 space-y-3">
                {/* Address options grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {/* Enseigne parent option */}
                  {hasEnseigne && orgWithEnseigne?.enseigne && (
                    <EnseigneParentCard
                      name={orgWithEnseigne.enseigne.name}
                      logoUrl={orgWithEnseigne.enseigne.logoUrl}
                      address={orgWithEnseigne.enseigne.address}
                      isSelected={data.billingAddress?.mode === 'enseigne'}
                      onClick={handleSelectBillingAddressEnseigne}
                    />
                  )}

                  {/* Restaurant option */}
                  {orgWithEnseigne && (
                    <OrganisationAddressCard
                      id={orgWithEnseigne.id}
                      name={
                        orgWithEnseigne.tradeName || orgWithEnseigne.legalName
                      }
                      logoUrl={orgWithEnseigne.logoUrl}
                      ownershipType={orgWithEnseigne.ownershipType}
                      address={orgWithEnseigne.address}
                      label="Restaurant"
                      isSelected={data.billingAddress?.mode === 'restaurant'}
                      onClick={handleSelectBillingAddressRestaurant}
                    />
                  )}

                  {/* Existing billing addresses */}
                  {billingAddresses.map(address => (
                    <OrganisationAddressCard
                      key={address.id}
                      id={address.id}
                      name={address.label || address.addressLine1}
                      address={{
                        line1: address.addressLine1,
                        line2: address.addressLine2,
                        postalCode: address.postalCode,
                        city: address.city,
                        country: address.country,
                      }}
                      isSelected={
                        data.billingAddress?.mode === 'existing' &&
                        data.billingAddress.addressId === address.id
                      }
                      onClick={() =>
                        handleSelectBillingAddressExisting(address)
                      }
                    />
                  ))}

                  {/* New address card */}
                  <CreateNewAddressCard
                    onClick={() => setShowNewBillingAddressForm(true)}
                    isActive={showNewBillingAddressForm}
                    label="Nouvelle adresse de facturation"
                  />
                </div>

                {/* New address form */}
                {showNewBillingAddressForm && (
                  <NewAddressForm
                    onSubmit={handleCreateBillingAddress}
                    onCancel={() => setShowNewBillingAddressForm(false)}
                    isSubmitting={createAddress.isPending}
                    sectionLabel="Nouvelle adresse de facturation"
                    showLegalFields
                    defaultCountry={orgWithEnseigne?.address?.country || 'FR'}
                  />
                )}
              </div>
            )}
          </div>

          {/* ============================================ */}
          {/* 3. CONTACT DE LIVRAISON */}
          {/* ============================================ */}
          <div className="border rounded-lg overflow-hidden">
            <SectionHeader
              icon={<User className="h-4 w-4" />}
              title="Contact de livraison"
              subtitle={
                data.deliverySameAsBillingContact
                  ? 'Identique au contact de facturation'
                  : data.deliveryContact
                    ? `${data.deliveryContact.firstName} ${data.deliveryContact.lastName}`
                    : 'Sélectionnez un contact'
              }
              isComplete={deliveryContactComplete}
              isOpen={deliveryContactOpen}
              onToggle={() => setDeliveryContactOpen(!deliveryContactOpen)}
            />

            {deliveryContactOpen && (
              <div className="p-4 pt-0 space-y-3">
                {/* Same as billing checkbox */}
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Checkbox
                    id="delivery-same-billing-contact"
                    checked={data.deliverySameAsBillingContact}
                    onCheckedChange={handleDeliverySameAsBillingContactChange}
                  />
                  <Label
                    htmlFor="delivery-same-billing-contact"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Identique au contact de facturation
                  </Label>
                </div>

                {/* Contact grid (if not same as billing) */}
                {!data.deliverySameAsBillingContact && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {contacts.map(contact => (
                        <ContactCardBO
                          key={contact.id}
                          contact={contact}
                          isSelected={data.deliveryContact?.id === contact.id}
                          onClick={() => handleSelectDeliveryContact(contact)}
                        />
                      ))}
                      <CreateNewContactCard
                        onClick={() => setShowNewDeliveryContactForm(true)}
                        isActive={showNewDeliveryContactForm}
                      />
                    </div>

                    {showNewDeliveryContactForm && (
                      <NewContactForm
                        onSubmit={handleCreateDeliveryContact}
                        onCancel={() => setShowNewDeliveryContactForm(false)}
                        isSubmitting={createContact.isPending}
                        sectionLabel="Nouveau contact de livraison"
                      />
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* ============================================ */}
          {/* 4. ADRESSE DE LIVRAISON */}
          {/* ============================================ */}
          <div className="border rounded-lg overflow-hidden">
            <SectionHeader
              icon={<MapPin className="h-4 w-4" />}
              title="Adresse de livraison"
              subtitle={
                data.deliverySameAsBillingAddress
                  ? 'Identique à la facturation'
                  : data.deliveryAddress?.mode === 'restaurant'
                    ? `Restaurant: ${orgWithEnseigne?.tradeName || orgWithEnseigne?.legalName}`
                    : data.deliveryAddress?.customAddress
                      ? data.deliveryAddress.customAddress.city
                      : 'Sélectionnez une adresse'
              }
              isComplete={deliveryAddressComplete}
              isOpen={deliveryAddressOpen}
              onToggle={() => setDeliveryAddressOpen(!deliveryAddressOpen)}
            />

            {deliveryAddressOpen && (
              <div className="p-4 pt-0 space-y-3">
                {/* Same as billing checkbox */}
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Checkbox
                    id="delivery-same-billing-address"
                    checked={data.deliverySameAsBillingAddress}
                    onCheckedChange={handleDeliverySameAsBillingAddressChange}
                  />
                  <Label
                    htmlFor="delivery-same-billing-address"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Identique à l&apos;adresse de facturation
                  </Label>
                </div>

                {/* Address grid (if not same as billing) */}
                {!data.deliverySameAsBillingAddress && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {/* Restaurant option (default for delivery) */}
                      {orgWithEnseigne && (
                        <OrganisationAddressCard
                          id={orgWithEnseigne.id}
                          name={
                            orgWithEnseigne.tradeName ||
                            orgWithEnseigne.legalName
                          }
                          logoUrl={orgWithEnseigne.logoUrl}
                          ownershipType={orgWithEnseigne.ownershipType}
                          address={orgWithEnseigne.address}
                          label="Adresse du restaurant"
                          isSelected={
                            data.deliveryAddress?.mode === 'restaurant'
                          }
                          onClick={handleSelectDeliveryAddressRestaurant}
                        />
                      )}

                      {/* New address card */}
                      <CreateNewAddressCard
                        onClick={() => setShowNewDeliveryAddressForm(true)}
                        isActive={showNewDeliveryAddressForm}
                        label="Nouvelle adresse de livraison"
                      />
                    </div>

                    {showNewDeliveryAddressForm && (
                      <NewAddressForm
                        onSubmit={handleCreateDeliveryAddress}
                        onCancel={() => setShowNewDeliveryAddressForm(false)}
                        isSubmitting={createAddress.isPending}
                        sectionLabel="Nouvelle adresse de livraison"
                        defaultCountry={
                          orgWithEnseigne?.address?.country || 'FR'
                        }
                      />
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ContactsAddressesSection;
