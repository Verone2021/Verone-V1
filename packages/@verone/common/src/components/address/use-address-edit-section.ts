'use client';

import type { AddressResult } from '@verone/ui';

import { useInlineEdit, type EditableSection } from '@verone/common/hooks';

import type { Organisation } from './address-edit.types';

export function useAddressEditSection(
  organisation: Organisation,
  onUpdate: (updatedOrganisation: Partial<Organisation>) => void
) {
  const {
    isEditing,
    isSaving,
    getError,
    getEditedData,
    startEdit,
    cancelEdit,
    updateEditedData,
    saveChanges,
    hasChanges,
  } = useInlineEdit({
    organisationId: organisation.id,
    onUpdate: (updatedData: Partial<Organisation>) => {
      onUpdate(updatedData);
    },
    onError: error => {
      console.error('❌ Erreur mise à jour adresse:', error);
    },
  });

  const section: EditableSection = 'address';
  const editData = getEditedData(section) as Organisation | null;
  const error = getError(section);

  const handleStartEdit = () => {
    const billingData = {
      billing_address_line1:
        organisation.billing_address_line1 ?? organisation.address_line1 ?? '',
      billing_address_line2:
        organisation.billing_address_line2 ?? organisation.address_line2 ?? '',
      billing_postal_code:
        organisation.billing_postal_code ?? organisation.postal_code ?? '',
      billing_city: organisation.billing_city ?? organisation.city ?? '',
      billing_region: organisation.billing_region ?? organisation.region ?? '',
      billing_country:
        organisation.billing_country ?? organisation.country ?? 'FR',
    };

    startEdit(section, {
      address_line1: organisation.address_line1 ?? '',
      address_line2: organisation.address_line2 ?? '',
      postal_code: organisation.postal_code ?? '',
      city: organisation.city ?? '',
      region: organisation.region ?? '',
      country: organisation.country ?? 'FR',
      ...billingData,
      shipping_address_line1: organisation.shipping_address_line1 ?? '',
      shipping_address_line2: organisation.shipping_address_line2 ?? '',
      shipping_postal_code: organisation.shipping_postal_code ?? '',
      shipping_city: organisation.shipping_city ?? '',
      shipping_region: organisation.shipping_region ?? '',
      shipping_country: organisation.shipping_country ?? 'FR',
      latitude: organisation.latitude ?? null,
      longitude: organisation.longitude ?? null,
      has_different_shipping_address:
        organisation.has_different_shipping_address ?? false,
    });
  };

  const handleSave = async () => {
    const cleanedData = Object.fromEntries(
      Object.entries(editData ?? {}).map(([key, val]) => {
        if (typeof val === 'string') {
          const trimmed = val.trim();
          return [key, trimmed === '' ? null : trimmed];
        }
        return [key, val];
      })
    );
    updateEditedData(section, cleanedData);
    await new Promise(resolve => setTimeout(resolve, 0));
    const success = await saveChanges(section);
    if (success) console.warn('✅ Adresse mise à jour avec succès');
  };

  const handleCancel = () => cancelEdit(section);

  const copyAddressToClipboard = async (
    addressData: Record<string, string | null | undefined>,
    title: string
  ) => {
    const lines = [
      addressData.line1,
      addressData.line2,
      addressData.postal_code && addressData.city
        ? `${addressData.postal_code} ${addressData.city}`
        : (addressData.city ?? addressData.postal_code),
      addressData.region,
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      console.warn(`✅ ${title} copiée dans le presse-papiers`);
    } catch (err) {
      console.error('❌ Erreur lors de la copie:', err);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    let processedValue = value;
    if (
      (field.includes('postal_code') || field === 'postal_code') &&
      processedValue.length <= 5
    ) {
      processedValue = processedValue.replace(/\D/g, '');
    }
    if (
      field.includes('city') ||
      field.includes('region') ||
      field === 'city' ||
      field === 'region'
    ) {
      processedValue = processedValue
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    updateEditedData(section, { [field]: processedValue ?? null });
  };

  const handleBillingAddressSelect = (address: AddressResult) => {
    const updates: Record<string, unknown> = {
      billing_address_line1: address.streetAddress,
      billing_city: address.city,
      billing_postal_code: address.postalCode,
      billing_region: address.region ?? '',
      billing_country: address.countryCode ?? 'FR',
    };
    if (!editData?.has_different_shipping_address) {
      updates.latitude = address.latitude ?? null;
      updates.longitude = address.longitude ?? null;
    }
    updateEditedData(section, updates);
  };

  const handleShippingAddressSelect = (address: AddressResult) => {
    updateEditedData(section, {
      shipping_address_line1: address.streetAddress,
      shipping_city: address.city,
      shipping_postal_code: address.postalCode,
      shipping_region: address.region ?? '',
      shipping_country: address.countryCode ?? 'FR',
      latitude: address.latitude ?? null,
      longitude: address.longitude ?? null,
    });
  };

  const handleCopyShippingToBilling = () => {
    updateEditedData(section, {
      billing_address_line1: editData?.shipping_address_line1 ?? '',
      billing_address_line2: editData?.shipping_address_line2 ?? '',
      billing_postal_code: editData?.shipping_postal_code ?? '',
      billing_city: editData?.shipping_city ?? '',
      billing_region: editData?.shipping_region ?? '',
      billing_country: editData?.shipping_country ?? 'FR',
    });
  };

  const handleToggleDifferentShipping = (checked: boolean) => {
    updateEditedData(section, { has_different_shipping_address: checked });
    if (!checked) {
      updateEditedData(section, {
        shipping_address_line1: '',
        shipping_address_line2: '',
        shipping_postal_code: '',
        shipping_city: '',
        shipping_region: '',
        shipping_country: 'FR',
      });
    }
  };

  return {
    section,
    editData,
    error,
    isEditing: isEditing(section),
    isSaving: isSaving(section),
    hasChanges: hasChanges(section),
    handleStartEdit,
    handleSave,
    handleCancel,
    handleFieldChange,
    handleBillingAddressSelect,
    handleShippingAddressSelect,
    handleCopyShippingToBilling,
    handleToggleDifferentShipping,
    copyAddressToClipboard,
  };
}
