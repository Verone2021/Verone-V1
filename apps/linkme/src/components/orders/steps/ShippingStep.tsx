'use client';

/**
 * ShippingStep - Etape 7 du formulaire de commande
 *
 * Layout split-screen pour contact livraison (comme BillingStep):
 *
 * SECTION 1: CONTACT LIVRAISON (Split-Screen)
 * | GAUCHE (50%)                    | DROITE (50%)                        |
 * | Formulaire pre-rempli           | FRANCHISE:                          |
 * | + Design distinctif             | - "Meme que responsable"            |
 * | + Auto-rempli lors selection    | - Contacts locaux                   |
 * |                                 | - + Nouveau contact                 |
 * |                                 | SUCCURSALE:                         |
 * |                                 | - Contacts locaux (SUR PLACE)       |
 * |                                 | - + Nouveau contact                 |
 * |                                 | (PAS responsable ni enseigne)       |
 *
 * SECTION 2: ADRESSE DE LIVRAISON
 * SECTION 3: DATE ET OPTIONS (centre commercial, semi-remorque, formulaire d'acces)
 * SECTION 4: NOTES
 *
 * @module ShippingStep
 * @since 2026-01-24
 * @updated 2026-01-24 - Refonte UX split-screen + filtrage par type
 */

import { useEffect, useMemo, useCallback, useState } from 'react';

