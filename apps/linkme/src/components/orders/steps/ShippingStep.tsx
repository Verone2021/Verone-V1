'use client';

/**
 * ShippingStep - Etape 7 du formulaire de commande
 *
 * Layout simplifie pour adresse et contact livraison:
 *
 * SECTION 1: ADRESSE DE LIVRAISON (Split-Screen)
 * - Adresse du restaurant
 * - Adresses shipping existantes
 * - Nouvelle adresse
 *
 * SECTION 2: CONTACT LIVRAISON (simplifie)
 * - Checkbox "Meme que responsable"
 * - Sinon: saisie directe (formulaire)
 *
 * SECTION 3: OPTIONS (centre commercial + semi-remorque)
 * SECTION 4: DATE SOUHAITEE (requise)
 * SECTION 5: NOTES
 *
 * Pas de consultation des contacts existants en BD (securite).
 *
 * @module ShippingStep
 * @since 2026-01-24
 * @updated 2026-02-23 - Simplification: suppression contacts existants, date requise
 */

import { useEffect, useMemo, useCallback, useState } from 'react';

import { Card, Input, Label, Textarea, Switch, Checkbox, cn } from '@verone/ui';
import {
  Truck,
  MapPin,
  Calendar,
  Building2,
  FileUp,
  MessageSquare,
  AlertCircle,
  AlertTriangle,
  Check,
  User,
  Package,
} from 'lucide-react';

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
} from '../schemas/order-form.schema';
import { defaultContact } from '../schemas/order-form.schema';
import { AddressCard } from './contacts/AddressCard';
import { AddressForm } from './contacts/AddressForm';

// ============================================================================
// TYPES
// ============================================================================

