'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { AlertTriangle, Trash2 } from 'lucide-react';

import type { ContactBO } from '../../../hooks/use-organisation-contacts-bo';
import { useDeleteContactBO } from '../../../hooks/use-organisation-contacts-bo';

interface DeleteContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: ContactBO | null;
  enseigneId: string;
}

export function DeleteContactDialog({
  open,
  onOpenChange,
  contact,
  enseigneId,
}: DeleteContactDialogProps) {
  const deleteMutation = useDeleteContactBO();

  if (!contact) return null;

  const fullName = `${contact.firstName} ${contact.lastName}`;

  const handleDelete = () => {
    void deleteMutation
      .mutateAsync({
        contactId: contact.id,
        enseigneId,
      })
      .then(() => {
        onOpenChange(false);
      })
      .catch((error: unknown) => {
        console.error('[DeleteContactDialog] Delete failed:', error);
      });
  };

  const handleClose = () => {
    if (!deleteMutation.isPending) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-black">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Supprimer le contact
          </DialogTitle>
          <DialogDescription>
            Cette action désactivera le contact. Il ne sera plus visible dans
            les formulaires de commande.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-gray-50 border border-gray-200 p-4 rounded">
            <h4 className="font-medium text-black">{fullName}</h4>
            <p className="text-sm text-black opacity-60">{contact.email}</p>
          </div>

          <p className="text-sm text-gray-600">
            Voulez-vous supprimer le contact{' '}
            <span className="font-medium">{fullName}</span> ({contact.email}) ?
          </p>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <ButtonV2
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={deleteMutation.isPending}
          >
            Annuler
          </ButtonV2>
          <ButtonV2
            type="button"
            variant="destructive"
            icon={Trash2}
            onClick={handleDelete}
            loading={deleteMutation.isPending}
            disabled={deleteMutation.isPending}
          >
            Supprimer
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