import {
  Card,
  Input,
  Label,
  Textarea,
  Switch,
  Badge,
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
  Check,
  User,
  Plus,
  Package,
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

import { ContactCard } from './contacts/ContactCard';

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
// SUB-COMPONENT: Responsable Card (Meme que responsable - FRANCHISE only)
// ============================================================================

interface ResponsableCardProps {
  onClick: () => void;
  isActive: boolean;
  responsable: ContactBase;
}

function ResponsableCard({ onClick, isActive, responsable }: ResponsableCardProps) {
  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-all hover:shadow-md',
        isActive
          ? 'border-2 border-green-500 bg-green-50/50'
          : 'hover:border-green-300'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            isActive ? 'bg-green-100' : 'bg-gray-100'
          )}
        >
          <User
            className={cn('h-4 w-4', isActive ? 'text-green-600' : 'text-gray-500')}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
              Meme que responsable
            </h3>
            <Badge variant="outline" size="sm" className="text-green-600 border-green-300 bg-green-50 flex-shrink-0">
              Responsable
            </Badge>
            {isActive && (
              <Check className="h-4 w-4 text-green-500 flex-shrink-0 ml-auto" />
            )}
          </div>
          <p className="text-xs font-medium text-gray-700 mt-0.5 truncate">
            {responsable.firstName} {responsable.lastName}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {responsable.email}
          </p>
          {responsable.phone && (
            <p className="text-xs text-gray-400 truncate">
              {responsable.phone}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// SUB-COMPONENT: Create New Card
// ============================================================================

interface CreateNewCardProps {
  onClick: () => void;
  isActive: boolean;
}

function CreateNewCard({ onClick, isActive }: CreateNewCardProps) {
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
        <Plus
          className={cn('h-5 w-5', isActive ? 'text-blue-500' : 'text-gray-400')}
        />
        <span
          className={cn(
            'font-medium text-sm',
            isActive ? 'text-blue-600' : 'text-gray-600'
          )}
        >
          Nouveau contact livraison
        </span>
      </div>
    </Card>
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

  // Contacts disponibles (locaux uniquement - ceux qui sont SUR PLACE)
  const localContacts = useMemo(() => {
    const allContacts = contactsData?.allContacts || [];
    // Pour tous les types, on ne montre que les contacts locaux du restaurant
    return allContacts.filter((c) => c.organisationId === organisationId);
  }, [contactsData?.allContacts, organisationId]);

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

  // Determine if form is in edit mode (a contact is selected or being created)
  const isEditMode = useMemo(() => {
    return (
      formData.contacts.delivery.sameAsResponsable ||
      formData.contacts.delivery.existingContactId ||
      showContactForm
    );
  }, [formData.contacts.delivery.sameAsResponsable, formData.contacts.delivery.existingContactId, showContactForm]);

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

  // Pour franchises - Meme que responsable
  const handleSameAsResponsable = useCallback(() => {
    const resp = formData.contacts.responsable;
    handleDeliveryContactUpdate({
      sameAsResponsable: true,
      existingContactId: null,
      contact: {
        firstName: resp.firstName,
        lastName: resp.lastName,
        email: resp.email,
        phone: resp.phone || '',
        position: resp.position || '',
      },
    });
    setShowContactForm(false);
  }, [formData.contacts.responsable, handleDeliveryContactUpdate]);

  // Deselectionner "Meme que responsable"
  const handleDeselectSameAsResponsable = useCallback(() => {
    handleDeliveryContactUpdate({
      sameAsResponsable: false,
      existingContactId: null,
      contact: null,
    });
    setShowContactForm(false);
  }, [handleDeliveryContactUpdate]);

  // Pour selection d'un contact existant
  const handleContactSelect = useCallback(
    (contact: OrganisationContact) => {
      handleDeliveryContactUpdate({
        sameAsResponsable: false,
        existingContactId: contact.id,
        contact: {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone || contact.mobile || '',
          position: contact.title || '',
        },
      });
      setShowContactForm(false);
    },
    [handleDeliveryContactUpdate]
  );

  // Pour nouveau contact
  const handleCreateNew = useCallback(() => {
    setShowContactForm(true);
    handleDeliveryContactUpdate({
      sameAsResponsable: false,
      existingContactId: null,
      contact: defaultContact,
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
          SECTION 1: CONTACT LIVRAISON (Split-Screen)
          ================================================================ */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
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
          <div>
            <h3 className="font-semibold text-gray-900">
              Contact Livraison / Reception
            </h3>
            <p className="text-sm text-gray-500">
              {isFranchise
                ? 'Personne qui receptionnera la livraison (souvent le responsable)'
                : 'Personne SUR PLACE qui receptionnera la livraison'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GAUCHE: Formulaire avec design distinctif */}
          <Card className={cn(
            'p-4 transition-all',
            isEditMode
              ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200'
              : 'bg-gray-50 border-dashed border-gray-300'
          )}>
            {/* En-tete distinctif */}
            {isEditMode && (
              <div className="flex items-center gap-3 pb-4 border-b border-purple-200 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-purple-900">Contact livraison</h4>
                  <p className="text-xs text-purple-600">Personne a contacter pour la livraison</p>
                </div>
              </div>
            )}

            {/* Message si aucune selection */}
            {!isEditMode && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <User className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-1">Aucun contact selectionne</p>
                <p className="text-xs text-gray-400">
                  Cliquez sur un contact a droite pour le selectionner
                </p>
              </div>
            )}

            {/* Affichage contact selectionne (sameAsResponsable) */}
            {formData.contacts.delivery.sameAsResponsable && (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-700">
                      <p className="font-medium">
                        Contact identique au responsable commande
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Prenom</Label>
                    <p className="text-sm font-medium">{formData.contacts.responsable.firstName}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Nom</Label>
                    <p className="text-sm font-medium">{formData.contacts.responsable.lastName}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Email</Label>
                    <p className="text-sm font-medium">{formData.contacts.responsable.email}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Telephone</Label>
                    <p className="text-sm font-medium">{formData.contacts.responsable.phone || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Affichage contact existant selectionne */}
            {formData.contacts.delivery.existingContactId && !formData.contacts.delivery.sameAsResponsable && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium">Contact selectionne</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Prenom</Label>
                    <p className="text-sm font-medium">{formData.contacts.delivery.contact?.firstName || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Nom</Label>
                    <p className="text-sm font-medium">{formData.contacts.delivery.contact?.lastName || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Email</Label>
                    <p className="text-sm font-medium">{formData.contacts.delivery.contact?.email || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Telephone</Label>
                    <p className="text-sm font-medium">{formData.contacts.delivery.contact?.phone || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Formulaire nouveau contact */}
            {showContactForm && !formData.contacts.delivery.sameAsResponsable && !formData.contacts.delivery.existingContactId && (
              <div className="space-y-4">
                <h5 className="text-sm font-medium text-gray-700">
                  Nouveau contact livraison
                </h5>
                <ContactForm
                  contact={formData.contacts.delivery.contact || defaultContact}
                  onChange={handleContactChange}
                />
              </div>
            )}
          </Card>

          {/* DROITE: Contacts filtres */}
          <Card className="p-4">
            <div className="flex items-center gap-2 pb-3 border-b mb-4">
              <User className="h-4 w-4 text-purple-600" />
              <h4 className="font-medium text-gray-700">Contacts disponibles</h4>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
              </div>
            )}

            {!isLoading && (
              <div className="space-y-3">
                {/* FRANCHISE: Option "Meme que responsable" */}
                {isFranchise && (
                  <ResponsableCard
                    onClick={
                      formData.contacts.delivery.sameAsResponsable
                        ? handleDeselectSameAsResponsable
                        : handleSameAsResponsable
                    }
                    isActive={formData.contacts.delivery.sameAsResponsable}
                    responsable={formData.contacts.responsable}
                  />
                )}

                {/* TOUS: Contacts locaux du restaurant (SUR PLACE) */}
                {localContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    isSelected={
                      formData.contacts.delivery.existingContactId === contact.id &&
                      !formData.contacts.delivery.sameAsResponsable
                    }
                    onClick={() => handleContactSelect(contact)}
                  />
                ))}

                {/* TOUS: Nouveau contact */}
                <CreateNewCard
                  onClick={handleCreateNew}
                  isActive={showContactForm && !formData.contacts.delivery.existingContactId && !formData.contacts.delivery.sameAsResponsable}
                />

                {/* Info si aucun contact local */}
                {localContacts.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">
                    Aucun contact local enregistre pour ce restaurant
                  </p>
                )}

                {/* Info pour succursales */}
                {!isFranchise && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-700">
                        <p className="font-medium">Restaurant en propre</p>
                        <p className="mt-0.5">
                          Seuls les contacts locaux (presents sur place) sont affiches.
                          Le responsable et les contacts enseigne sont au bureau.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </Card>

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
