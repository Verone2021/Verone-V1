'use client';

import { useState } from 'react';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import {
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
} from '@verone/ui';
import { Loader2, Mail, Phone, Plus, Users, X } from 'lucide-react';

import { CreateNewContactCard } from '../../../components/contacts/ContactCardBO';
import type { ContactBO } from '../../../hooks/use-organisation-contacts-bo';
import { useCreateContactBO } from '../../../hooks/use-organisation-contacts-bo';

import { DeleteContactDialog } from './DeleteContactDialog';
import { EnseigneContactCard } from './EnseigneContactCard';

interface EnseigneContactsSectionProps {
  enseigneId: string;
  contacts: ContactBO[];
  isLoading: boolean;
}

const EMPTY_CONTACT_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  title: '',
  isBillingContact: false,
  isPrimaryContact: false,
  isTechnicalContact: false,
};

export function EnseigneContactsSection({
  enseigneId,
  contacts,
  isLoading,
}: EnseigneContactsSectionProps) {
  // Create dialog
  const [showCreateContact, setShowCreateContact] = useState(false);
  const [newContact, setNewContact] = useState(EMPTY_CONTACT_FORM);
  const createContactMutation = useCreateContactBO();

  // Delete dialog
  const [deleteContact, setDeleteContact] = useState<ContactBO | null>(null);

  const handleCreateContact = () => {
    if (!newContact.firstName || !newContact.lastName || !newContact.email)
      return;
    void createContactMutation
      .mutateAsync({
        enseigneId,
        firstName: newContact.firstName,
        lastName: newContact.lastName,
        email: newContact.email,
        phone: newContact.phone || undefined,
        title: newContact.title || undefined,
        isBillingContact: newContact.isBillingContact,
        isPrimaryContact: newContact.isPrimaryContact,
        isTechnicalContact: newContact.isTechnicalContact,
      })
      .then(() => {
        setShowCreateContact(false);
        setNewContact(EMPTY_CONTACT_FORM);
      })
      .catch((error: unknown) => {
        console.error('[EnseigneContacts] Create contact failed:', error);
      });
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-500" />
              Contacts de l&apos;enseigne
              <span className="text-sm font-normal text-gray-500">
                ({contacts.length})
              </span>
            </CardTitle>
            <Button size="sm" onClick={() => setShowCreateContact(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nouveau contact
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Ces contacts sont partagés avec tous les restaurants de
            l&apos;enseigne et visibles dans le formulaire de commande LinkMe.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : !contacts.length ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-sm text-gray-500 mb-2">
                Aucun contact pour cette enseigne
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Les contacts enseigne sont visibles par tous les restaurants de
                l&apos;enseigne lors de la création de commande.
              </p>
              <Button
                variant="outline"
                onClick={() => setShowCreateContact(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter un contact
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {contacts.map(contact => (
                <EnseigneContactCard
                  key={contact.id}
                  contact={contact}
                  onDelete={setDeleteContact}
                />
              ))}
              <div className="min-h-[180px]">
                <CreateNewContactCard
                  onClick={() => setShowCreateContact(true)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Contact Dialog */}
      <Dialog open={showCreateContact} onOpenChange={setShowCreateContact}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-500" />
              Nouveau contact enseigne
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="create-firstName">Prénom *</Label>
                <Input
                  id="create-firstName"
                  value={newContact.firstName}
                  onChange={e =>
                    setNewContact(prev => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  placeholder="Jean"
                />
              </div>
              <div>
                <Label htmlFor="create-lastName">Nom *</Label>
                <Input
                  id="create-lastName"
                  value={newContact.lastName}
                  onChange={e =>
                    setNewContact(prev => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  placeholder="Dupont"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="create-email">
                <Mail className="h-3.5 w-3.5 inline mr-1" />
                Email *
              </Label>
              <Input
                id="create-email"
                type="email"
                value={newContact.email}
                onChange={e =>
                  setNewContact(prev => ({ ...prev, email: e.target.value }))
                }
                placeholder="jean.dupont@example.com"
              />
            </div>
            <div>
              <Label htmlFor="create-phone">
                <Phone className="h-3.5 w-3.5 inline mr-1" />
                Téléphone
              </Label>
              <Input
                id="create-phone"
                value={newContact.phone}
                onChange={e =>
                  setNewContact(prev => ({ ...prev, phone: e.target.value }))
                }
                placeholder="06 12 34 56 78"
              />
            </div>
            <div>
              <Label htmlFor="create-title">Fonction</Label>
              <Input
                id="create-title"
                value={newContact.title}
                onChange={e =>
                  setNewContact(prev => ({ ...prev, title: e.target.value }))
                }
                placeholder="Directeur commercial"
              />
            </div>
            {/* Rôles */}
            <div>
              <Label className="mb-2 block">Rôles</Label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={newContact.isPrimaryContact}
                    onCheckedChange={(checked: boolean) =>
                      setNewContact(prev => ({
                        ...prev,
                        isPrimaryContact: checked,
                      }))
                    }
                  />
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-green-100 text-green-700">
                    Responsable
                  </span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={newContact.isBillingContact}
                    onCheckedChange={(checked: boolean) =>
                      setNewContact(prev => ({
                        ...prev,
                        isBillingContact: checked,
                      }))
                    }
                  />
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 text-blue-700">
                    Facturation
                  </span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={newContact.isTechnicalContact}
                    onCheckedChange={(checked: boolean) =>
                      setNewContact(prev => ({
                        ...prev,
                        isTechnicalContact: checked,
                      }))
                    }
                  />
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-violet-100 text-violet-700">
                    Technique
                  </span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateContact(false)}
            >
              <X className="h-4 w-4 mr-1" />
              Annuler
            </Button>
            <Button
              onClick={handleCreateContact}
              disabled={
                !newContact.firstName ||
                !newContact.lastName ||
                !newContact.email ||
                createContactMutation.isPending
              }
            >
              {createContactMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contact Dialog */}
      <DeleteContactDialog
        open={!!deleteContact}
        onOpenChange={open => {
          if (!open) setDeleteContact(null);
        }}
        contact={deleteContact}
        enseigneId={enseigneId}
      />
    </>
  );
}
