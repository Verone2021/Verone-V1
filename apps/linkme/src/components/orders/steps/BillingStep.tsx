'use client';

/**
 * BillingStep - Etape 6 du formulaire de commande
 *
 * Formulaire simplifie pour contact et adresse de facturation:
 *
 * SECTION 1: ADRESSE FACTURATION
 * - Adresse restaurant (pre-remplie)
 * - Adresse maison mere (succursales uniquement)
 * - Nouvelle adresse (saisie directe)
 *
 * SECTION 2: CONTACT FACTURATION
 * - "Meme que responsable" (checkbox)
 * - Saisie directe (nouveau contact)
 *
 * Pas de consultation des contacts/adresses existants en BD (securite).
 *
 * @module BillingStep
 * @since 2026-01-24
 * @updated 2026-02-23 - Simplification: suppression contacts/adresses existants
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

import { Card, Input, Label, Checkbox, cn, Badge, Button } from '@verone/ui';
import {
  FileText,
  MapPin,
  Building2,
  User,
  Check,
  AlertCircle,
  AlertTriangle,
  Save,
  Loader2,
} from 'lucide-react';

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
} from '../schemas/order-form.schema';
import { defaultContact } from '../schemas/order-form.schema';
import { AddressForm } from './contacts/AddressForm';

// ============================================================================
// TYPES
// ============================================================================

interface BillingStepProps {
  formData: OrderFormData;
  errors: string[];
  onUpdate: (data: Partial<ContactsStepData>) => void;
}

/** Type pour stocker les valeurs initiales et detecter les modifications */
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
        <Label htmlFor="billingContact-firstName">
          Prenom <span className="text-red-500">*</span>
        </Label>
        <Input
          id="billingContact-firstName"
          type="text"
          value={contact.firstName}
          onChange={e => onChange('firstName', e.target.value)}
          placeholder="Jean"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="billingContact-lastName">
          Nom <span className="text-red-500">*</span>
        </Label>
        <Input
          id="billingContact-lastName"
          type="text"
          value={contact.lastName}
          onChange={e => onChange('lastName', e.target.value)}
          placeholder="Dupont"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="billingContact-email">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="billingContact-email"
          type="email"
          value={contact.email}
          onChange={e => onChange('email', e.target.value)}
          placeholder="jean.dupont@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="billingContact-phone">
          Telephone <span className="text-red-500">*</span>
        </Label>
        <Input
          id="billingContact-phone"
          type="tel"
          value={contact.phone ?? ''}
          onChange={e => onChange('phone', e.target.value)}
          placeholder="06 12 34 56 78"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="billingContact-position">Fonction</Label>
        <Input
          id="billingContact-position"
          type="text"
          value={contact.position ?? ''}
          onChange={e => onChange('position', e.target.value)}
          placeholder="Comptable, DAF..."
        />
      </div>
    </div>
  );
}

interface RestaurantAddressCardProps {
  onClick: () => void;
  isActive: boolean;
  restaurantName: string | null;
  legalName?: string | null;
  addressLine1?: string | null;
  postalCode?: string | null;
  city?: string | null;
  siret?: string | null;
  isIncomplete?: boolean;
}

