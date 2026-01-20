'use client';

/**
 * ContactsStep - Etape 5 du formulaire de commande (V2)
 *
 * 4 sections distinctes:
 * 1. Contact Responsable (obligatoire) - Personne responsable de la commande
 * 2. Contact Facturation (personne) - Via petites cartes
 * 3. Adresse Facturation (V2) - Organisation fixe, gestion des adresses
 * 4. Contact Livraison (optionnel) - Si different du responsable
 *
 * @module ContactsStep
 * @since 2026-01-20 (V2: BillingAddressSection replaces BillingOrgSection)
 */

import { useState, useCallback, useMemo } from 'react';

import {
  Card,
  Input,
  Label,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
} from '@verone/ui';
import { User, ChevronDown, Check, AlertCircle, FileText } from 'lucide-react';

import { useOrganisationContacts } from '@/lib/hooks/use-organisation-contacts';
import { useEnseigneId } from '@/lib/hooks/use-enseigne-id';

import type {
  OrderFormData,
  ContactsStepData,
  ContactBase,
  BillingContactData,
  BillingAddressData,
  DeliverySectionData,
} from '../schemas/order-form.schema';
import { defaultContact } from '../schemas/order-form.schema';

import { ContactGrid } from './contacts/ContactGrid';
import { BillingAddressSection } from './contacts/BillingAddressSection';
import { DeliverySection } from './contacts/DeliverySection';

import type { OrganisationContact } from '@/lib/hooks/use-organisation-contacts';

// ============================================================================
// TYPES
// ============================================================================

interface ContactsStepProps {
  formData: OrderFormData;
  errors: string[];
  onUpdate: (data: Partial<ContactsStepData>) => void;
}

// ============================================================================
// SUB-COMPONENT: Contact Form (inline)
// ============================================================================

interface ContactFormProps {
  contact: ContactBase;
  onChange: (field: keyof ContactBase, value: string) => void;
  showCompany?: boolean;
  prefix?: string;
}

