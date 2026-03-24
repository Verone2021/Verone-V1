'use client';

import { useState } from 'react';

import { Button, ConfirmDialog, Skeleton, TabsContent } from '@verone/ui';
import { Plus, User } from 'lucide-react';

import { CreateContactDialog } from '../CreateContactDialog';
import {
  useDeleteContact,
  type OrganisationContact,
} from '../../../lib/hooks/use-organisation-contacts';
import { ContactCard } from './SharedComponents';
import type { useOrganisationDetail } from '../../../lib/hooks/use-organisation-detail';

// ============================================================================
// TYPES
// ============================================================================

type OrganisationDetailData = NonNullable<
  ReturnType<typeof useOrganisationDetail>['data']
>;

interface ContactsTabProps {
  organisationId: string | null;
  data: OrganisationDetailData | undefined;
  mode: 'view' | 'edit';
  contactsData: { contacts: OrganisationContact[] } | null | undefined;
  contactsLoading: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ContactsTab({
  organisationId,
  data,
  mode,
  contactsData,
  contactsLoading,
}: ContactsTabProps) {
  const [showCreateContact, setShowCreateContact] = useState(false);
  const [editingContact, setEditingContact] =
    useState<OrganisationContact | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] =
    useState<OrganisationContact | null>(null);
  const deleteContact = useDeleteContact();

  return (
    <TabsContent value="contacts" className="mt-4 space-y-3">
      {/* Bouton Nouveau contact (mode edit uniquement) */}
      {mode === 'edit' && (
        <Button
          variant="outline"
          size="sm"
          className="w-full border-dashed"
          onClick={() => setShowCreateContact(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau contact
        </Button>
      )}

      {contactsLoading && (
        <div className="space-y-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {!contactsLoading &&
        contactsData?.contacts &&
        contactsData.contacts.length > 0 && (
          <div className="space-y-2">
            {contactsData.contacts.map(c => (
              <ContactCard
                key={c.id}
                contact={c}
                mode={mode}
                onEdit={ct => {
                  setEditingContact(ct);
                  setShowCreateContact(true);
                }}
                onDelete={ct => {
                  setContactToDelete(ct);
                  setDeleteDialogOpen(true);
                }}
              />
            ))}
          </div>
        )}

      {!contactsLoading &&
        (!contactsData?.contacts || contactsData.contacts.length === 0) && (
          <div className="text-center py-8 text-gray-400">
            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucun contact renseigné</p>
            {mode === 'edit' && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-linkme-turquoise"
                onClick={() => setShowCreateContact(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter un contact
              </Button>
            )}
          </div>
        )}

      {/* Dialog de création / édition */}
      {organisationId && (
        <CreateContactDialog
          organisationId={organisationId}
          organisationName={
            data?.organisation?.trade_name ??
            data?.organisation?.legal_name ??
            ''
          }
          enseigneId={data?.organisation?.enseigne_id}
          open={showCreateContact}
          onOpenChange={open => {
            setShowCreateContact(open);
            if (!open) setEditingContact(null);
          }}
          contact={editingContact}
        />
      )}

      {/* Dialog de confirmation de suppression */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Supprimer ce contact ?"
        description={`${contactToDelete ? `${contactToDelete.firstName} ${contactToDelete.lastName}` : 'Ce contact'} sera définitivement supprimé. Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        onConfirm={() => {
          if (contactToDelete && organisationId) {
            void deleteContact
              .mutateAsync({
                contactId: contactToDelete.id,
                organisationId,
              })
              .then(() => {
                setDeleteDialogOpen(false);
                setContactToDelete(null);
              })
              .catch((err: unknown) => {
                console.error('[OrganisationDetailSheet] Delete failed:', err);
              });
          }
        }}
        loading={deleteContact.isPending}
      />
    </TabsContent>
  );
}
