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

import type { ContactBO } from '../../../../hooks/use-organisation-contacts-bo';
import { ContactCardBO } from '../../../../components/contacts/ContactCardBO';
import { NewContactForm } from '../../../../components/contacts/NewContactForm';
import type { NewContactFormData } from '../../../../components/contacts/NewContactForm';

interface ContactSelectionDialogProps {
  contactDialogFor: 'responsable' | 'billing' | 'delivery' | null;
  setContactDialogFor: (
    role: 'responsable' | 'billing' | 'delivery' | null
  ) => void;
  selectedContactId: string | null;
  setSelectedContactId: (id: string | null) => void;
  availableContacts: ContactBO[];
  onConfirmContact: () => void;
  onCreateAndSelectContact: (data: NewContactFormData) => Promise<void>;
  createContactPending: boolean;
  updateDetailsPending: boolean;
}

const DIALOG_TITLES: Record<'responsable' | 'billing' | 'delivery', string> = {
  responsable: 'Responsable établissement',
  billing: 'Responsable facturation',
  delivery: 'Contact livraison',
};

const NEW_CONTACT_LABELS: Record<
  'responsable' | 'billing' | 'delivery',
  string
> = {
  responsable: 'Créer un responsable',
  billing: 'Créer un contact facturation',
  delivery: 'Créer un contact livraison',
};

export function ContactSelectionDialog({
  contactDialogFor,
  setContactDialogFor,
  selectedContactId,
  setSelectedContactId,
  availableContacts,
  onConfirmContact,
  onCreateAndSelectContact,
  createContactPending,
  updateDetailsPending,
}: ContactSelectionDialogProps) {
  const handleClose = () => {
    setContactDialogFor(null);
    setSelectedContactId(null);
  };

  return (
    <Dialog
      open={contactDialogFor !== null}
      onOpenChange={open => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {contactDialogFor ? DIALOG_TITLES[contactDialogFor] : ''}
          </DialogTitle>
          <DialogDescription>
            Sélectionnez un contact existant ou créez-en un nouveau.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Nouveau contact
            </h4>
            <NewContactForm
              sectionLabel={
                contactDialogFor ? NEW_CONTACT_LABELS[contactDialogFor] : ''
              }
              onSubmit={onCreateAndSelectContact}
              onCancel={handleClose}
              isSubmitting={createContactPending || updateDetailsPending}
            />
          </div>
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
                    onClick={() => setSelectedContactId(contact.id)}
                  />
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Aucun contact disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            disabled={!selectedContactId || updateDetailsPending}
            onClick={onConfirmContact}
          >
            {updateDetailsPending
              ? 'Enregistrement...'
              : 'Confirmer la sélection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
