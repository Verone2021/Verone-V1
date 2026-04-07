'use client';

import { useCallback } from 'react';

import type { ContactBO } from '../../hooks/use-organisation-contacts-bo';
import type { useCreateContactBO } from '../../hooks/use-organisation-contacts-bo';
import type { AddressBO } from '../../hooks/use-organisation-addresses-bo';
import type { useCreateAddressBO } from '../../hooks/use-organisation-addresses-bo';
import type { useOrganisationWithEnseigne } from '../../hooks/use-enseigne-details';

import type { NewContactFormData } from './NewContactForm';
import type { NewAddressFormData } from './NewAddressForm';
import type { ContactsAddressesData } from './ContactsAddressesSection.types';

interface UseContactsAddressesHandlersParams {
  organisationId: string | null;
  data: ContactsAddressesData;
  orgWithEnseigne: ReturnType<typeof useOrganisationWithEnseigne>['data'];
  createContact: ReturnType<typeof useCreateContactBO>;
  createAddress: ReturnType<typeof useCreateAddressBO>;
  onUpdate: (data: Partial<ContactsAddressesData>) => void;
  setBillingContactOpen: (v: boolean) => void;
  setBillingAddressOpen: (v: boolean) => void;
  setDeliveryContactOpen: (v: boolean) => void;
  setDeliveryAddressOpen: (v: boolean) => void;
  setShowNewBillingContactForm: (v: boolean) => void;
  setShowNewBillingAddressForm: (v: boolean) => void;
  setShowNewDeliveryContactForm: (v: boolean) => void;
  setShowNewDeliveryAddressForm: (v: boolean) => void;
}

export interface ContactsAddressesHandlers {
  handleSelectBillingContact: (contact: ContactBO) => void;
  handleCreateBillingContact: (formData: NewContactFormData) => Promise<void>;
  handleSelectBillingAddressEnseigne: () => void;
  handleSelectBillingAddressRestaurant: () => void;
  handleSelectBillingAddressExisting: (address: AddressBO) => void;
  handleCreateBillingAddress: (formData: NewAddressFormData) => Promise<void>;
  handleDeliverySameAsBillingContactChange: (checked: boolean) => void;
  handleSelectDeliveryContact: (contact: ContactBO) => void;
  handleCreateDeliveryContact: (formData: NewContactFormData) => Promise<void>;
  handleDeliverySameAsBillingAddressChange: (checked: boolean) => void;
  handleSelectDeliveryAddressRestaurant: () => void;
  handleCreateDeliveryAddress: (formData: NewAddressFormData) => Promise<void>;
}

