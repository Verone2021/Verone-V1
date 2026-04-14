'use client';

/**
 * BillingContactSection - Section contact de facturation
 *
 * @module BillingContactSection
 * @since 2026-04-14
 */

import { Card, Input, Label, Checkbox, cn } from '@verone/ui';
import { FileText, User, Check, AlertTriangle } from 'lucide-react';

import type {
  ContactBase,
  BillingContactData,
  ContactsStepData,
} from '../../schemas/order-form.schema';
import { defaultContact } from '../../schemas/order-form.schema';

// ============================================================================
// CONTACT FORM
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

// ============================================================================
// BILLING CONTACT SECTION
// ============================================================================

interface BillingContactSectionProps {
  billingContact: BillingContactData;
  responsable: ContactsStepData['responsable'];
  isFranchise: boolean;
  showContactForm: boolean;
  isBillingContactComplete: boolean;
  onSameAsResponsable: () => void;
  onCreateNew: () => void;
  onContactChange: (field: keyof ContactBase, value: string) => void;
}

export function BillingContactSection({
  billingContact,
  responsable,
  isFranchise,
  showContactForm,
  isBillingContactComplete,
  onSameAsResponsable,
  onCreateNew,
  onContactChange,
}: BillingContactSectionProps) {
  return (
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
            La facturation doit etre geree par le proprietaire du restaurant ou
            ses employes.
          </span>
        </div>
      )}

      <Card className="p-4">
        <div className="space-y-4">
          {/* Option "Meme que responsable" */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="billing-same-as-responsable"
              checked={billingContact.mode === 'same_as_responsable'}
              onCheckedChange={() => onSameAsResponsable()}
            />
            <Label
              htmlFor="billing-same-as-responsable"
              className="text-sm font-medium cursor-pointer"
            >
              Meme contact que le responsable de commande
            </Label>
          </div>

          {/* Info same as responsable */}
          {billingContact.mode === 'same_as_responsable' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-700">
                  <p className="font-medium">
                    Contact identique au responsable commande
                  </p>
                  {responsable.firstName && (
                    <p className="mt-1">
                      {responsable.firstName} {responsable.lastName} -{' '}
                      {responsable.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Formulaire nouveau contact */}
          {billingContact.mode !== 'same_as_responsable' && (
            <div className="pt-2">
              {!showContactForm && (
                <button
                  type="button"
                  onClick={onCreateNew}
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
                    contact={billingContact.contact ?? defaultContact}
                    onChange={onContactChange}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </Card>
  );
}
