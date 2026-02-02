/**
 * LinkMeDeleteUserDialog
 * Modal de suppression/désactivation utilisateur LinkMe
 * Copié du pattern admin/delete-user-dialog.tsx
 */

'use client';

import React, { useState } from 'react';

import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { AlertTriangle, Trash2, X } from 'lucide-react';

import type { LinkMeUser } from '../hooks/use-linkme-users';
import {
  LINKME_ROLE_LABELS,
  LINKME_ROLE_COLORS,
  useDeleteLinkMeUser,
} from '../hooks/use-linkme-users';

interface LinkMeDeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: LinkMeUser | null;
  onUserDeleted?: () => void;
}

export function LinkMeDeleteUserDialog({
  open,
  onOpenChange,
  user,
  onUserDeleted,
}: LinkMeDeleteUserDialogProps) {
  const [error, setError] = useState<string>('');
  const deleteMutation = useDeleteLinkMeUser();

  if (!user) return null;

  const handleDelete = async () => {
    try {
      setError('');

      await deleteMutation.mutateAsync(user.user_id);

      // Fermer le dialog et notifier le parent
      onOpenChange(false);
      onUserDeleted?.();

      console.warn('Utilisateur LinkMe désactivé avec succès');
    } catch (error: unknown) {
      console.error('Erreur suppression utilisateur:', error);
      const message =
        error instanceof Error
          ? error.message
          : "Une erreur inattendue s'est produite";
      setError(message);
    }
  };

  const handleClose = () => {
    if (!deleteMutation.isPending) {
      setError('');
      onOpenChange(false);
    }
  };

  const fullName =
    [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Sans nom';

  const isEnseigneAdmin = user.linkme_role === 'enseigne_admin';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-black">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>Supprimer l'utilisateur</span>
          </DialogTitle>
          <DialogDescription>
            Cette action désactivera le compte de cet utilisateur LinkMe.
          </DialogDescription>
        </DialogHeader>

        {/* Informations utilisateur */}
        <div className="space-y-4 py-4">
          <div className="bg-gray-50 border border-gray-200 p-4 rounded">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-black">{fullName}</h4>
                <p className="text-sm text-black opacity-60">{user.email}</p>
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${LINKME_ROLE_COLORS[user.linkme_role]}`}
              >
                {LINKME_ROLE_LABELS[user.linkme_role]}
              </span>
            </div>
          </div>

          {/* Avertissement spécial pour les admin enseigne */}
          {isEnseigneAdmin && (
            <div className="bg-red-50 border border-red-200 p-3 rounded">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-800">Attention !</p>
                  <p className="text-red-700">
                    Vous supprimez un administrateur d'enseigne. Assurez-vous
                    qu'il existe d'autres administrateurs pour cette enseigne.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded">
              <div className="flex items-center space-x-2 text-red-600">
                <X className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Confirmation */}
          <div className="text-sm text-black opacity-70">
            <p>Confirmez-vous la suppression de cet utilisateur ?</p>
            <p className="mt-1 font-medium">
              Le compte sera désactivé et l'utilisateur ne pourra plus se
              connecter à LinkMe.
            </p>
          </div>
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
            onClick={() => {
              void handleDelete().catch(error => {
                console.error(
                  '[LinkMeDeleteUserDialog] handleDelete failed:',
                  error
                );
              });
            }}
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
