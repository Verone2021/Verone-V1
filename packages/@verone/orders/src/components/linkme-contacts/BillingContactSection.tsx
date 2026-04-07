'use client';

/**
 * BillingContactSection — Section "Contact de facturation"
 *
 * @module BillingContactSection
 */

import { User } from 'lucide-react';

import type { ContactBO } from '../../hooks/linkme/use-organisation-contacts-bo';

import { ContactCardBO, CreateNewContactCard } from './ContactCardBO';
import { NewContactForm, type NewContactFormData } from './NewContactForm';
import { SectionHeader } from './SectionHeader';
import type { SelectedContact } from './ContactsAddressesSection.types';

// ============================================================================
// TYPES
// ============================================================================

interface BillingContactSectionProps {
  contacts: ContactBO[];
  billingContact: SelectedContact | null;
  isComplete: boolean;
  isOpen: boolean;
  showNewForm: boolean;
  isSubmitting: boolean;
  onToggle: () => void;
  onSelectContact: (contact: ContactBO) => void;
  onShowNewForm: () => void;
  onHideNewForm: () => void;
  onCreateContact: (formData: NewContactFormData) => Promise<void>;
}

// ============================================================================
// COMPOSANT
// ============================================================================

export function BillingContactSection({
  contacts,
  billingContact,
  isComplete,
  isOpen,
  showNewForm,
  isSubmitting,
  onToggle,
  onSelectContact,
  onShowNewForm,
  onHideNewForm,
  onCreateContact,
}: BillingContactSectionProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <SectionHeader
        icon={<User className="h-4 w-4" />}
        title="Contact de facturation"
        subtitle={
          billingContact
            ? `${billingContact.firstName} ${billingContact.lastName}`
            : 'Sélectionnez un contact'
        }
        isComplete={isComplete}
        isOpen={isOpen}
        onToggle={onToggle}
      />

      {isOpen && (
        <div className="p-4 pt-0 space-y-3">
          {/* Contacts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {contacts.map(contact => (
              <ContactCardBO
                key={contact.id}
                contact={contact}
                isSelected={billingContact?.id === contact.id}
                onClick={() => onSelectContact(contact)}
              />
            ))}
            <CreateNewContactCard
              onClick={onShowNewForm}
              isActive={showNewForm}
            />
          </div>

          {/* New contact form */}
          {showNewForm && (
            <NewContactForm
              onSubmit={onCreateContact}
              onCancel={onHideNewForm}
              isSubmitting={isSubmitting}
              sectionLabel="Nouveau contact de facturation"
            />
          )}
        </div>
      )}
    </div>
  );
}
