'use client';

/**
 * use-billing-step - Hook logique métier pour BillingStep
 *
 * Extrait les handlers, états dérivés et effets du composant BillingStep.
 *
 * @module use-billing-step
 * @since 2026-04-14
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

import { useEnseigneId } from '@/lib/hooks/use-enseigne-id';
import { useOrganisationDetail } from '@/lib/hooks/use-organisation-detail';
import { useParentOrganisationAddresses } from '@/lib/hooks/use-parent-organisation-addresses';
import { useUpdateOrganisationAddress } from '@/lib/hooks/use-update-organisation-address';

import type {
  OrderFormData,
  ContactsStepData,
  ContactBase,
  BillingContactData,
  BillingAddressData,
  PartialAddressData,
} from '../../schemas/order-form.schema';
import { defaultContact } from '../../schemas/order-form.schema';

// ============================================================================
// TYPES
// ============================================================================

interface InitialAddressValues {
  tradeName: string;
  legalName: string;
  siret: string;
  vatNumber: string;
  addressLine1: string;
  postalCode: string;
  city: string;
  country: string;
}

// ============================================================================
// HOOK
// ============================================================================

export function useBillingStep(
  formData: OrderFormData,
  onUpdate: (data: Partial<ContactsStepData>) => void
) {
  const [showContactForm, setShowContactForm] = useState(
    formData.contacts.billingContact.mode === 'new'
  );

  const initialAddressRef = useRef<InitialAddressValues | null>(null);
  const enseigneId = useEnseigneId();

  const organisationId =
    formData.restaurant.mode === 'existing'
      ? (formData.restaurant.existingId ?? null)
      : null;

  const ownershipType = useMemo(() => {
    if (formData.restaurant.mode === 'new') {
      return formData.restaurant.newRestaurant?.ownershipType ?? null;
    }
    return formData.restaurant.existingOwnershipType ?? null;
  }, [formData.restaurant]);

  const isFranchise = ownershipType === 'franchise';

  const {
    parentOrg,
    primaryAddress: parentPrimaryAddress,
    isLoading: parentLoading,
  } = useParentOrganisationAddresses(!isFranchise ? enseigneId : null);

  const { data: restaurantDetail, isLoading: restaurantDetailLoading } =
    useOrganisationDetail(organisationId);

  const { mutate: updateOrganisation, isPending: isSaving } =
    useUpdateOrganisationAddress();

  // Restaurant info
  const restaurantInfo = useMemo(() => {
    if (
      formData.restaurant.mode !== 'existing' ||
      !formData.restaurant.existingId
    ) {
      return null;
    }
    const org = restaurantDetail?.organisation;
    return {
      id: formData.restaurant.existingId,
      name: formData.restaurant.existingName ?? null,
      city: formData.restaurant.existingCity ?? null,
      country: formData.restaurant.existingCountry ?? null,
      legalName: org?.legal_name ?? null,
      tradeName: org?.trade_name ?? null,
      addressLine1:
        org?.billing_address_line1 ?? org?.shipping_address_line1 ?? null,
      postalCode: org?.billing_postal_code ?? org?.shipping_postal_code ?? null,
      billingCity: org?.billing_city ?? org?.shipping_city ?? null,
      siret: org?.siret ?? null,
      vatNumber: org?.vat_number ?? null,
    };
  }, [formData.restaurant, restaurantDetail]);

  const showParentAddress =
    !isFranchise && !!parentOrg && !!parentPrimaryAddress;

  // Unsaved changes detection
  const hasUnsavedChanges = useMemo(() => {
    if (!initialAddressRef.current) return false;
    const current = formData.contacts.billingAddress.customAddress;
    if (!current) return false;
    const initial = initialAddressRef.current;
    return (
      (current.tradeName ?? '') !== initial.tradeName ||
      (current.legalName ?? '') !== initial.legalName ||
      (current.siret ?? '') !== initial.siret ||
      (current.vatNumber ?? '') !== initial.vatNumber ||
      (current.addressLine1 ?? '') !== initial.addressLine1 ||
      (current.postalCode ?? '') !== initial.postalCode ||
      (current.city ?? '') !== initial.city ||
      (current.country ?? 'FR') !== initial.country
    );
  }, [formData.contacts.billingAddress.customAddress]);

  // Completion checks
  const isBillingContactComplete = useMemo(() => {
    const bc = formData.contacts.billingContact;
    if (bc.mode === 'same_as_responsable') return true;
    return !!(
      bc.contact?.firstName &&
      bc.contact?.lastName &&
      bc.contact?.email?.includes('@')
    );
  }, [formData.contacts.billingContact]);

  const isBillingAddressComplete = useMemo(() => {
    const ba = formData.contacts.billingAddress;
    switch (ba.mode) {
      case 'restaurant_address':
      case 'parent_address':
        return true;
      case 'new_billing':
        return !!(
          ba.customAddress?.addressLine1 &&
          ba.customAddress?.postalCode &&
          ba.customAddress?.city
        );
      default:
        return false;
    }
  }, [formData.contacts.billingAddress]);

  // ========== CONTACT HANDLERS ==========

  const handleBillingContactUpdate = useCallback(
    (data: Partial<BillingContactData>) => {
      onUpdate({
        billingContact: { ...formData.contacts.billingContact, ...data },
      });
    },
    [formData.contacts.billingContact, onUpdate]
  );

  const handleBillingContactSameAsResponsable = useCallback(() => {
    const newMode =
      formData.contacts.billingContact.mode === 'same_as_responsable'
        ? 'new'
        : 'same_as_responsable';
    handleBillingContactUpdate({
      mode: newMode,
      existingContactId: null,
      contact: newMode === 'new' ? defaultContact : null,
    });
    setShowContactForm(newMode === 'new');
  }, [formData.contacts.billingContact.mode, handleBillingContactUpdate]);

  const handleBillingContactCreateNew = useCallback(() => {
    handleBillingContactUpdate({
      mode: 'new',
      existingContactId: null,
      contact: defaultContact,
    });
    setShowContactForm(true);
  }, [handleBillingContactUpdate]);

  const handleBillingContactChange = useCallback(
    (field: keyof ContactBase, value: string) => {
      handleBillingContactUpdate({
        contact: {
          ...(formData.contacts.billingContact.contact ?? defaultContact),
          [field]: value,
        },
      });
    },
    [formData.contacts.billingContact.contact, handleBillingContactUpdate]
  );

  // ========== ADDRESS HANDLERS ==========

  const handleBillingAddressUpdate = useCallback(
    (data: Partial<BillingAddressData>) => {
      onUpdate({
        billingAddress: { ...formData.contacts.billingAddress, ...data },
      });
    },
    [formData.contacts.billingAddress, onUpdate]
  );

  const handleSelectRestaurantAddress = useCallback(() => {
    const newAddress: PartialAddressData = {
      tradeName: restaurantInfo?.tradeName ?? restaurantInfo?.name ?? '',
      legalName: restaurantInfo?.legalName ?? '',
      addressLine1: restaurantInfo?.addressLine1 ?? '',
      postalCode: restaurantInfo?.postalCode ?? '',
      city: restaurantInfo?.billingCity ?? restaurantInfo?.city ?? '',
      country: restaurantInfo?.country ?? 'FR',
      siret: restaurantInfo?.siret ?? '',
      vatNumber: restaurantInfo?.vatNumber ?? '',
    };
    initialAddressRef.current = {
      tradeName: newAddress.tradeName ?? '',
      legalName: newAddress.legalName ?? '',
      siret: newAddress.siret ?? '',
      vatNumber: newAddress.vatNumber ?? '',
      addressLine1: newAddress.addressLine1 ?? '',
      postalCode: newAddress.postalCode ?? '',
      city: newAddress.city ?? '',
      country: newAddress.country ?? 'FR',
    };
    handleBillingAddressUpdate({
      mode: 'restaurant_address',
      existingAddressId: null,
      customAddress: newAddress,
      sourceOrganisationId: restaurantInfo?.id ?? null,
    });
  }, [handleBillingAddressUpdate, restaurantInfo]);

  const handleSelectParentAddress = useCallback(() => {
    const newAddress: PartialAddressData = {
      tradeName: parentOrg?.trade_name ?? '',
      legalName: parentOrg?.legal_name ?? '',
      addressLine1: parentPrimaryAddress?.addressLine1 ?? '',
      postalCode: parentPrimaryAddress?.postalCode ?? '',
      city: parentPrimaryAddress?.city ?? '',
      country: 'FR',
      siret: parentPrimaryAddress?.siret ?? '',
      vatNumber: '',
    };
    initialAddressRef.current = {
      tradeName: newAddress.tradeName ?? '',
      legalName: newAddress.legalName ?? '',
      siret: newAddress.siret ?? '',
      vatNumber: '',
      addressLine1: newAddress.addressLine1 ?? '',
      postalCode: newAddress.postalCode ?? '',
      city: newAddress.city ?? '',
      country: 'FR',
    };
    handleBillingAddressUpdate({
      mode: 'parent_address',
      existingAddressId: null,
      customAddress: newAddress,
      sourceOrganisationId: parentOrg?.id ?? null,
    });
  }, [handleBillingAddressUpdate, parentOrg, parentPrimaryAddress]);

  const handleCreateNewAddress = useCallback(() => {
    initialAddressRef.current = null;
    handleBillingAddressUpdate({
      mode: 'new_billing',
      existingAddressId: null,
      customAddress: {
        addressLine1: '',
        postalCode: '',
        city: '',
        country: restaurantInfo?.country ?? 'FR',
        tradeName: '',
        legalName: '',
        siret: '',
        vatNumber: '',
      },
      sourceOrganisationId: null,
    });
  }, [handleBillingAddressUpdate, restaurantInfo?.country]);

  const handleAddressChange = useCallback(
    (address: PartialAddressData) => {
      handleBillingAddressUpdate({ customAddress: address });
    },
    [handleBillingAddressUpdate]
  );

  const handleReplaceExistingChange = useCallback(
    (checked: boolean) => {
      handleBillingAddressUpdate({ replaceExistingAddress: checked });
    },
    [handleBillingAddressUpdate]
  );

  const handleSetAsDefaultChange = useCallback(
    (checked: boolean) => {
      handleBillingAddressUpdate({ setAsDefault: checked });
    },
    [handleBillingAddressUpdate]
  );

  const handleSaveAddress = useCallback(() => {
    const sourceId = formData.contacts.billingAddress.sourceOrganisationId;
    const currentAddress = formData.contacts.billingAddress.customAddress;
    if (!sourceId || !currentAddress) return;
    updateOrganisation(
      {
        organisationId: sourceId,
        addressData: {
          billing_address_line1: currentAddress.addressLine1 ?? null,
          billing_postal_code: currentAddress.postalCode ?? null,
          billing_city: currentAddress.city ?? null,
          billing_country: currentAddress.country ?? 'FR',
          siret: currentAddress.siret ?? null,
          vat_number: currentAddress.vatNumber ?? null,
          legal_name: currentAddress.legalName ?? null,
          trade_name: currentAddress.tradeName ?? null,
        },
      },
      {
        onSuccess: () => {
          if (currentAddress) {
            initialAddressRef.current = {
              tradeName: currentAddress.tradeName ?? '',
              legalName: currentAddress.legalName ?? '',
              siret: currentAddress.siret ?? '',
              vatNumber: currentAddress.vatNumber ?? '',
              addressLine1: currentAddress.addressLine1 ?? '',
              postalCode: currentAddress.postalCode ?? '',
              city: currentAddress.city ?? '',
              country: currentAddress.country ?? 'FR',
            };
          }
        },
      }
    );
  }, [formData.contacts.billingAddress, updateOrganisation]);

  // Auto-selection at mount
  useEffect(() => {
    if (
      restaurantInfo &&
      !restaurantDetailLoading &&
      formData.contacts.billingAddress.mode === 'restaurant_address' &&
      !formData.contacts.billingAddress.customAddress
    ) {
      handleSelectRestaurantAddress();
    }
  }, [
    restaurantInfo,
    restaurantDetailLoading,
    formData.contacts.billingAddress.mode,
    formData.contacts.billingAddress.customAddress,
    handleSelectRestaurantAddress,
  ]);

  return {
    // State
    showContactForm,
    isFranchise,
    isLoading: parentLoading || restaurantDetailLoading,
    isSaving,
    // Derived data
    restaurantInfo,
    parentOrg,
    parentPrimaryAddress,
    showParentAddress,
    hasUnsavedChanges,
    isBillingContactComplete,
    isBillingAddressComplete,
    isEditMode:
      formData.contacts.billingAddress.mode !== 'new_billing' &&
      formData.contacts.billingAddress.customAddress !== null,
    // Contact handlers
    handleBillingContactSameAsResponsable,
    handleBillingContactCreateNew,
    handleBillingContactChange,
    // Address handlers
    handleSelectRestaurantAddress,
    handleSelectParentAddress,
    handleCreateNewAddress,
    handleAddressChange,
    handleReplaceExistingChange,
    handleSetAsDefaultChange,
    handleSaveAddress,
  };
}
