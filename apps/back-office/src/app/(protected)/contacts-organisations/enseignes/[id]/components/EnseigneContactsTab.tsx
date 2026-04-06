'use client';

import type { UseMutationResult } from '@tanstack/react-query';

import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Switch } from '@verone/ui';
import { Loader2, Mail, Phone, Plus, Users, X } from 'lucide-react';

import {
  ContactCardBO,
  CreateNewContactCard,
} from '../../../../canaux-vente/linkme/components/contacts/ContactCardBO';
import type {
  ContactBO,
  CreateContactInput,
} from '../../../../canaux-vente/linkme/hooks/use-organisation-contacts-bo';

interface ContactData {
  contacts: ContactBO[];
  primaryContact?: ContactBO | null;
  billingContact?: ContactBO | null;
}

interface NewContactState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  isBillingContact: boolean;
  isPrimaryContact: boolean;
  isCommercialContact: boolean;
  isTechnicalContact: boolean;
}

interface EnseigneContactsTabProps {
  contactsData: ContactData | null | undefined;
  contactsLoading: boolean;
  showCreateContact: boolean;
  setShowCreateContact: (open: boolean) => void;
  newContact: NewContactState;
  setNewContact: (updater: (prev: NewContactState) => NewContactState) => void;
  createContactMutation: UseMutationResult<
    { id: string; first_name: string; last_name: string; email: string },
    Error,
    CreateContactInput
  >;
  handleCreateEnseigneContact: () => void;
}

export function EnseigneContactsTab({
  contactsData,
  contactsLoading,
  showCreateContact,
  setShowCreateContact,
  newContact,
  setNewContact,
  createContactMutation,
  handleCreateEnseigneContact,
}: EnseigneContactsTabProps) {
  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-500" />
              Contacts de l&apos;enseigne
              <span className="text-sm font-normal text-gray-500">
                ({contactsData?.contacts.length ?? 0})
              </span>
            </CardTitle>
            <ButtonV2 size="sm" onClick={() => setShowCreateContact(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nouveau contact
            </ButtonV2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Ces contacts sont partagés avec tous les restaurants de
            l&apos;enseigne et visibles dans le formulaire de commande LinkMe.
          </p>
        </CardHeader>
        <CardContent>
          {contactsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : !contactsData?.contacts.length ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-sm text-gray-500 mb-2">
                Aucun contact pour cette enseigne
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Les contacts enseigne sont visibles par tous les restaurants
                lors de la création de commande.
              </p>
              <ButtonV2
                variant="outline"
                onClick={() => setShowCreateContact(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter un contact
              </ButtonV2>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {contactsData.contacts.map(contact => (
                <ContactCardBO key={contact.id} contact={contact} showBadges />
              ))}
              <CreateNewContactCard
                onClick={() => setShowCreateContact(true)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal création contact enseigne */}
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
                <Label htmlFor="ct-firstName">Prénom *</Label>
                <Input
                  id="ct-firstName"
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
                <Label htmlFor="ct-lastName">Nom *</Label>
                <Input
                  id="ct-lastName"
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
              <Label htmlFor="ct-email">
                <Mail className="h-3.5 w-3.5 inline mr-1" />
                Email *
              </Label>
              <Input
                id="ct-email"
                type="email"
                value={newContact.email}
                onChange={e =>
                  setNewContact(prev => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="jean.dupont@example.com"
              />
            </div>
            <div>
              <Label htmlFor="ct-phone">
                <Phone className="h-3.5 w-3.5 inline mr-1" />
                Téléphone
              </Label>
              <Input
                id="ct-phone"
                value={newContact.phone}
                onChange={e =>
                  setNewContact(prev => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder="06 12 34 56 78"
              />
            </div>
            <div>
              <Label htmlFor="ct-title">Fonction</Label>
              <Input
                id="ct-title"
                value={newContact.title}
                onChange={e =>
                  setNewContact(prev => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="Responsable achats"
              />
            </div>
            <div className="space-y-2">
              <Label>Role du contact</Label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch
                    checked={newContact.isPrimaryContact}
                    onCheckedChange={checked =>
                      setNewContact(prev => ({
                        ...prev,
                        isPrimaryContact: checked,
                      }))
                    }
                  />
                  <span className="text-sm">Responsable</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch
                    checked={newContact.isBillingContact}
                    onCheckedChange={checked =>
                      setNewContact(prev => ({
                        ...prev,
                        isBillingContact: checked,
                      }))
                    }
                  />
                  <span className="text-sm">Facturation</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <ButtonV2
              variant="outline"
              onClick={() => setShowCreateContact(false)}
            >
              <X className="h-4 w-4 mr-1" />
              Annuler
            </ButtonV2>
            <ButtonV2
              onClick={handleCreateEnseigneContact}
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
            </ButtonV2>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
