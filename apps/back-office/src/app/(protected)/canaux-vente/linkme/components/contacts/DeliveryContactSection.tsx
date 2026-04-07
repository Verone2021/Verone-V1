'use client';

import { User } from 'lucide-react';

import { Checkbox, Label } from '@verone/ui';

import type { ContactBO } from '../../hooks/use-organisation-contacts-bo';
import type { useCreateContactBO } from '../../hooks/use-organisation-contacts-bo';

import { SectionHeader } from './SectionHeader';
import { ContactCardBO, CreateNewContactCard } from './ContactCardBO';
import { NewContactForm, type NewContactFormData } from './NewContactForm';

interface DeliveryContactSectionProps {
  contacts: ContactBO[];
  deliveryContactId: string | null | undefined;
  deliverySameAsBillingContact: boolean;
  deliveryContactName: string | undefined;
  isOpen: boolean;
  showNewForm: boolean;
  isComplete: boolean;
  createContactPending: ReturnType<typeof useCreateContactBO>['isPending'];
  onToggle: () => void;
  onSameAsBillingChange: (checked: boolean) => void;
  onSelectContact: (contact: ContactBO) => void;
  onShowNewForm: () => void;
  onHideNewForm: () => void;
  onCreateContact: (formData: NewContactFormData) => Promise<void>;
}

export function DeliveryContactSection({
  contacts,
  deliveryContactId,
  deliverySameAsBillingContact,
  deliveryContactName,
  isOpen,
  showNewForm,
  isComplete,
  createContactPending,
  onToggle,
  onSameAsBillingChange,
  onSelectContact,
  onShowNewForm,
  onHideNewForm,
  onCreateContact,
}: DeliveryContactSectionProps) {
  const subtitle = deliverySameAsBillingContact
    ? 'Identique au contact de facturation'
    : (deliveryContactName ?? 'Sélectionnez un contact');

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

          {!deliverySameAsBillingContact && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {contacts.map(contact => (
                  <ContactCardBO
                    key={contact.id}
                    contact={contact}
                    isSelected={deliveryContactId === contact.id}
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
                  isSubmitting={createContactPending}
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
