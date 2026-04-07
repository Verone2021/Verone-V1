'use client';

/**
 * ShippingStep - Etape 7 du formulaire de commande
 *
 * Layout simplifie pour adresse et contact livraison:
 *
 * SECTION 1: ADRESSE DE LIVRAISON (Split-Screen)
 * SECTION 2: CONTACT LIVRAISON (simplifie)
 * SECTION 3: OPTIONS (centre commercial + semi-remorque)
 * SECTION 4: DATE SOUHAITEE (requise)
 * SECTION 5: NOTES
 *
 * @module ShippingStep
 * @since 2026-01-24
 * @updated 2026-02-23 - Simplification: suppression contacts existants, date requise
 * @updated 2026-04-06 - Refactoring max-lines: decomposition en 8 sous-fichiers
 */

import { useEffect, useMemo, useCallback, useState } from 'react';

import {
  useEntityAddresses,
  type Address,
} from '@/lib/hooks/use-entity-addresses';

import type {
  OrderFormData,
  ContactsStepData,
  DeliveryStepData,
  ContactBase,
  DeliverySectionData,
  PartialAddressData,
} from '../../schemas/order-form.schema';
import { defaultContact } from '../../schemas/order-form.schema';
import { AddressSection } from './components/AddressSection';
import { DeliveryContactSection } from './components/DeliveryContactSection';
import { DeliveryOptionsSection } from './components/DeliveryOptionsSection';
import { DateSection } from './components/DateSection';
import { NotesSection } from './components/NotesSection';

interface ShippingStepProps {
  formData: OrderFormData;
  errors: string[];
  onUpdate: (data: Partial<ContactsStepData>) => void;
  onUpdateDelivery: (data: Partial<DeliveryStepData>) => void;
}