interface ShippingStepProps {
  formData: OrderFormData;
  errors: string[];
  onUpdate: (data: Partial<ContactsStepData>) => void;
  onUpdateDelivery: (data: Partial<DeliveryStepData>) => void;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ContactFormProps {
  contact: ContactBase;
  onChange: (field: keyof ContactBase, value: string) => void;
}

function ContactForm({ contact, onChange }: ContactFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="delivery-firstName">
          Prenom <span className="text-red-500">*</span>
        </Label>
        <Input
          id="delivery-firstName"
          type="text"
          value={contact.firstName}
          onChange={e => onChange('firstName', e.target.value)}
          placeholder="Jean"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="delivery-lastName">
          Nom <span className="text-red-500">*</span>
        </Label>
        <Input
          id="delivery-lastName"
          type="text"
          value={contact.lastName}
          onChange={e => onChange('lastName', e.target.value)}
          placeholder="Dupont"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="delivery-email">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="delivery-email"
          type="email"
          value={contact.email}
          onChange={e => onChange('email', e.target.value)}
          placeholder="jean.dupont@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="delivery-phone">
          Telephone <span className="text-red-500">*</span>
        </Label>
        <Input
          id="delivery-phone"
          type="tel"
          value={contact.phone ?? ''}
          onChange={e => onChange('phone', e.target.value)}
          placeholder="06 12 34 56 78"
        />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ShippingStep({
  formData,
  errors: _errors,
  onUpdate,
  onUpdateDelivery,
}: ShippingStepProps) {
  const [_showContactForm, setShowContactForm] = useState(
    !formData.contacts.delivery.sameAsResponsable &&
      !!formData.contacts.delivery.contact?.firstName
  );
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );

  const delivery = formData.delivery;

  // Fetch organisation info
  const organisationId =
    formData.restaurant.mode === 'existing'
      ? (formData.restaurant.existingId ?? null)
      : null;

  // Fetch shipping addresses
  const { data: addressesData, isLoading: addressesLoading } =
    useEntityAddresses('organisation', organisationId, 'shipping');

  // Shipping addresses
  const shippingAddresses = addressesData?.shipping ?? [];

  // Restaurant info
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

  // Convertir restaurantInfo en format Address pour reutiliser AddressCard
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

  // ========================================
  // ADDRESS STATE for split-screen form
  // ========================================

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

  // Is address complete?
  const isAddressComplete = useMemo(() => {
    return !!(delivery.address && delivery.postalCode && delivery.city);
  }, [delivery.address, delivery.postalCode, delivery.city]);

  // Is in edit mode
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
      if (!checked) {
        setShowContactForm(true);
      } else {
        setShowContactForm(false);
      }
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

  const handleDeliveryChange = (
    field: keyof DeliveryStepData,
    value: unknown
  ) => {
    onUpdateDelivery({ [field]: value });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onUpdateDelivery({
      desiredDate: value || null,
    });
  };

  return (
    <div className="space-y-6">
      {/* ================================================================
          SECTION 1: ADRESSE DE LIVRAISON (Split-Screen)
          ================================================================ */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              isAddressComplete
                ? 'bg-green-100 text-green-600'
                : 'bg-purple-100 text-purple-600'
            )}
          >
            {isAddressComplete ? (
              <Check className="h-5 w-5" />
            ) : (
              <MapPin className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Adresse de livraison
            </h3>
            <p className="text-sm text-gray-500">
              Ou souhaitez-vous etre livre ?
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GAUCHE: Formulaire adresse */}
          <Card
            className={cn(
              'p-4 transition-all',
              isAddressEditMode
                ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200'
                : 'bg-gray-50 border-dashed border-gray-300'
            )}
          >
            {isAddressEditMode && (
              <div className="flex items-center gap-3 pb-4 border-b border-purple-200 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-purple-900">
                    Adresse de livraison
                  </h4>
                  <p className="text-xs text-purple-600">
                    Lieu de reception de la commande
                  </p>
                </div>
              </div>
            )}

            {!isAddressEditMode && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <MapPin className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-1">
                  Aucune adresse selectionnee
                </p>
                <p className="text-xs text-gray-400">
                  Cliquez sur une adresse a droite pour la selectionner
                </p>
              </div>
            )}

            {isAddressEditMode && (
              <AddressForm
                address={addressFormData}
                onChange={handleAddressFormChange}
                showLegalFields={false}
                idPrefix="shipping-address"
              />
            )}
          </Card>

          {/* DROITE: Adresses existantes */}
          <Card className="p-4">
            <div className="flex items-center gap-2 pb-3 border-b mb-4">
              <MapPin className="h-4 w-4 text-purple-600" />
              <h4 className="font-medium text-gray-700">
                Adresses disponibles
              </h4>
            </div>

            {addressesLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
              </div>
            )}

