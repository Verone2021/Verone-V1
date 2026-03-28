'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { User, UserPlus, Users } from 'lucide-react';

import { ContactCardBO } from '../../../components/contacts/ContactCardBO';
import { NewContactForm } from '../../../components/contacts/NewContactForm';
import type { NewContactFormData } from '../../../components/contacts/NewContactForm';
import type { ContactBO } from '../../../hooks/use-organisation-contacts-bo';
import type { ContactRole } from './types';

function getDialogTitle(role: ContactRole | null): string {
  switch (role) {
    case 'responsable':
      return 'Responsable etablissement';
    case 'billing':
      return 'Responsable facturation';
    default:
      return 'Contact livraison';
  }
}

function getFormLabel(role: ContactRole | null): string {
  switch (role) {
    case 'responsable':
      return 'Creer un responsable';
    case 'billing':
      return 'Creer un contact facturation';
    default:
      return 'Creer un contact livraison';
  }
}

function AvailableContactsList({
  contacts,
  selectedContactId,
  onSelectContact,
}: {
  contacts: ContactBO[];
  selectedContactId: string | null;
  onSelectContact: (contactId: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <Users className="h-4 w-4" />
        Contacts disponibles ({contacts.length})
      </h4>
      <div className="space-y-2 max-h-[350px] overflow-y-auto">
        {contacts.length > 0 ? (
          contacts.map(contact => (
            <ContactCardBO
              key={contact.id}
              contact={contact}
              isSelected={selectedContactId === contact.id}
              onClick={() => onSelectContact(contact.id)}
            />
          ))
        ) : (
          <div className="text-center py-6 text-gray-500">
            <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Aucun contact disponible</p>
            <p className="text-xs mt-1">Creez-en un via le formulaire</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ContactSelectionDialogProps {
  contactDialogFor: ContactRole | null;
  selectedContactId: string | null;
  availableContacts: ContactBO[];
  isSubmitting: boolean;
  onSelectContact: (contactId: string) => void;
  onConfirm: () => void;
  onCreateAndSelect: (contactData: NewContactFormData) => Promise<void>;
  onClose: () => void;
}

export function ContactSelectionDialog({
  contactDialogFor,
  selectedContactId,
  availableContacts,
  isSubmitting,
  onSelectContact,
  onConfirm,
  onCreateAndSelect,
  onClose,
}: ContactSelectionDialogProps) {
  return (
    <Dialog
      open={contactDialogFor !== null}
      onOpenChange={open => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{getDialogTitle(contactDialogFor)}</DialogTitle>
          <DialogDescription>
            Selectionnez un contact existant ou creez-en un nouveau.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* LEFT: New contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Nouveau contact
            </h4>
            <NewContactForm
              sectionLabel={getFormLabel(contactDialogFor)}
              onSubmit={onCreateAndSelect}
              onCancel={onClose}
              isSubmitting={isSubmitting}
            />
          </div>

          <AvailableContactsList
            contacts={availableContacts}
            selectedContactId={selectedContactId}
            onSelectContact={onSelectContact}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            disabled={!selectedContactId || isSubmitting}
            onClick={() => {
              void Promise.resolve(onConfirm()).catch(err => {
                console.error('[ContactSelectionDialog] Confirm failed:', err);
              });
            }}
          >
            {isSubmitting ? 'Enregistrement...' : 'Confirmer la selection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
