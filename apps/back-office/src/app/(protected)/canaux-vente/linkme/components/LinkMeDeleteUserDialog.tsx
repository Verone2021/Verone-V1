/**
 * LinkMeDeleteUserDialog
 * Dialog adaptatif:
 * - Utilisateur actif → archivage (soft delete, is_active = false)
 * - Utilisateur archivé → suppression définitive (hard delete, libère email)
 */

'use client';

import React, { useState } from 'react';

import { useToast } from '@verone/common';
import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { AlertTriangle, Archive, Trash2, X } from 'lucide-react';

import type { LinkMeUser } from '../hooks/use-linkme-users';
import {
  LINKME_ROLE_LABELS,
  LINKME_ROLE_COLORS,
  useDeleteLinkMeUser,
  useHardDeleteLinkMeUser,
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
  const { toast } = useToast();
  const archiveMutation = useDeleteLinkMeUser();
  const hardDeleteMutation = useHardDeleteLinkMeUser();

  if (!user) return null;

  const isArchived = !user.is_active;
  const isPending = archiveMutation.isPending || hardDeleteMutation.isPending;

  const fullName =
    [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Sans nom';
  const isEnseigneAdmin = user.linkme_role === 'enseigne_admin';

  const handleArchive = async () => {
    try {
      setError('');
      await archiveMutation.mutateAsync(user.user_id);
      onOpenChange(false);
      onUserDeleted?.();
      toast({
        title: 'Utilisateur archivé',
        description: `${fullName} a été archivé avec succès.`,
      });
    } catch (err: unknown) {
      console.error('[LinkMeDeleteUserDialog] Archive failed:', err);
      const message =
        err instanceof Error
          ? err.message
          : "Une erreur inattendue s'est produite";
      setError(message);
    }
  };

  const handleHardDelete = async () => {
    try {
      setError('');
      await hardDeleteMutation.mutateAsync(user.user_id);
      onOpenChange(false);
      onUserDeleted?.();
      toast({
        title: 'Utilisateur supprimé définitivement',
        description: `${fullName} a été supprimé. L'email est désormais disponible.`,
      });
    } catch (err: unknown) {
      console.error('[LinkMeDeleteUserDialog] Hard delete failed:', err);
      const message =
        err instanceof Error
          ? err.message
          : "Une erreur inattendue s'est produite";
      setError(message);
    }
  };

  const handleClose = () => {
    if (!isPending) {
      setError('');
      onOpenChange(false);
    }
  };

  const handleAction = isArchived ? handleHardDelete : handleArchive;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-black">
            {isArchived ? (
              <>
                <Trash2 className="h-5 w-5 text-red-600" />
                <span>Supprimer définitivement</span>
              </>
            ) : (
              <>
                <Archive className="h-5 w-5 text-orange-500" />
                <span>Archiver l&apos;utilisateur</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isArchived
              ? 'Cette action est irréversible. Le compte sera entièrement supprimé.'
              : "L'utilisateur sera archivé et ne pourra plus se connecter à LinkMe."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User info */}
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

          {/* Hard delete warning */}
          {isArchived && (
            <div className="bg-red-50 border border-red-200 p-3 rounded">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-800">
                    Suppression irréversible
                  </p>
                  <p className="text-red-700">
                    Le compte sera supprimé de la base de données. L&apos;email
                    sera libéré et pourra être réutilisé pour un nouveau compte.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Enseigne admin warning */}
          {isEnseigneAdmin && !isArchived && (
            <div className="bg-orange-50 border border-orange-200 p-3 rounded">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-800">Attention</p>
                  <p className="text-orange-700">
                    Vous archivez un administrateur d&apos;enseigne.
                    Assurez-vous qu&apos;il existe d&apos;autres administrateurs
                    pour cette enseigne.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded">
              <div className="flex items-center space-x-2 text-red-600">
                <X className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Confirmation text */}
          <div className="text-sm text-black opacity-70">
            {isArchived ? (
              <p>
                Confirmez-vous la <strong>suppression définitive</strong> de cet
                utilisateur ?
              </p>
            ) : (
              <>
                <p>Confirmez-vous l&apos;archivage de cet utilisateur ?</p>
                <p className="mt-1 font-medium">
                  Le compte sera désactivé et l&apos;utilisateur ne pourra plus
                  se connecter à LinkMe.
                </p>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <ButtonV2
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isPending}
          >
            Annuler
          </ButtonV2>
          <ButtonV2
            type="button"
            variant="destructive"
            icon={isArchived ? Trash2 : Archive}
            onClick={() => {
              void handleAction().catch(err => {
                console.error('[LinkMeDeleteUserDialog] Action failed:', err);
              });
            }}
            loading={isPending}
            disabled={isPending}
          >
            {isArchived ? 'Supprimer définitivement' : 'Archiver'}
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
