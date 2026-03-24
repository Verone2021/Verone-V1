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
          <DialogTitle>
            {contactDialogFor === 'responsable'
              ? 'Responsable etablissement'
              : contactDialogFor === 'billing'
                ? 'Responsable facturation'
                : 'Contact livraison'}
          </DialogTitle>
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
              sectionLabel={
                contactDialogFor === 'responsable'
                  ? 'Creer un responsable'
                  : contactDialogFor === 'billing'
                    ? 'Creer un contact facturation'
                    : 'Creer un contact livraison'
              }
              onSubmit={onCreateAndSelect}
              onCancel={onClose}
              isSubmitting={isSubmitting}
            />
          </div>

          {/* RIGHT: Available contacts */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contacts disponibles ({availableContacts.length})
            </h4>
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {availableContacts.length > 0 ? (
                availableContacts.map(contact => (
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
