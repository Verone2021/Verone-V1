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
import { Building2, User, UserPlus, Users } from 'lucide-react';

import type {
  ContactBO,
  ContactBOWithSource,
} from '../../../../hooks/use-organisation-contacts-bo';
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
  /** Libellé affiché pour le groupe "organisation" (ex: "Pokawa Avignon") */
  orgLabel?: string | null;
  /** Libellé affiché pour le groupe "enseigne" (ex: "Pokawa SAS") */
  enseigneLabel?: string | null;
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

function hasSource(c: ContactBO): c is ContactBOWithSource {
  return 'source' in c;
}

interface ContactGroupedListProps {
  contacts: ContactBO[];
  selectedContactId: string | null;
  onSelect: (id: string) => void;
  orgLabel?: string | null;
  enseigneLabel?: string | null;
}

function ContactGroupedList({
  contacts,
  selectedContactId,
  onSelect,
  orgLabel,
  enseigneLabel,
}: ContactGroupedListProps) {
  if (contacts.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">Aucun contact disponible</p>
      </div>
    );
  }

  // If contacts carry a source field, group them by enseigne / org
  const allHaveSource = contacts.every(hasSource);
  if (allHaveSource) {
    const typed = contacts;
    const enseigneContacts = typed.filter(c => c.source === 'enseigne');
    const orgContacts = typed.filter(c => c.source === 'org');

    return (
      <div className="space-y-3">
        {enseigneContacts.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Building2 className="h-3.5 w-3.5 text-purple-500" />
              <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                {enseigneLabel ?? 'Enseigne mère'}
              </span>
            </div>
            <div className="space-y-1.5">
              {enseigneContacts.map(contact => (
                <ContactCardBO
                  key={contact.id}
                  contact={contact}
                  isSelected={selectedContactId === contact.id}
                  onClick={() => onSelect(contact.id)}
                />
              ))}
            </div>
          </div>
        )}
        {orgContacts.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Building2 className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                {orgLabel ?? 'Organisation'}
              </span>
            </div>
            <div className="space-y-1.5">
              {orgContacts.map(contact => (
                <ContactCardBO
                  key={contact.id}
                  contact={contact}
                  isSelected={selectedContactId === contact.id}
                  onClick={() => onSelect(contact.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback: flat list (legacy, no source field)
  return (
    <div className="space-y-2">
      {contacts.map(contact => (
        <ContactCardBO
          key={contact.id}
          contact={contact}
          isSelected={selectedContactId === contact.id}
          onClick={() => onSelect(contact.id)}
        />
      ))}
    </div>
  );
}

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
  orgLabel,
  enseigneLabel,
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
            <div className="max-h-[350px] overflow-y-auto">
              <ContactGroupedList
                contacts={availableContacts}
                selectedContactId={selectedContactId}
                onSelect={setSelectedContactId}
                orgLabel={orgLabel}
                enseigneLabel={enseigneLabel}
              />
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
