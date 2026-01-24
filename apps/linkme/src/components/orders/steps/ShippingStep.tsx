'use client';

/**
 * ShippingStep - Etape 7 du formulaire de commande
 *
 * Fusionne contact livraison et options de livraison:
 * - Section 1: Contact livraison/reception (avec option "Meme que responsable")
 * - Section 2: Adresse de livraison
 * - Section 3: Date et options (centre commercial, semi-remorque, formulaire d'acces)
 * - Section 4: Notes
 *
 * @module ShippingStep
 * @since 2026-01-24
 */

import { useEffect, useMemo, useCallback, useState } from 'react';

import {
  Card,
  Input,
  Label,
  Textarea,
  Switch,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
} from '@verone/ui';
import {
  Truck,
  MapPin,
  Calendar,
  Building2,
  FileUp,
  MessageSquare,
  AlertCircle,
  ChevronDown,
  Check,
  User,
} from 'lucide-react';

import { useOrganisationContacts } from '@/lib/hooks/use-organisation-contacts';
import { useEnseigneId } from '@/lib/hooks/use-enseigne-id';

import type {
  OrderFormData,
  ContactsStepData,
  DeliveryStepData,
  ContactBase,
  DeliverySectionData,
} from '../schemas/order-form.schema';
import { defaultContact } from '../schemas/order-form.schema';

import { ContactGrid } from './contacts/ContactGrid';