export function useContactsAddressesHandlers({
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
}: UseContactsAddressesHandlersParams): ContactsAddressesHandlers {
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
      setBillingContactOpen(false);
      setBillingAddressOpen(true);
    },
    [
      onUpdate,
      setShowNewBillingContactForm,
      setBillingContactOpen,
      setBillingAddressOpen,
    ]
  );

  const handleCreateBillingContact = useCallback(
    async (formData: NewContactFormData) => {
      if (!organisationId) return;
      const result = await createContact.mutateAsync({
        organisationId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone ?? undefined,
        title: formData.title ?? undefined,
        isBillingContact: true,
      });
      onUpdate({
        billingContact: {
          id: result.id,
          firstName: result.first_name,
          lastName: result.last_name,
          email: result.email,
          phone: formData.phone ?? null,
        },
      });
      setShowNewBillingContactForm(false);
      setBillingContactOpen(false);
      setBillingAddressOpen(true);
    },
    [
      organisationId,
      createContact,
      onUpdate,
      setShowNewBillingContactForm,
      setBillingContactOpen,
      setBillingAddressOpen,
    ]
  );

  const handleSelectBillingAddressEnseigne = useCallback(() => {
    const enseigneAddr = orgWithEnseigne?.enseigne?.address;
    onUpdate({
      billingAddress: {
        mode: 'enseigne',
        addressId: null,
        customAddress: enseigneAddr?.line1
          ? {
              addressLine1: enseigneAddr.line1,
              postalCode: enseigneAddr.postalCode ?? '',
              city: enseigneAddr.city ?? '',
              country: enseigneAddr.country ?? 'FR',
            }
          : null,
      },
    });
    setShowNewBillingAddressForm(false);
    setBillingAddressOpen(false);
    setDeliveryContactOpen(true);
  }, [
    onUpdate,
    orgWithEnseigne,
    setShowNewBillingAddressForm,
    setBillingAddressOpen,
    setDeliveryContactOpen,
  ]);

  const handleSelectBillingAddressRestaurant = useCallback(() => {
    const restaurantAddr = orgWithEnseigne?.address;
    onUpdate({
      billingAddress: {
        mode: 'restaurant',
        addressId: null,
        customAddress: restaurantAddr?.line1
          ? {
              addressLine1: restaurantAddr.line1,
              postalCode: restaurantAddr.postalCode ?? '',
              city: restaurantAddr.city ?? '',
              country: restaurantAddr.country ?? 'FR',
            }
          : null,
      },
    });
    setShowNewBillingAddressForm(false);
    setBillingAddressOpen(false);
    setDeliveryContactOpen(true);
  }, [
    onUpdate,
    orgWithEnseigne,
    setShowNewBillingAddressForm,
    setBillingAddressOpen,
    setDeliveryContactOpen,
  ]);

  const handleSelectBillingAddressExisting = useCallback(
    (address: AddressBO) => {
      onUpdate({
        billingAddress: {
          mode: 'existing',
          addressId: address.id,
          customAddress: {
            addressLine1: address.addressLine1,
            postalCode: address.postalCode,
            city: address.city,
            country: address.country,
          },
        },
      });
      setShowNewBillingAddressForm(false);
      setBillingAddressOpen(false);
      setDeliveryContactOpen(true);
    },
    [
      onUpdate,
      setShowNewBillingAddressForm,
      setBillingAddressOpen,
      setDeliveryContactOpen,
    ]
  );

  const handleCreateBillingAddress = useCallback(
    async (formData: NewAddressFormData) => {
      if (!organisationId) return;
      await createAddress.mutateAsync({
        ownerId: organisationId,
        ownerType: 'organisation',
        addressType: 'billing',
        label: formData.label ?? undefined,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2 ?? undefined,
        postalCode: formData.postalCode,
        city: formData.city,
        country: formData.country,
        legalName: formData.legalName ?? undefined,
        siret: formData.siret ?? undefined,
        vatNumber: formData.vatNumber ?? undefined,
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
    [
      organisationId,
      createAddress,
      onUpdate,
      setShowNewBillingAddressForm,
      setBillingAddressOpen,
      setDeliveryContactOpen,
    ]
  );

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
    [
      onUpdate,
      data.deliveryContact,
      setDeliveryContactOpen,
      setDeliveryAddressOpen,
    ]
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
    [
      onUpdate,
      setShowNewDeliveryContactForm,
      setDeliveryContactOpen,
      setDeliveryAddressOpen,
    ]
  );

  const handleCreateDeliveryContact = useCallback(
    async (formData: NewContactFormData) => {
      if (!organisationId) return;
      const result = await createContact.mutateAsync({
        organisationId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone ?? undefined,
        title: formData.title ?? undefined,
        isDeliveryContact: true,
      });
      onUpdate({
        deliveryContact: {
          id: result.id,
          firstName: result.first_name,
          lastName: result.last_name,
          email: result.email,
          phone: formData.phone ?? null,
        },
        deliverySameAsBillingContact: false,
      });
      setShowNewDeliveryContactForm(false);
      setDeliveryContactOpen(false);
      setDeliveryAddressOpen(true);
    },
    [
      organisationId,
      createContact,
      onUpdate,
      setShowNewDeliveryContactForm,
      setDeliveryContactOpen,
      setDeliveryAddressOpen,
    ]
  );

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
    [onUpdate, data.deliveryAddress, setDeliveryAddressOpen]
  );

  const handleSelectDeliveryAddressRestaurant = useCallback(() => {
    const restaurantAddr = orgWithEnseigne?.address;
    onUpdate({
      deliveryAddress: {
        mode: 'restaurant',
        addressId: null,
        customAddress: restaurantAddr?.line1
          ? {
              addressLine1: restaurantAddr.line1,
              postalCode: restaurantAddr.postalCode ?? '',
              city: restaurantAddr.city ?? '',
              country: restaurantAddr.country ?? 'FR',
            }
          : null,
      },
      deliverySameAsBillingAddress: false,
    });
    setShowNewDeliveryAddressForm(false);
    setDeliveryAddressOpen(false);
  }, [
    onUpdate,
    orgWithEnseigne,
    setShowNewDeliveryAddressForm,
    setDeliveryAddressOpen,
  ]);

  const handleCreateDeliveryAddress = useCallback(
    async (formData: NewAddressFormData) => {
      if (!organisationId) return;
      await createAddress.mutateAsync({
        ownerId: organisationId,
        ownerType: 'organisation',
        addressType: 'shipping',
        label: formData.label ?? undefined,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2 ?? undefined,
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
    [
      organisationId,
      createAddress,
      onUpdate,
      setShowNewDeliveryAddressForm,
      setDeliveryAddressOpen,
    ]
  );

  return {
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
  };
}