function ContactForm({
  contact,
  onChange,
  showCompany = false,
  prefix = '',
}: ContactFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor={`${prefix}firstName`}>
          Prenom <span className="text-red-500">*</span>
        </Label>
        <Input
          id={`${prefix}firstName`}
          type="text"
          value={contact.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
          placeholder="Jean"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}lastName`}>
          Nom <span className="text-red-500">*</span>
        </Label>
        <Input
          id={`${prefix}lastName`}
          type="text"
          value={contact.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
          placeholder="Dupont"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}email`}>
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id={`${prefix}email`}
          type="email"
          value={contact.email}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder="jean.dupont@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}phone`}>Telephone</Label>
        <Input
          id={`${prefix}phone`}
          type="tel"
          value={contact.phone || ''}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder="06 12 34 56 78"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}position`}>Fonction</Label>
        <Input
          id={`${prefix}position`}
          type="text"
          value={contact.position || ''}
          onChange={(e) => onChange('position', e.target.value)}
          placeholder="Directeur, Gerant..."
        />
      </div>

      {showCompany && (
        <div className="space-y-2">
          <Label htmlFor={`${prefix}company`}>Societe</Label>
          <Input
            id={`${prefix}company`}
            type="text"
            value={contact.company || ''}
            onChange={(e) => onChange('company', e.target.value)}
            placeholder="Nom de la societe"
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ContactsStep({ formData, errors, onUpdate }: ContactsStepProps) {
  const [openSections, setOpenSections] = useState<string[]>([
    'responsable',
    'billingContact',
  ]);
  const [showResponsableForm, setShowResponsableForm] = useState(
    !formData.contacts.existingResponsableId
  );

  // Get enseigne ID
  const enseigneId = useEnseigneId();

  // Fetch organisation contacts (if restaurant selected)
  const organisationId =
    formData.restaurant.mode === 'existing'
      ? formData.restaurant.existingId || null
      : null;

  const { data: contactsData } = useOrganisationContacts(
    organisationId,
    enseigneId || null
  );

  // Toggle section
  const toggleSection = useCallback((section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  }, []);

  // Is franchise?
  const isFranchise = useMemo(() => {
    if (formData.restaurant.mode === 'new') {
      return formData.restaurant.newRestaurant?.ownershipType === 'franchise';
    }
    return formData.restaurant.existingOwnershipType === 'franchise';
  }, [formData.restaurant]);

  // Restaurant info for billing address section
  const restaurantInfo = useMemo(() => {
    if (formData.restaurant.mode !== 'existing' || !formData.restaurant.existingId) {
      return null;
    }
    return {
      id: formData.restaurant.existingId,
      name: formData.restaurant.existingName || null,
      city: formData.restaurant.existingCity || null,
      country: formData.restaurant.existingCountry || null,
    };
  }, [formData.restaurant]);

  // Restaurant address for delivery pre-fill
  const restaurantAddress = useMemo(() => {
    if (formData.restaurant.mode === 'new' && formData.restaurant.newRestaurant) {
      return {
        address_line1: formData.restaurant.newRestaurant.address,
        postal_code: formData.restaurant.newRestaurant.postalCode,
        city: formData.restaurant.newRestaurant.city,
        country: formData.restaurant.newRestaurant.country,
      };
    }
    return null;
  }, [formData.restaurant]);

  // Existing contacts
  const existingContacts = contactsData?.allContacts || [];

  // ========================================
  // RESPONSABLE HANDLERS
  // ========================================

  const handleResponsableChange = useCallback(
    (field: keyof ContactBase, value: string) => {
      onUpdate({
        responsable: {
          ...formData.contacts.responsable,
          [field]: value,
        },
      });
    },
    [formData.contacts.responsable, onUpdate]
  );

  const handleResponsableSelect = useCallback(
    (contact: OrganisationContact) => {
      onUpdate({
        existingResponsableId: contact.id,
        responsable: {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone || contact.mobile || '',
          position: contact.title || '',
        },
      });
      setShowResponsableForm(false);
    },
    [onUpdate]
  );

  const handleResponsableCreateNew = useCallback(() => {
    setShowResponsableForm(true);
    onUpdate({
      existingResponsableId: null,
      responsable: defaultContact,
    });
  }, [onUpdate]);

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

  const handleBillingContactSelect = useCallback(
    (contact: OrganisationContact) => {
      handleBillingContactUpdate({
        mode: 'existing',
        existingContactId: contact.id,
        contact: {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone || contact.mobile || '',
          position: contact.title || '',
        },
      });
    },
    [handleBillingContactUpdate]
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
  }, [formData.contacts.billingContact.mode, handleBillingContactUpdate]);

  const handleBillingContactCreateNew = useCallback(() => {
    handleBillingContactUpdate({
      mode: 'new',
      existingContactId: null,
      contact: defaultContact,
    });
  }, [handleBillingContactUpdate]);

  const handleBillingContactChange = useCallback(
    (field: keyof ContactBase, value: string) => {
      handleBillingContactUpdate({
        contact: {
          ...(formData.contacts.billingContact.contact || defaultContact),
          [field]: value,
        },
      });
    },
    [formData.contacts.billingContact.contact, handleBillingContactUpdate]
  );

  // ========================================
  // BILLING ADDRESS HANDLERS (V2)
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

  // ========================================
  // DELIVERY HANDLERS
  // ========================================

  const handleDeliveryUpdate = useCallback(
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

  // ========================================
  // COMPLETION CHECKS
  // ========================================

  const isResponsableComplete = useMemo(() => {
    const r = formData.contacts.responsable;
    return r.firstName.length >= 2 && r.lastName.length >= 2 && r.email.includes('@');
  }, [formData.contacts.responsable]);

  const isBillingContactComplete = useMemo(() => {
    const bc = formData.contacts.billingContact;
    if (bc.mode === 'same_as_responsable') return true;
    if (bc.existingContactId) return true;
    return !!(
      bc.contact?.firstName &&
      bc.contact?.lastName &&
      bc.contact?.email?.includes('@')
    );
  }, [formData.contacts.billingContact]);

  // Determine if billing contact form should show
  // FIX: Simplified logic - just check mode === 'new'
  const showBillingContactForm = formData.contacts.billingContact.mode === 'new';

  return (
    <div className="space-y-4">
      {/* ================================================================
          SECTION 1: RESPONSABLE RESTAURANT
          ================================================================ */}
      <Collapsible
        open={openSections.includes('responsable')}
        onOpenChange={() => toggleSection('responsable')}
      >
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
                    isResponsableComplete
                      ? 'bg-green-100 text-green-600'
                      : 'bg-blue-100 text-blue-600'
                  )}
                >
                  {isResponsableComplete ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">
                    Responsable Commande
                    <span className="text-red-500 ml-1">*</span>
                  </h3>
                  <p className="text-sm text-gray-500">
                    Contact principal pour cette commande
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-gray-400 transition-transform',
                  openSections.includes('responsable') && 'rotate-180'
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0 border-t space-y-4">
              {/* Contact grid if contacts exist */}
              {existingContacts.length > 0 && (
                <ContactGrid
                  contacts={existingContacts}
                  selectedId={formData.contacts.existingResponsableId || null}
                  onSelect={handleResponsableSelect}
                  onCreateNew={handleResponsableCreateNew}
                  isCreatingNew={showResponsableForm}
                />
              )}

              {/* Contact form */}
              {(showResponsableForm || existingContacts.length === 0) && (
                <div className={existingContacts.length > 0 ? 'pt-4 border-t' : ''}>
                  <ContactForm
                    contact={formData.contacts.responsable}
                    onChange={handleResponsableChange}
                    showCompany={isFranchise}
                    prefix="responsable-"
                  />
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ================================================================
          SECTION 2: CONTACT FACTURATION (PERSONNE)
          ================================================================ */}
      <Collapsible
        open={openSections.includes('billingContact')}
        onOpenChange={() => toggleSection('billingContact')}
      >
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
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">
                    Contact Facturation
                  </h3>
                  <p className="text-sm text-gray-500">
                    Personne a contacter pour la facturation
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-gray-400 transition-transform',
                  openSections.includes('billingContact') && 'rotate-180'
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0 border-t space-y-4">
              {/* Contact grid with "Same as responsable" option */}
              <ContactGrid
                contacts={existingContacts}
                selectedId={formData.contacts.billingContact.existingContactId || null}
                onSelect={handleBillingContactSelect}
                onCreateNew={handleBillingContactCreateNew}
                isCreatingNew={showBillingContactForm}
                showSameAsOption
                onSameAsResponsable={handleBillingContactSameAsResponsable}
                isSameAsResponsableActive={
                  formData.contacts.billingContact.mode === 'same_as_responsable'
                }
              />

              {/* New contact form - FIX: Just check mode === 'new' */}
              {showBillingContactForm && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">
                    Nouveau contact facturation
                  </h4>
                  <ContactForm
                    contact={formData.contacts.billingContact.contact || defaultContact}
                    onChange={handleBillingContactChange}
                    prefix="billingContact-"
                  />
                </div>
              )}

              {/* Same as responsable info */}
              {formData.contacts.billingContact.mode === 'same_as_responsable' && (
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
          SECTION 3: ADRESSE DE FACTURATION (V2)
          Organisation = restaurant (fixe), on gère les adresses
          ================================================================ */}
      <BillingAddressSection
        billingAddress={formData.contacts.billingAddress}
        onUpdate={handleBillingAddressUpdate}
        restaurant={restaurantInfo}
        defaultOpen={openSections.includes('billingAddress')}
      />

      {/* ================================================================
          SECTION 4: LIVRAISON
          ================================================================ */}
      <DeliverySection
        delivery={formData.contacts.delivery}
        onUpdate={handleDeliveryUpdate}
        existingContacts={existingContacts}
        restaurantAddress={restaurantAddress}
        defaultOpen={openSections.includes('delivery')}
      />

      {/* ================================================================
          INFO
          ================================================================ */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Information</p>
            <p className="mt-1">
              Les contacts seront utilises pour la communication concernant cette
              commande. L&apos;adresse de facturation determine ou sera envoyee la facture.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactsStep;