function RestaurantAddressCard({
  onClick,
  isActive,
  restaurantName,
  legalName,
  addressLine1,
  postalCode,
  city,
  siret,
  isIncomplete,
}: RestaurantAddressCardProps) {
  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-all',
        isActive
          ? 'border-2 border-blue-400 bg-blue-50/30 shadow-md'
          : 'hover:border-blue-300 hover:bg-blue-50/20 hover:shadow-sm'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            isActive ? 'bg-blue-100' : 'bg-gray-100'
          )}
        >
          <Building2
            className={cn(
              'h-4 w-4',
              isActive ? 'text-blue-600' : 'text-gray-500'
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
              Adresse restaurant
            </h3>
            {isIncomplete && (
              <Badge
                variant="outline"
                size="sm"
                className="text-amber-600 border-amber-300 bg-amber-50 flex-shrink-0"
              >
                Incomplet
              </Badge>
            )}
          </div>
          <p className="text-xs font-medium text-gray-700 mt-0.5 truncate">
            {legalName ?? restaurantName ?? 'Restaurant'}
          </p>
          {addressLine1 && (
            <p className="text-xs text-gray-500 truncate">{addressLine1}</p>
          )}
          {(postalCode ?? city) && (
            <p className="text-xs text-gray-500 truncate">
              {[postalCode, city].filter(Boolean).join(' ')}
            </p>
          )}
          {siret && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              SIRET: {siret}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

interface ParentAddressCardProps {
  onClick: () => void;
  isActive: boolean;
  parentName: string | null;
  legalName?: string | null;
  addressLine1: string | null;
  postalCode?: string | null;
  city: string | null;
  siret?: string | null;
  isIncomplete?: boolean;
}

function ParentAddressCard({
  onClick,
  isActive,
  parentName,
  legalName,
  addressLine1,
  postalCode,
  city,
  siret,
  isIncomplete,
}: ParentAddressCardProps) {
  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-all',
        isActive
          ? 'border-2 border-purple-400 bg-purple-50/30 shadow-md'
          : 'hover:border-purple-300 hover:bg-purple-50/20 hover:shadow-sm'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            isActive ? 'bg-purple-100' : 'bg-gray-100'
          )}
        >
          <Building2
            className={cn(
              'h-4 w-4',
              isActive ? 'text-purple-600' : 'text-gray-500'
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
              Maison mere
            </h3>
            <Badge
              variant="outline"
              size="sm"
              className="text-purple-600 border-purple-300 bg-purple-50 flex-shrink-0"
            >
              Siege
            </Badge>
            {isIncomplete && (
              <Badge
                variant="outline"
                size="sm"
                className="text-amber-600 border-amber-300 bg-amber-50 flex-shrink-0"
              >
                Incomplet
              </Badge>
            )}
          </div>
          <p className="text-xs font-medium text-gray-700 mt-0.5 truncate">
            {legalName ?? parentName ?? 'Organisation mere'}
          </p>
          {addressLine1 && (
            <p className="text-xs text-gray-500 truncate">{addressLine1}</p>
          )}
          {(postalCode ?? city) && (
            <p className="text-xs text-gray-500 truncate">
              {[postalCode, city].filter(Boolean).join(' ')}
            </p>
          )}
          {siret && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              SIRET: {siret}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

interface NewAddressCardProps {
  onClick: () => void;
  isActive: boolean;
}

function NewAddressCard({ onClick, isActive }: NewAddressCardProps) {
  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-all hover:shadow-md border-dashed',
        isActive
          ? 'border-2 border-blue-500 bg-blue-50/50'
          : 'hover:border-gray-400'
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-center gap-2 h-full min-h-[60px]">
        <MapPin
          className={cn(
            'h-5 w-5',
            isActive ? 'text-blue-500' : 'text-gray-400'
          )}
        />
        <span
          className={cn(
            'font-medium text-sm',
            isActive ? 'text-blue-600' : 'text-gray-600'
          )}
        >
          Nouvelle adresse
        </span>
      </div>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BillingStep({
  formData,
  errors: _errors,
  onUpdate,
}: BillingStepProps) {
  const [showContactForm, setShowContactForm] = useState(
    formData.contacts.billingContact.mode === 'new'
  );

  // Ref pour stocker les valeurs initiales (pour detecter les modifications)
  const initialAddressRef = useRef<InitialAddressValues | null>(null);

  // Get enseigne ID
  const enseigneId = useEnseigneId();

  // Get organisation ID (restaurant selectionne)
  const organisationId =
    formData.restaurant.mode === 'existing'
      ? (formData.restaurant.existingId ?? null)
      : null;

  // Determine ownership type
  const ownershipType = useMemo(() => {
    if (formData.restaurant.mode === 'new') {
      return formData.restaurant.newRestaurant?.ownershipType ?? null;
    }
    return formData.restaurant.existingOwnershipType ?? null;
  }, [formData.restaurant]);

  // Is franchise? (no parent address for franchises)
  const isFranchise = ownershipType === 'franchise';

  // Fetch parent organisation addresses (for succursales only)
  const {
    parentOrg,
    primaryAddress: parentPrimaryAddress,
    isLoading: parentLoading,
  } = useParentOrganisationAddresses(!isFranchise ? enseigneId : null);

  // Fetch full restaurant organisation details (for address, SIRET, etc.)
  const { data: restaurantDetail, isLoading: restaurantDetailLoading } =
    useOrganisationDetail(organisationId);

  // Hook pour sauvegarder les modifications
  const { mutate: updateOrganisation, isPending: isSaving } =
    useUpdateOrganisationAddress();

  // Restaurant info for display
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

  // Show parent address only for non-franchises with valid parent data
  const showParentAddress = !isFranchise && parentOrg && parentPrimaryAddress;

  // ========================================
  // DETECTION DES MODIFICATIONS
  // ========================================

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

  // ========================================
  // COMPLETION CHECKS
  // ========================================

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

  // ========================================
  // BILLING CONTACT HANDLERS
  // ========================================

  const handleBillingContactUpdate = useCallback(
    (data: Partial<BillingContactData>) => {
      onUpdate({
        billingContact: {
          ...formData.contacts.billingContact,
          ...data,
        },
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

  // ========================================
  // BILLING ADDRESS HANDLERS
  // ========================================

  const handleBillingAddressUpdate = useCallback(
    (data: Partial<BillingAddressData>) => {
      onUpdate({
        billingAddress: {
          ...formData.contacts.billingAddress,
          ...data,
        },
      });
    },
    [formData.contacts.billingAddress, onUpdate]
  );

  // Auto-remplissage: Adresse restaurant
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

  // Auto-remplissage: Adresse maison mere
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
    const emptyAddress: PartialAddressData = {
      addressLine1: '',
      postalCode: '',
      city: '',
      country: restaurantInfo?.country ?? 'FR',
      tradeName: '',
      legalName: '',
      siret: '',
      vatNumber: '',
    };

    initialAddressRef.current = null;

    handleBillingAddressUpdate({
      mode: 'new_billing',
      existingAddressId: null,
      customAddress: emptyAddress,
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

  // ========================================
  // SAUVEGARDE DES MODIFICATIONS
  // ========================================

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

  // ========================================
  // EFFETS
  // ========================================

  // Auto-selection de l'adresse restaurant au montage si aucune selection
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

  const isLoading = parentLoading || restaurantDetailLoading;

  // Determiner si le formulaire est en mode edition (pas new_billing)
  const isEditMode =
    formData.contacts.billingAddress.mode !== 'new_billing' &&
    formData.contacts.billingAddress.customAddress !== null;

  return (
    <div className="space-y-8">
      {/* ================================================================
          SECTION 1: ADRESSE DE FACTURATION
          ================================================================ */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              isBillingAddressComplete
                ? 'bg-green-100 text-green-600'
                : 'bg-amber-100 text-amber-600'
            )}
          >
            {isBillingAddressComplete ? (
              <Check className="h-5 w-5" />
            ) : (
              <MapPin className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Adresse de Facturation
            </h3>
            <p className="text-sm text-gray-500">
              Adresse pour l&apos;envoi de la facture
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GAUCHE: Formulaire avec design distinctif */}
          <Card
            className={cn(
              'p-4 transition-all',
              isEditMode ||
                formData.contacts.billingAddress.mode === 'new_billing'
                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200'
                : 'bg-gray-50 border-dashed border-gray-300'
            )}
          >
            {/* En-tete distinctif */}
            {(isEditMode ||
              formData.contacts.billingAddress.mode === 'new_billing') && (
              <div className="flex items-center gap-3 pb-4 border-b border-blue-200 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">
                    Adresse de facturation
                  </h4>
                  <p className="text-xs text-blue-600">
                    Ces informations seront utilisees pour la facture
                  </p>
                </div>
              </div>
            )}

            {/* Message si aucune selection */}
            {!isEditMode &&
              formData.contacts.billingAddress.mode !== 'new_billing' && (
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

            {/* Formulaire d'adresse */}
            {(isEditMode ||
              formData.contacts.billingAddress.mode === 'new_billing') && (
              <>
                <AddressForm
                  address={formData.contacts.billingAddress.customAddress}
                  onChange={handleAddressChange}
                  showLegalFields
                  idPrefix="billingAddress"
                />

                {/* Checkboxes pour nouvelle adresse */}
                {formData.contacts.billingAddress.mode === 'new_billing' && (
                  <div className="mt-4 pt-4 border-t border-blue-200 space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="replaceExistingAddress"
                        checked={
                          formData.contacts.billingAddress
                            .replaceExistingAddress
                        }
                        onCheckedChange={handleReplaceExistingChange}
                      />
                      <Label
                        htmlFor="replaceExistingAddress"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Remplacer l&apos;adresse existante du restaurant
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="setAsDefaultAddress"
                        checked={formData.contacts.billingAddress.setAsDefault}
                        onCheckedChange={handleSetAsDefaultChange}
                      />
                      <Label
                        htmlFor="setAsDefaultAddress"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Definir comme adresse par defaut
                      </Label>
                    </div>
                  </div>
                )}

                {/* Bouton Sauvegarder - UNIQUEMENT si modifications detectees */}
                {hasUnsavedChanges &&
                  formData.contacts.billingAddress.sourceOrganisationId && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <Button
                        onClick={handleSaveAddress}
                        disabled={isSaving}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Sauvegarde en cours...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Sauvegarder les modifications
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-blue-600 mt-2 text-center">
                        Les modifications seront enregistrees dans la fiche
                        restaurant
                      </p>
                    </div>
                  )}
              </>
            )}
          </Card>

          {/* DROITE: Choix d'adresse (restaurant, maison mere, nouvelle) */}
          <Card className="p-4">
            <div className="flex items-center gap-2 pb-3 border-b mb-4">
              <Building2 className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-gray-700">
                Adresses disponibles
              </h4>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            )}

            {!isLoading && (
              <div className="space-y-3">
                {/* Adresse restaurant */}
                {restaurantInfo && (
                  <RestaurantAddressCard
                    onClick={handleSelectRestaurantAddress}
                    isActive={
                      formData.contacts.billingAddress.mode ===
                      'restaurant_address'
                    }
                    restaurantName={
                      restaurantInfo.tradeName ?? restaurantInfo.name
                    }
                    legalName={restaurantInfo.legalName}
                    addressLine1={restaurantInfo.addressLine1}
                    postalCode={restaurantInfo.postalCode}
                    city={restaurantInfo.billingCity ?? restaurantInfo.city}
                    siret={restaurantInfo.siret}
                    isIncomplete={!restaurantInfo.siret}
                  />
                )}

                {/* Adresse maison mere (si propre/succursale) */}
                {showParentAddress && (
                  <ParentAddressCard
                    onClick={handleSelectParentAddress}
                    isActive={
                      formData.contacts.billingAddress.mode === 'parent_address'
                    }
                    parentName={
                      parentOrg?.trade_name ?? parentOrg?.legal_name ?? null
                    }
                    legalName={parentOrg?.legal_name ?? null}
                    addressLine1={parentPrimaryAddress?.addressLine1 ?? null}
                    postalCode={parentPrimaryAddress?.postalCode ?? null}
                    city={parentPrimaryAddress?.city ?? null}
                    siret={parentPrimaryAddress?.siret ?? null}
                    isIncomplete={!parentPrimaryAddress?.siret}
                  />
                )}

                {/* Nouvelle adresse */}
                <NewAddressCard
                  onClick={handleCreateNewAddress}
                  isActive={
                    formData.contacts.billingAddress.mode === 'new_billing'
                  }
                />
              </div>
            )}
          </Card>
        </div>
      </Card>

      {/* ================================================================
          SECTION 2: CONTACT FACTURATION (simplifie)
          ================================================================ */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              isBillingContactComplete
                ? 'bg-green-100 text-green-600'
                : 'bg-amber-100 text-amber-600'
            )}
          >
            {isBillingContactComplete ? (
              <Check className="h-5 w-5" />
            ) : (
              <FileText className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Contact Facturation</h3>
            <p className="text-sm text-gray-500">
              Personne a contacter pour la facturation
            </p>
          </div>
        </div>

        {/* Message avertissement franchise */}
        {isFranchise && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md mb-4">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span className="text-sm text-amber-700">
              La facturation doit etre geree par le proprietaire du restaurant
              ou ses employes.
            </span>
          </div>
        )}

        <Card className="p-4">
          <div className="space-y-4">
            {/* Option "Meme que responsable" */}
            <div className="flex items-center gap-3">
              <Checkbox
                id="billing-same-as-responsable"
                checked={
                  formData.contacts.billingContact.mode ===
                  'same_as_responsable'
                }
                onCheckedChange={() => handleBillingContactSameAsResponsable()}
              />
              <Label
                htmlFor="billing-same-as-responsable"
                className="text-sm font-medium cursor-pointer"
              >
                Meme contact que le responsable de commande
              </Label>
            </div>

            {/* Info same as responsable */}
            {formData.contacts.billingContact.mode ===
              'same_as_responsable' && (
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

            {/* Formulaire nouveau contact */}
            {formData.contacts.billingContact.mode !==
              'same_as_responsable' && (
              <div className="pt-2">
                {!showContactForm && (
                  <button
                    type="button"
                    onClick={handleBillingContactCreateNew}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Saisir un contact facturation different
                  </button>
                )}

                {showContactForm && (
                  <div className="pt-2">
                    <div className="flex items-center gap-2 pb-3 border-b mb-4">
                      <User className="h-4 w-4 text-gray-500" />
                      <h5 className="text-sm font-medium text-gray-700">
                        Contact facturation
                      </h5>
                    </div>
                    <ContactForm
                      contact={
                        formData.contacts.billingContact.contact ??
                        defaultContact
                      }
                      onChange={handleBillingContactChange}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </Card>

      {/* ================================================================
          INFO
          ================================================================ */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Information</p>
            <p className="mt-1">
              Le contact facturation recevra les factures et autres documents
              comptables. L&apos;adresse de facturation determine ou la facture
              sera envoyee.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BillingStep;
