'use client';

/**
 * DeliveryContactSection — Section "Contact de livraison"
 * Inclut la checkbox "Identique au contact de facturation"
 *
 * @module DeliveryContactSection
 */

import { User } from 'lucide-react';

import { Checkbox, Label } from '@verone/ui';

import type { ContactBO } from '../../hooks/linkme/use-organisation-contacts-bo';

import { ContactCardBO, CreateNewContactCard } from './ContactCardBO';
import { NewContactForm, type NewContactFormData } from './NewContactForm';
import { SectionHeader } from './SectionHeader';
import type { SelectedContact } from './ContactsAddressesSection.types';

// ============================================================================
// TYPES
// ============================================================================

interface DeliveryContactSectionProps {
  contacts: ContactBO[];
  deliveryContact: SelectedContact | null;
  deliverySameAsBillingContact: boolean;
  isComplete: boolean;
  isOpen: boolean;
  showNewForm: boolean;
  isSubmitting: boolean;
  onToggle: () => void;
  onSameAsBillingChange: (checked: boolean) => void;
  onSelectContact: (contact: ContactBO) => void;
  onShowNewForm: () => void;
  onHideNewForm: () => void;
  onCreateContact: (formData: NewContactFormData) => Promise<void>;
}

// ============================================================================
// COMPOSANT
// ============================================================================

export function DeliveryContactSection({
  contacts,
  deliveryContact,
  deliverySameAsBillingContact,
  isComplete,
  isOpen,
  showNewForm,
  isSubmitting,
  onToggle,
  onSameAsBillingChange,
  onSelectContact,
  onShowNewForm,
  onHideNewForm,
  onCreateContact,
}: DeliveryContactSectionProps) {
  const subtitle = deliverySameAsBillingContact
    ? 'Identique au contact de facturation'
    : deliveryContact
      ? `${deliveryContact.firstName} ${deliveryContact.lastName}`
      : 'Sélectionnez un contact';

  return (
    <div className="border rounded-lg overflow-hidden">
      <SectionHeader
        icon={<User className="h-4 w-4" />}
        title="Contact de livraison"
        subtitle={subtitle}
        isComplete={isComplete}
        isOpen={isOpen}
        onToggle={onToggle}
      />

      {isOpen && (
        <div className="p-4 pt-0 space-y-3">
          {/* Same as billing checkbox */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Checkbox
              id="delivery-same-billing-contact"
              checked={deliverySameAsBillingContact}
              onCheckedChange={onSameAsBillingChange}
            />
            <Label
              htmlFor="delivery-same-billing-contact"
              className="text-sm font-normal cursor-pointer"
            >
              Identique au contact de facturation
            </Label>
          </div>

          {/* Contact grid (if not same as billing) */}
          {!deliverySameAsBillingContact && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {contacts.map(contact => (
                  <ContactCardBO
                    key={contact.id}
                    contact={contact}
                    isSelected={deliveryContact?.id === contact.id}
                    onClick={() => onSelectContact(contact)}
                  />
                ))}
                <CreateNewContactCard
                  onClick={onShowNewForm}
                  isActive={showNewForm}
                />
              </div>

              {showNewForm && (
                <NewContactForm
                  onSubmit={onCreateContact}
                  onCancel={onHideNewForm}
                  isSubmitting={isSubmitting}
                  sectionLabel="Nouveau contact de livraison"
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