import type { OrganisationContact } from '@/lib/hooks/use-organisation-contacts';

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
// SUB-COMPONENT: Contact Form (inline)
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
          onChange={(e) => onChange('firstName', e.target.value)}
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
          onChange={(e) => onChange('lastName', e.target.value)}
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
          onChange={(e) => onChange('email', e.target.value)}
          placeholder="jean.dupont@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="delivery-phone">Telephone</Label>
        <Input
          id="delivery-phone"
          type="tel"
          value={contact.phone || ''}
          onChange={(e) => onChange('phone', e.target.value)}
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
  errors,
  onUpdate,
  onUpdateDelivery,
}: ShippingStepProps) {
  const [contactSectionOpen, setContactSectionOpen] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);

  const delivery = formData.delivery;

  // Get enseigne ID
  const enseigneId = useEnseigneId();

  // Fetch organisation contacts
  const organisationId =
    formData.restaurant.mode === 'existing'
      ? formData.restaurant.existingId || null
      : null;

  // Determine ownership type
  const ownershipType = useMemo(() => {
    if (formData.restaurant.mode === 'new') {
      return formData.restaurant.newRestaurant?.ownershipType || null;
    }
    return formData.restaurant.existingOwnershipType || null;
  }, [formData.restaurant]);

  // Is franchise?
  const isFranchise = ownershipType === 'franchise';

  // Fetch contacts - SANS contacts enseigne pour livraison
  const { data: contactsData, isLoading } = useOrganisationContacts(
    organisationId,
    enseigneId || null,
    ownershipType,
    false // PAS de contacts enseigne pour livraison
  );

  // Contacts disponibles (locaux uniquement)
  const availableContacts = useMemo(() => {
    const allContacts = contactsData?.allContacts || [];
    if (isFranchise) {
      return allContacts.filter((c) => c.organisationId === organisationId);
    }
    return allContacts;
  }, [contactsData?.allContacts, isFranchise, organisationId]);

  // Auto-remplir adresse depuis le restaurant
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
          address: newResto.address || '',
          postalCode: newResto.postalCode || '',
          city: newResto.city,
        });
      }
    }
  }, [formData.restaurant, delivery.address, delivery.city, onUpdateDelivery]);

  // ========================================
  // COMPLETION CHECKS
  // ========================================

  const isContactComplete = useMemo(() => {
    if (formData.contacts.delivery.sameAsResponsable) {
      return true;
    }
    const hasContact =
      formData.contacts.delivery.existingContactId ||
      (formData.contacts.delivery.contact?.firstName &&
        formData.contacts.delivery.contact?.lastName &&
        formData.contacts.delivery.contact?.email);
    return !!hasContact;
  }, [formData.contacts.delivery]);

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

  const handleContactSelect = useCallback(
    (contact: OrganisationContact) => {
      handleDeliveryContactUpdate({
        existingContactId: contact.id,
        contact: {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone || contact.mobile || '',
          position: contact.title || '',
        },
        sameAsResponsable: false,
      });
      setShowContactForm(false);
    },
    [handleDeliveryContactUpdate]
  );

  const handleSameAsResponsable = useCallback(() => {
    const newValue = !formData.contacts.delivery.sameAsResponsable;
    handleDeliveryContactUpdate({
      sameAsResponsable: newValue,
      existingContactId: null,
      contact: null,
    });
    setShowContactForm(false);
  }, [formData.contacts.delivery.sameAsResponsable, handleDeliveryContactUpdate]);

  const handleCreateNewContact = useCallback(() => {
    setShowContactForm(true);
    handleDeliveryContactUpdate({
      existingContactId: null,
      contact: defaultContact,
      sameAsResponsable: false,
    });
  }, [handleDeliveryContactUpdate]);

  const handleContactChange = useCallback(
    (field: keyof ContactBase, value: string) => {
      handleDeliveryContactUpdate({
        contact: {
          ...(formData.contacts.delivery.contact || defaultContact),
          [field]: value,
        },
      });
    },
    [formData.contacts.delivery.contact, handleDeliveryContactUpdate]
  );

  // ========================================
  // DELIVERY HANDLERS
  // ========================================

  const handleDeliveryChange = (field: keyof DeliveryStepData, value: any) => {
    onUpdateDelivery({ [field]: value });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onUpdateDelivery({
      desiredDate: value ? new Date(value) : null,
    });
  };

  const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      {/* ================================================================
          SECTION 1: CONTACT LIVRAISON
          ================================================================ */}
      <Collapsible open={contactSectionOpen} onOpenChange={setContactSectionOpen}>
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
                    isContactComplete
                      ? 'bg-green-100 text-green-600'
                      : 'bg-purple-100 text-purple-600'
                  )}
                >
                  {isContactComplete ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">
                    Contact Livraison / Reception
                  </h3>
                  <p className="text-sm text-gray-500">
                    Personne a contacter pour la livraison
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-gray-400 transition-transform',
                  contactSectionOpen && 'rotate-180'
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0 border-t space-y-4">
              {/* Loading state */}
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                </div>
              )}

              {/* Contact grid with "Same as responsable" option */}
              {!isLoading && (
                <ContactGrid
                  contacts={availableContacts}
                  selectedId={formData.contacts.delivery.existingContactId || null}
                  onSelect={handleContactSelect}
                  onCreateNew={handleCreateNewContact}
                  isCreatingNew={showContactForm}
                  showSameAsOption
                  onSameAsResponsable={handleSameAsResponsable}
                  isSameAsResponsableActive={formData.contacts.delivery.sameAsResponsable}
                />
              )}

              {/* New contact form */}
              {showContactForm && !formData.contacts.delivery.sameAsResponsable && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">
                    Nouveau contact livraison
                  </h4>
                  <ContactForm
                    contact={formData.contacts.delivery.contact || defaultContact}
                    onChange={handleContactChange}
                  />
                </div>
              )}

              {/* Same as responsable info */}
              {formData.contacts.delivery.sameAsResponsable && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-700">
                      <p className="font-medium">
                        Contact identique au responsable commande
                      </p>
                      <p className="mt-1">
                        {formData.contacts.responsable.firstName}{' '}
                        {formData.contacts.responsable.lastName} -{' '}
                        {formData.contacts.responsable.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ================================================================
          SECTION 2: ADRESSE DE LIVRAISON
          ================================================================ */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Adresse de livraison</h3>
            <p className="text-sm text-gray-500">Ou souhaitez-vous etre livre ?</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">
              Adresse <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address"
              type="text"
              value={delivery.address}
              onChange={(e) => handleDeliveryChange('address', e.target.value)}
              placeholder="123 rue de la Paix"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">
                Code postal <span className="text-red-500">*</span>
              </Label>
              <Input
                id="postalCode"
                type="text"
                value={delivery.postalCode}
                onChange={(e) => handleDeliveryChange('postalCode', e.target.value)}
                placeholder="75001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">
                Ville <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                type="text"
                value={delivery.city}
                onChange={(e) => handleDeliveryChange('city', e.target.value)}
                placeholder="Paris"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* ================================================================
          SECTION 3: DATE SOUHAITEE
          ================================================================ */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Date de livraison souhaitee</h3>
            <p className="text-sm text-gray-500">Optionnel - Sous reserve de disponibilite</p>
          </div>
        </div>

        <div className="space-y-2">
          <Input
            id="desiredDate"
            type="date"
            value={formatDateForInput(delivery.desiredDate)}
            onChange={handleDateChange}
            min={new Date().toISOString().split('T')[0]}
          />
          <p className="text-xs text-gray-500">
            La date finale sera confirmee par notre equipe apres validation de la commande.
          </p>
        </div>
      </Card>

      {/* ================================================================
          SECTION 4: OPTIONS DE LIVRAISON
          ================================================================ */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Truck className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Options de livraison</h3>
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
                onCheckedChange={(checked) => handleDeliveryChange('isMallDelivery', checked)}
              />
            </div>

            {delivery.isMallDelivery && (
              <div className="ml-8 p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="mallEmail">
                    Email du centre commercial <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="mallEmail"
                    type="email"
                    value={delivery.mallEmail || ''}
                    onChange={(e) => handleDeliveryChange('mallEmail', e.target.value)}
                    placeholder="livraison@centre-commercial.fr"
                  />
                  <p className="text-xs text-amber-700">
                    Nous contacterons le centre pour organiser la livraison.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Semi-remorque */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-gray-400" />
              <div>
                <Label htmlFor="semiTrailerAccessible" className="cursor-pointer">
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
              onCheckedChange={(checked) =>
                handleDeliveryChange('semiTrailerAccessible', checked)
              }
            />
          </div>

          {/* Formulaire d'acces */}
          <div className="pt-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <FileUp className="h-5 w-5 text-gray-400" />
              <div>
                <Label>Formulaire d&apos;acces</Label>
                <p className="text-xs text-gray-500">
                  Telechargez un document si necessaire (PDF, max 5Mo)
                </p>
              </div>
            </div>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 5 * 1024 * 1024) {
                    alert('Le fichier est trop volumineux (max 5Mo)');
                    return;
                  }
                  handleDeliveryChange('accessFormFile', file);
                }
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-linkme-turquoise/10 file:text-linkme-turquoise hover:file:bg-linkme-turquoise/20 cursor-pointer"
            />
            {delivery.accessFormFile && (
              <p className="mt-2 text-sm text-green-600">
                Fichier selectionne : {(delivery.accessFormFile as File).name}
              </p>
            )}
          </div>
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
            <h3 className="font-semibold text-gray-900">Notes complementaires</h3>
            <p className="text-sm text-gray-500">
              Instructions particulieres pour la livraison
            </p>
          </div>
        </div>

        <Textarea
          id="notes"
          value={delivery.notes || ''}
          onChange={(e) => handleDeliveryChange('notes', e.target.value)}
          placeholder="Ex: Livraison par l'entree de service, interphone code 1234..."
          rows={4}
        />
      </Card>

      {/* ================================================================
          INFO
          ================================================================ */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Bon a savoir</p>
            <p className="mt-1">
              Notre equipe vous contactera pour confirmer les details de livraison une
              fois la commande validee. Les delais standards sont de 2 a 4 semaines
              selon les produits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShippingStep;
