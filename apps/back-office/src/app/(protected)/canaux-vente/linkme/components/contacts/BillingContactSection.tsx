'use client';

import { User } from 'lucide-react';

import type { ContactBO } from '../../hooks/use-organisation-contacts-bo';
import type { useCreateContactBO } from '../../hooks/use-organisation-contacts-bo';

import { SectionHeader } from './SectionHeader';
import { ContactCardBO, CreateNewContactCard } from './ContactCardBO';
import { NewContactForm, type NewContactFormData } from './NewContactForm';

interface BillingContactSectionProps {
  contacts: ContactBO[];
  billingContactId: string | null | undefined;
  isOpen: boolean;
  showNewForm: boolean;
  isSubmitting: boolean;
  billingContactName: string | undefined;
  isComplete: boolean;
  onToggle: () => void;
  onSelectContact: (contact: ContactBO) => void;
  onShowNewForm: () => void;
  onHideNewForm: () => void;
  onCreateContact: (formData: NewContactFormData) => Promise<void>;
  createContactPending: ReturnType<typeof useCreateContactBO>['isPending'];
}

export function BillingContactSection({
  contacts,
  billingContactId,
  isOpen,
  showNewForm,
  isSubmitting,
  billingContactName,
  isComplete,
  onToggle,
  onSelectContact,
  onShowNewForm,
  onHideNewForm,
  onCreateContact,
  createContactPending,
}: BillingContactSectionProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <SectionHeader
        icon={<User className="h-4 w-4" />}
        title="Contact de facturation"
        subtitle={billingContactName ?? 'Sélectionnez un contact'}
        isComplete={isComplete}
        isOpen={isOpen}
        onToggle={onToggle}
      />

      {isOpen && (
        <div className="p-4 pt-0 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {contacts.map(contact => (
              <ContactCardBO
                key={contact.id}
                contact={contact}
                isSelected={billingContactId === contact.id}
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
              isSubmitting={isSubmitting || createContactPending}
              sectionLabel="Nouveau contact de facturation"
            />
          )}
        </div>
      )}
    </div>
  );
}
