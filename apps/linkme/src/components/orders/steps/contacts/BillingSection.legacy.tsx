'use client';

/**
 * BillingSection - Section Facturation complète
 *
 * Gère le contact et l'adresse de facturation avec :
 * - Option "Même que responsable"
 * - Option "Utiliser org mère" (succursale uniquement)
 * - Sélection de contact existant ou création
 * - Formulaire d'adresse avec champs légaux (SIRET, TVA)
 *
 * @module BillingSection
 * @since 2026-01-20
 */

import { useState, useCallback, useMemo } from 'react';

import { Card, cn, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@verone/ui';
import { FileText, ChevronDown, Check, AlertCircle } from 'lucide-react';

import type { OrganisationContact } from '@/lib/hooks/use-organisation-contacts';

import type {
  ContactsStepData,
  BillingSectionData,
  ContactBase,
  PartialAddressData,
} from '../../schemas/order-form.schema';
import { defaultContact } from '../../schemas/order-form.schema';

import { ContactSelector } from './ContactSelector';
import { AddressForm } from './AddressForm';

// ============================================================================
// TYPES
// ============================================================================

interface ParentOrganisation {
  id: string;
  legal_name: string | null;
  trade_name: string | null;
  siret: string | null;
  vat_number: string | null;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  billing_address_line1: string | null;
  billing_address_line2: string | null;
  billing_postal_code: string | null;
  billing_city: string | null;
  billing_country: string | null;
}

interface BillingSectionProps {
  /** Données de facturation actuelles */
  billing: BillingSectionData;
  /** Callback pour mettre à jour les données */
  onUpdate: (data: Partial<BillingSectionData>) => void;
  /** Contacts existants de l'organisation */
  existingContacts: OrganisationContact[];
  /** Organisation mère (si succursale) */
  parentOrganisation: ParentOrganisation | null;
  /** Est-ce une franchise ? (pas d'option org mère) */
  isFranchise: boolean;
  /** Section ouverte par défaut */
  defaultOpen?: boolean;
}

// ============================================================================
// HELPER: Build parent org address
// ============================================================================

function buildParentOrgAddress(parentOrg: ParentOrganisation): PartialAddressData {
  // Prefer billing address if available, otherwise use main address
  const hasBillingAddress = parentOrg.billing_address_line1 && parentOrg.billing_city;

  return {
    legalName: parentOrg.legal_name,
    tradeName: parentOrg.trade_name,
    siret: parentOrg.siret,
    vatNumber: parentOrg.vat_number,
    addressLine1: hasBillingAddress
      ? parentOrg.billing_address_line1
      : parentOrg.address_line1 || '',
    addressLine2: hasBillingAddress
      ? parentOrg.billing_address_line2
      : parentOrg.address_line2,
    postalCode: hasBillingAddress
      ? parentOrg.billing_postal_code || ''
      : parentOrg.postal_code || '',
    city: hasBillingAddress
      ? parentOrg.billing_city || ''
      : parentOrg.city || '',
    country: hasBillingAddress
      ? parentOrg.billing_country || 'FR'
      : parentOrg.country || 'FR',
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BillingSection({
  billing,
  onUpdate,
  existingContacts,
  parentOrganisation,
  isFranchise,
  defaultOpen = false,
}: BillingSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showContactForm, setShowContactForm] = useState(false);

  // Check if section is complete
  const isComplete = useMemo(() => {
    if (billing.sameAsResponsable || billing.useParentOrg) {
      return true;
    }
    // Need contact (existing or new) with valid address
    const hasContact =
      billing.existingContactId ||
      (billing.contact?.firstName && billing.contact?.lastName && billing.contact?.email);
    return !!hasContact;
  }, [billing]);

  // Handle "same as responsable" toggle
  const handleSameAsResponsable = useCallback(() => {
    const newValue = !billing.sameAsResponsable;
    onUpdate({
      sameAsResponsable: newValue,
      useParentOrg: newValue ? false : billing.useParentOrg,
      existingContactId: null,
      contact: null,
    });
    setShowContactForm(false);
  }, [billing, onUpdate]);

  // Handle "use parent org" toggle
  const handleUseParentOrg = useCallback(() => {
    const newValue = !billing.useParentOrg;
    onUpdate({
      useParentOrg: newValue,
      sameAsResponsable: newValue ? false : billing.sameAsResponsable,
      existingContactId: null,
      contact: null,
      // Pre-fill address from parent org if toggling on
      address: newValue && parentOrganisation
        ? buildParentOrgAddress(parentOrganisation)
        : null,
    });
    setShowContactForm(false);
  }, [billing, parentOrganisation, onUpdate]);

  // Handle contact selection
  const handleContactSelect = useCallback(
    (contact: OrganisationContact) => {
      onUpdate({
        existingContactId: contact.id,
        contact: {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone || contact.mobile || '',
          position: contact.title || '',
        },
        sameAsResponsable: false,
        useParentOrg: false,
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
      useParentOrg: false,
    });
  }, [onUpdate]);

  // Handle contact form field change
  const handleContactChange = useCallback(
    (field: keyof ContactBase, value: string) => {
      onUpdate({
        contact: {
          ...(billing.contact || defaultContact),
          [field]: value,
        },
      });
    },
    [billing.contact, onUpdate]
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
    !billing.sameAsResponsable &&
    (billing.useParentOrg || billing.existingContactId || showContactForm);

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
                    : 'bg-amber-100 text-amber-600'
                )}
              >
                {isComplete ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">
                  Facturation
                </h3>
                <p className="text-sm text-gray-500">
                  Contact et adresse de facturation
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
              selectedId={billing.existingContactId || null}
              onSelect={handleContactSelect}
              onCreateNew={handleCreateNew}
              showSameAsOption
              onSameAsResponsable={handleSameAsResponsable}
              isSameAsResponsableActive={billing.sameAsResponsable}
              showParentOrgOption={!isFranchise && !!parentOrganisation}
              onUseParentOrg={handleUseParentOrg}
              isUseParentOrgActive={billing.useParentOrg}
              parentOrgName={parentOrganisation?.trade_name || parentOrganisation?.legal_name || ''}
            />

            {/* Contact Form (if creating new) */}
            {showContactForm && !billing.sameAsResponsable && !billing.useParentOrg && (
              <div className="pt-4 border-t space-y-4">
                <h4 className="text-sm font-medium text-gray-700">
                  Nouveau contact facturation
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={billing.contact?.firstName || ''}
                      onChange={(e) => handleContactChange('firstName', e.target.value)}
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
                      value={billing.contact?.lastName || ''}
                      onChange={(e) => handleContactChange('lastName', e.target.value)}
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
                      value={billing.contact?.email || ''}
                      onChange={(e) => handleContactChange('email', e.target.value)}
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
                      value={billing.contact?.phone || ''}
                      onChange={(e) => handleContactChange('phone', e.target.value)}
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
                  Adresse de facturation
                </h4>
                <AddressForm
                  address={billing.address || null}
                  onChange={handleAddressChange}
                  showLegalFields
                  showSaveAsDefault={!billing.useParentOrg}
                  saveAsDefault={billing.saveAddressAsDefault}
                  onSaveAsDefaultChange={handleSaveAsDefaultChange}
                  readOnly={billing.useParentOrg}
                  idPrefix="billing"
                />
              </div>
            )}

            {/* Info for parent org option */}
            {billing.useParentOrg && parentOrganisation && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-purple-700">
                    <p className="font-medium">Facturation centralisée</p>
                    <p className="mt-1">
                      La facture sera adressée à l&apos;organisation mère :{' '}
                      <strong>{parentOrganisation.trade_name || parentOrganisation.legal_name}</strong>
                    </p>
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

export default BillingSection;
