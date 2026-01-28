'use client';

/**
 * DeliverySection - Section Livraison complète
 *
 * Gère le contact et l'adresse de livraison avec :
 * - Option "Même que responsable"
 * - Sélection de contact existant ou création
 * - Formulaire d'adresse avec auto-remplissage depuis restaurant
 * - Option "Enregistrer par défaut"
 *
 * @module DeliverySection
 * @since 2026-01-20
 */

import { useState, useCallback, useMemo, useEffect } from 'react';

import {
  Card,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@verone/ui';
import { Truck, ChevronDown, Check, AlertCircle } from 'lucide-react';

import type { OrganisationContact } from '@/lib/hooks/use-organisation-contacts';

import { AddressForm } from './AddressForm';
import { ContactSelector } from './ContactSelector';
import type {
  DeliverySectionData,
  ContactBase,
  PartialAddressData,
} from '../../schemas/order-form.schema';
import { defaultContact } from '../../schemas/order-form.schema';

// ============================================================================
// TYPES
// ============================================================================

interface RestaurantAddress {
  address_line1?: string | null;
  address_line2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  shipping_address_line1?: string | null;
  shipping_postal_code?: string | null;
  shipping_city?: string | null;
}

interface DeliverySectionProps {
  /** Données de livraison actuelles */
  delivery: DeliverySectionData;
  /** Callback pour mettre à jour les données */
  onUpdate: (data: Partial<DeliverySectionData>) => void;
  /** Contacts existants de l'organisation */
  existingContacts: OrganisationContact[];
  /** Adresse du restaurant (pour pré-remplissage) */
  restaurantAddress: RestaurantAddress | null;
  /** Section ouverte par défaut */
  defaultOpen?: boolean;
}

// ============================================================================
// HELPER: Build restaurant shipping address
// ============================================================================

function buildRestaurantShippingAddress(
  restaurant: RestaurantAddress
): PartialAddressData {
  // Prefer shipping address if available, otherwise use main address
  const hasShippingAddress =
    restaurant.shipping_address_line1 && restaurant.shipping_city;

  return {
    addressLine1: hasShippingAddress
      ? (restaurant.shipping_address_line1 ?? '')
      : (restaurant.address_line1 ?? ''),
    postalCode: hasShippingAddress
      ? (restaurant.shipping_postal_code ?? '')
      : (restaurant.postal_code ?? ''),
    city: hasShippingAddress
      ? (restaurant.shipping_city ?? '')
      : (restaurant.city ?? ''),
    country: restaurant.country ?? 'FR',
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DeliverySection({
  delivery,
  onUpdate,
  existingContacts,
  restaurantAddress,
  defaultOpen = false,
}: DeliverySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showContactForm, setShowContactForm] = useState(false);

  // Auto-fill address from restaurant on mount (if no address yet)
  useEffect(() => {
    if (
      restaurantAddress &&
      !delivery.address?.addressLine1 &&
      !delivery.sameAsResponsable
    ) {
      onUpdate({
        address: buildRestaurantShippingAddress(restaurantAddress),
      });
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if section is complete
  const isComplete = useMemo(() => {
    if (delivery.sameAsResponsable) {
      return true;
    }
    // Need contact (existing or new)
    const hasContact =
      delivery.existingContactId ??
      (delivery.contact?.firstName &&
        delivery.contact?.lastName &&
        delivery.contact?.email);
    return !!hasContact;
  }, [delivery]);

  // Handle "same as responsable" toggle
  const handleSameAsResponsable = useCallback(() => {
    const newValue = !delivery.sameAsResponsable;
    onUpdate({
      sameAsResponsable: newValue,
      existingContactId: null,
      contact: null,
    });
    setShowContactForm(false);
  }, [delivery, onUpdate]);

  // Handle contact selection
  const handleContactSelect = useCallback(
    (contact: OrganisationContact) => {
      onUpdate({
        existingContactId: contact.id,
        contact: {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone ?? contact.mobile ?? '',
          position: contact.title ?? '',
        },
        sameAsResponsable: false,
      });
      setShowContactForm(false);
    },
    [onUpdate]
  );

  // Handle new contact creation mode
  const handleCreateNew = useCallback(() => {
    setShowContactForm(true);
    onUpdate({
      existingContactId: null,
      contact: defaultContact,
      sameAsResponsable: false,
    });
  }, [onUpdate]);

  // Handle contact form field change
  const handleContactChange = useCallback(
    (field: keyof ContactBase, value: string) => {
      onUpdate({
        contact: {
          ...(delivery.contact ?? defaultContact),
          [field]: value,
        },
      });
    },
    [delivery.contact, onUpdate]
  );

  // Handle address change
  const handleAddressChange = useCallback(
    (address: PartialAddressData) => {
      onUpdate({ address });
    },
    [onUpdate]
  );

  // Handle save as default change
  const handleSaveAsDefaultChange = useCallback(
    (checked: boolean) => {
      onUpdate({ saveAddressAsDefault: checked });
    },
    [onUpdate]
  );

  // Determine if we should show the address form
  const showAddressForm =
    !delivery.sameAsResponsable &&
    (delivery.existingContactId ?? showContactForm);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  isComplete
                    ? 'bg-green-100 text-green-600'
                    : 'bg-purple-100 text-purple-600'
                )}
              >
                {isComplete ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Truck className="h-5 w-5" />
                )}
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">
                  Contact Livraison / Réception
                </h3>
                <p className="text-sm text-gray-500">
                  Personne à contacter pour la livraison
                </p>
              </div>
            </div>
            <ChevronDown
              className={cn(
                'h-5 w-5 text-gray-400 transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-0 border-t space-y-6">
            {/* Contact Selection */}
            <ContactSelector
              contacts={existingContacts}
              selectedId={delivery.existingContactId ?? null}
              onSelect={handleContactSelect}
              onCreateNew={handleCreateNew}
              showSameAsOption
              onSameAsResponsable={handleSameAsResponsable}
              isSameAsResponsableActive={delivery.sameAsResponsable}
            />

            {/* Contact Form (if creating new) */}
            {showContactForm && !delivery.sameAsResponsable && (
              <div className="pt-4 border-t space-y-4">
                <h4 className="text-sm font-medium text-gray-700">
                  Nouveau contact livraison
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={delivery.contact?.firstName ?? ''}
                      onChange={e =>
                        handleContactChange('firstName', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Jean"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={delivery.contact?.lastName ?? ''}
                      onChange={e =>
                        handleContactChange('lastName', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Dupont"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={delivery.contact?.email ?? ''}
                      onChange={e =>
                        handleContactChange('email', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="jean.dupont@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={delivery.contact?.phone ?? ''}
                      onChange={e =>
                        handleContactChange('phone', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Address Form */}
            {showAddressForm && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-4">
                  Adresse de livraison
                </h4>
                <AddressForm
                  address={delivery.address ?? null}
                  onChange={handleAddressChange}
                  showLegalFields={false}
                  showSaveAsDefault
                  saveAsDefault={delivery.saveAddressAsDefault}
                  onSaveAsDefaultChange={handleSaveAsDefaultChange}
                  idPrefix="delivery"
                />
              </div>
            )}

            {/* Info about different delivery address */}
            {delivery.address?.addressLine1 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p>
                      La livraison sera effectuée à :{' '}
                      <strong>
                        {delivery.address.addressLine1},{' '}
                        {delivery.address.postalCode} {delivery.address.city}
                      </strong>
                    </p>
                    {delivery.saveAddressAsDefault && (
                      <p className="mt-1 text-xs">
                        Cette adresse sera enregistrée par défaut.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default DeliverySection;