export function ShippingStep({
  formData,
  errors: _errors,
  onUpdate,
  onUpdateDelivery,
}: ShippingStepProps) {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );

  const delivery = formData.delivery;

  const organisationId =
    formData.restaurant.mode === 'existing'
      ? (formData.restaurant.existingId ?? null)
      : null;

  const { data: addressesData, isLoading: addressesLoading } =
    useEntityAddresses('organisation', organisationId, 'shipping');

  const shippingAddresses = addressesData?.shipping ?? [];

  const restaurantInfo = useMemo(() => {
    const resto = formData.restaurant;
    if (resto.mode === 'new' && resto.newRestaurant) {
      return {
        id: 'new',
        tradeName: resto.newRestaurant.tradeName ?? null,
        addressLine1: resto.newRestaurant.address ?? null,
        postalCode: resto.newRestaurant.postalCode ?? null,
        city: resto.newRestaurant.city ?? null,
        country: resto.newRestaurant.country ?? 'FR',
      };
    } else if (resto.mode === 'existing' && resto.existingId) {
      return {
        id: resto.existingId,
        tradeName: resto.existingName ?? null,
        addressLine1: resto.existingAddressLine1 ?? null,
        postalCode: resto.existingPostalCode ?? null,
        city: resto.existingCity ?? null,
        country: resto.existingCountry ?? 'FR',
      };
    }
    return null;
  }, [formData.restaurant]);

  const restaurantAddress: Address | null = useMemo(() => {
    if (!restaurantInfo?.city) return null;

    const now = new Date().toISOString();

    return {
      id: 'restaurant',
      ownerType: 'organisation' as const,
      ownerId: organisationId ?? 'unknown',
      addressType: 'shipping' as const,
      sourceApp: 'linkme',
      label: 'Adresse du restaurant',
      legalName: null,
      tradeName: restaurantInfo.tradeName,
      siret: null,
      vatNumber: null,
      addressLine1: restaurantInfo.addressLine1 ?? '',
      addressLine2: null,
      postalCode: restaurantInfo.postalCode ?? '',
      city: restaurantInfo.city,
      region: null,
      country: restaurantInfo.country,
      latitude: null,
      longitude: null,
      contactName: null,
      contactEmail: null,
      contactPhone: null,
      isDefault: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };
  }, [restaurantInfo, organisationId]);

  // Auto-remplir adresse depuis le restaurant (si nouveau)
  useEffect(() => {
    if (
      formData.restaurant.mode === 'new' &&
      formData.restaurant.newRestaurant &&
      !delivery.address &&
      !delivery.city
    ) {
      const newResto = formData.restaurant.newRestaurant;
      if (newResto.city) {
        onUpdateDelivery({
          address: newResto.address ?? '',
          postalCode: newResto.postalCode ?? '',
          city: newResto.city,
        });
      }
    }
  }, [formData.restaurant, delivery.address, delivery.city, onUpdateDelivery]);

  const [addressFormData, setAddressFormData] = useState<PartialAddressData>({
    addressLine1: delivery.address || '',
    postalCode: delivery.postalCode || '',
    city: delivery.city || '',
    country: 'FR',
  });

  // Sync address form data when delivery changes
  useEffect(() => {
    if (delivery.address || delivery.postalCode || delivery.city) {
      setAddressFormData({
        addressLine1: delivery.address || '',
        postalCode: delivery.postalCode || '',
        city: delivery.city || '',
        country: 'FR',
      });
    }
  }, [delivery.address, delivery.postalCode, delivery.city]);

  const isAddressComplete = useMemo(() => {
    return !!(delivery.address && delivery.postalCode && delivery.city);
  }, [delivery.address, delivery.postalCode, delivery.city]);

  const isAddressEditMode = useMemo(() => {
    return selectedAddressId !== null || showAddressForm || isAddressComplete;
  }, [selectedAddressId, showAddressForm, isAddressComplete]);

  // ========================================
  // ADDRESS HANDLERS
  // ========================================

  const handleAddressFormChange = useCallback(
    (newAddress: PartialAddressData) => {
      setAddressFormData(newAddress);
      onUpdateDelivery({
        address: newAddress.addressLine1 ?? '',
        postalCode: newAddress.postalCode ?? '',
        city: newAddress.city ?? '',
      });
    },
    [onUpdateDelivery]
  );

  const handleSelectAddress = useCallback(
    (address: Address) => {
      setSelectedAddressId(address.id);
      setShowAddressForm(false);
      setAddressFormData({
        addressLine1: address.addressLine1,
        postalCode: address.postalCode,
        city: address.city,
        country: address.country || 'FR',
      });
      onUpdateDelivery({
        address: address.addressLine1,
        postalCode: address.postalCode,
        city: address.city,
      });
    },
    [onUpdateDelivery]
  );

  const handleSelectRestaurantAddress = useCallback(() => {
    if (restaurantAddress) {
      setSelectedAddressId('restaurant');
      setShowAddressForm(false);
      setAddressFormData({
        addressLine1: restaurantAddress.addressLine1 || '',
        postalCode: restaurantAddress.postalCode || '',
        city: restaurantAddress.city || '',
        country: restaurantAddress.country || 'FR',
      });
      onUpdateDelivery({
        address: restaurantAddress.addressLine1 || '',
        postalCode: restaurantAddress.postalCode || '',
        city: restaurantAddress.city || '',
      });
    }
  }, [restaurantAddress, onUpdateDelivery]);

  const handleCreateNewAddress = useCallback(() => {
    setSelectedAddressId(null);
    setShowAddressForm(true);
    setAddressFormData({
      addressLine1: '',
      postalCode: '',
      city: '',
      country: 'FR',
    });
    onUpdateDelivery({
      address: '',
      postalCode: '',
      city: '',
    });
  }, [onUpdateDelivery]);

  // ========================================
  // CONTACT HANDLERS
  // ========================================

  const handleDeliveryContactUpdate = useCallback(
    (data: Partial<DeliverySectionData>) => {
      onUpdate({
        delivery: {
          ...formData.contacts.delivery,
          ...data,
        },
      });
    },
    [formData.contacts.delivery, onUpdate]
  );

  const handleSameAsResponsable = useCallback(
    (checked: boolean) => {
      handleDeliveryContactUpdate({
        sameAsResponsable: checked,
        existingContactId: null,
        contact: checked ? null : defaultContact,
      });
    },
    [handleDeliveryContactUpdate]
  );

  const handleContactChange = useCallback(
    (field: keyof ContactBase, value: string) => {
      handleDeliveryContactUpdate({
        contact: {
          ...(formData.contacts.delivery.contact ?? defaultContact),
          [field]: value,
        },
      });
    },
    [formData.contacts.delivery.contact, handleDeliveryContactUpdate]
  );

  // ========================================
  // DELIVERY HANDLERS
  // ========================================

  const handleDeliveryChange = useCallback(
    (field: keyof DeliveryStepData, value: unknown) => {
      onUpdateDelivery({ [field]: value });
    },
    [onUpdateDelivery]
  );

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdateDelivery({ desiredDate: e.target.value || null });
    },
    [onUpdateDelivery]
  );

  return (
    <div className="space-y-6">
      <AddressSection
        isAddressComplete={isAddressComplete}
        isAddressEditMode={isAddressEditMode}
        addressFormData={addressFormData}
        addressesLoading={addressesLoading}
        shippingAddresses={shippingAddresses}
        restaurantAddress={restaurantAddress}
        selectedAddressId={selectedAddressId}
        showAddressForm={showAddressForm}
        onAddressFormChange={handleAddressFormChange}
        onSelectAddress={handleSelectAddress}
        onSelectRestaurantAddress={handleSelectRestaurantAddress}
        onCreateNewAddress={handleCreateNewAddress}
      />

      <DeliveryContactSection
        formData={formData}
        onSameAsResponsable={handleSameAsResponsable}
        onContactChange={handleContactChange}
      />

      <DeliveryOptionsSection
        delivery={delivery}
        onDeliveryChange={handleDeliveryChange}
      />

      <DateSection
        delivery={delivery}
        onUpdateDelivery={onUpdateDelivery}
        onDateChange={handleDateChange}
      />

      <NotesSection
        delivery={delivery}
        onDeliveryChange={handleDeliveryChange}
      />
    </div>
  );
}

export default ShippingStep;