            {!addressesLoading && (
              <div className="space-y-3">
                {/* Adresse du restaurant */}
                {restaurantAddress && (
                  <AddressCard
                    address={restaurantAddress}
                    isSelected={selectedAddressId === 'restaurant'}
                    onClick={handleSelectRestaurantAddress}
                    badge={
                      !restaurantAddress.addressLine1 ||
                      !restaurantAddress.postalCode
                        ? 'Incomplet'
                        : 'Restaurant'
                    }
                  />
                )}

                {/* Adresses shipping existantes */}
                {shippingAddresses.map(address => (
                  <AddressCard
                    key={address.id}
                    address={address}
                    isSelected={selectedAddressId === address.id}
                    onClick={() => handleSelectAddress(address)}
                  />
                ))}

                {/* Nouvelle adresse */}
                <Card
                  className={cn(
                    'p-3 cursor-pointer transition-all hover:shadow-md border-dashed',
                    showAddressForm
                      ? 'border-2 border-blue-500 bg-blue-50/50'
                      : 'hover:border-gray-400'
                  )}
                  onClick={handleCreateNewAddress}
                >
                  <div className="flex items-center justify-center gap-2 h-full min-h-[60px]">
                    <MapPin
                      className={cn(
                        'h-5 w-5',
                        showAddressForm ? 'text-blue-500' : 'text-gray-400'
                      )}
                    />
                    <span
                      className={cn(
                        'font-medium text-sm',
                        showAddressForm ? 'text-blue-600' : 'text-gray-600'
                      )}
                    >
                      + Nouvelle adresse
                    </span>
                  </div>
                </Card>

                <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-purple-700">
                      Les adresses de livraison sont conservees pour vos
                      prochaines commandes.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </Card>

      {/* ================================================================
          SECTION 2: CONTACT LIVRAISON (simplifie)
          ================================================================ */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <User className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Contact Livraison / Reception
            </h3>
            <p className="text-sm text-gray-500">
              Personne SUR PLACE qui receptionnera la livraison
            </p>
          </div>
        </div>

        <Card className="p-4">
          <div className="space-y-4">
            {/* Checkbox "Meme que responsable" */}
            <div className="flex items-center gap-3">
              <Checkbox
                id="delivery-same-as-responsable"
                checked={formData.contacts.delivery.sameAsResponsable}
                onCheckedChange={(checked: boolean) =>
                  handleSameAsResponsable(checked)
                }
              />
              <Label
                htmlFor="delivery-same-as-responsable"
                className="text-sm font-medium cursor-pointer"
              >
                Meme contact que le responsable de commande
              </Label>
            </div>

            {/* Info same as responsable */}
            {formData.contacts.delivery.sameAsResponsable && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-700">
                    <p className="font-medium">
                      Contact identique au responsable commande
                    </p>
                    {formData.contacts.responsable.firstName && (
                      <p className="mt-1">
                        {formData.contacts.responsable.firstName}{' '}
                        {formData.contacts.responsable.lastName} -{' '}
                        {formData.contacts.responsable.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Formulaire contact livraison */}
            {!formData.contacts.delivery.sameAsResponsable && (
              <div className="pt-2">
                <div className="flex items-center gap-2 pb-3 border-b mb-4">
                  <Package className="h-4 w-4 text-gray-500" />
                  <h5 className="text-sm font-medium text-gray-700">
                    Contact livraison
                  </h5>
                </div>
                <ContactForm
                  contact={formData.contacts.delivery.contact ?? defaultContact}
                  onChange={handleContactChange}
                />
              </div>
            )}
          </div>
        </Card>
      </Card>

      {/* ================================================================
          SECTION 3: OPTIONS DE LIVRAISON
          ================================================================ */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Truck className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Options de livraison
            </h3>
            <p className="text-sm text-gray-500">
              Informations complementaires pour faciliter la livraison
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Centre commercial */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-gray-400" />
                <div>
                  <Label htmlFor="isMallDelivery" className="cursor-pointer">
                    Livraison en centre commercial
                  </Label>
                  <p className="text-xs text-gray-500">
                    Necessite une coordination avec le centre
                  </p>
                </div>
              </div>
              <Switch
                id="isMallDelivery"
                checked={delivery.isMallDelivery}
                onCheckedChange={checked =>
                  handleDeliveryChange('isMallDelivery', checked)
                }
              />
            </div>

            {delivery.isMallDelivery && (
              <div className="ml-8 p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mallEmail">
                    Email du centre commercial{' '}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="mallEmail"
                    type="email"
                    value={delivery.mallEmail ?? ''}
                    onChange={e =>
                      handleDeliveryChange('mallEmail', e.target.value)
                    }
                    placeholder="livraison@centre-commercial.fr"
                  />
                  <p className="text-xs text-amber-700">
                    Nous contacterons le centre pour organiser la livraison.
                  </p>
                </div>

                <div className="pt-3 border-t border-amber-200">
                  <div className="flex items-center gap-3 mb-3">
                    <FileUp className="h-5 w-5 text-amber-600" />
                    <div>
                      <Label>Formulaire d&apos;acces (optionnel)</Label>
                      <p className="text-xs text-amber-700">
                        Telechargez le formulaire d&apos;acces du centre si
                        disponible (PDF, max 5Mo)
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('Le fichier est trop volumineux (max 5Mo)');
                          return;
                        }
                        handleDeliveryChange('accessFormFile', file);
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 cursor-pointer"
                  />
                  {delivery.accessFormFile && (
                    <p className="mt-2 text-sm text-green-600">
                      Fichier selectionne :{' '}
                      {(delivery.accessFormFile as File).name}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Semi-remorque */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-gray-400" />
                <div>
                  <Label
                    htmlFor="semiTrailerAccessible"
                    className="cursor-pointer"
                  >
                    Acces semi-remorque possible
                  </Label>
                  <p className="text-xs text-gray-500">
                    Le site permet l&apos;acces aux grands vehicules
                  </p>
                </div>
              </div>
              <Switch
                id="semiTrailerAccessible"
                checked={delivery.semiTrailerAccessible}
                onCheckedChange={checked =>
                  handleDeliveryChange('semiTrailerAccessible', checked)
                }
              />
            </div>

            {delivery.semiTrailerAccessible ? (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    Une verification sera effectuee. Si l&apos;acces
                    semi-remorque n&apos;est pas reellement possible, le prix de
                    livraison du devis pourra etre revise.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-700">
                    <p className="font-semibold">Surcouts de livraison</p>
                    <p className="mt-1">
                      Sans acces semi-remorque, la livraison necessite un
                      transbordement (semi → entrepot → petit vehicule), ce qui
                      engendre des frais supplementaires.
                    </p>
                    <p className="mt-2 font-medium">
                      Plus vous anticipez, plus nous pouvons optimiser les
                      couts. Un changement de derniere minute entraine des
                      surcouts significatifs.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ================================================================
          SECTION 4: DATE SOUHAITEE (requise)
          ================================================================ */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              delivery.desiredDate || delivery.deliveryAsap
                ? 'bg-green-100 text-green-600'
                : 'bg-blue-100 text-blue-600'
            )}
          >
            {delivery.desiredDate || delivery.deliveryAsap ? (
              <Check className="h-5 w-5" />
            ) : (
              <Calendar className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Date de livraison souhaitee{' '}
              <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-500">
              Sous reserve de disponibilite
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Checkbox dès que possible */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="deliveryAsap"
              checked={delivery.deliveryAsap}
              onCheckedChange={(checked: boolean) => {
                onUpdateDelivery({
                  deliveryAsap: checked,
                  desiredDate: checked ? null : delivery.desiredDate,
                });
              }}
            />
            <Label
              htmlFor="deliveryAsap"
              className="text-sm font-medium cursor-pointer"
            >
              Des que possible
            </Label>
          </div>

          {/* Champ date (masqué si "dès que possible" coché) */}
          {!delivery.deliveryAsap && (
            <>
              <Input
                id="desiredDate"
                type="date"
                value={delivery.desiredDate ?? ''}
                onChange={handleDateChange}
                min={new Date().toISOString().split('T')[0]}
              />
              {!delivery.desiredDate && (
                <p className="text-xs text-amber-600">
                  Veuillez indiquer une date de livraison souhaitee ou cocher
                  &quot;Des que possible&quot;.
                </p>
              )}
            </>
          )}
          <p className="text-xs text-gray-500">
            La date finale sera confirmee par notre equipe apres validation de
            la commande.
          </p>
        </div>
      </Card>

      {/* ================================================================
          SECTION 5: NOTES
          ================================================================ */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Notes complementaires
            </h3>
            <p className="text-sm text-gray-500">
              Instructions particulieres pour la livraison
            </p>
          </div>
        </div>

        <Textarea
          id="notes"
          value={delivery.notes ?? ''}
          onChange={e => handleDeliveryChange('notes', e.target.value)}
          placeholder="Ex: Livraison par l'entree de service, interphone code 1234..."
          rows={4}
        />
      </Card>
    </div>
  );
}

export default ShippingStep;
