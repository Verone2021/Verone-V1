'use client';

import { type Enseigne } from '@verone/organisations';
import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { colors } from '@verone/ui/design-system';
import { AlertTriangle } from 'lucide-react';

interface EnseigneDeleteModalProps {
  enseigne: Enseigne | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function EnseigneDeleteModal({
  enseigne,
  isSubmitting,
  onClose,
  onConfirm,
}: EnseigneDeleteModalProps) {
  return (
    <Dialog open={!!enseigne} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Supprimer l'enseigne
          </DialogTitle>
          <DialogDescription className="pt-2">
            Êtes-vous sûr de vouloir supprimer l'enseigne "
            <strong>{enseigne?.name}</strong>" ?
          </DialogDescription>
        </DialogHeader>

        {/* Avertissement si des organisations sont liées */}
        {enseigne && enseigne.member_count > 0 && (
          <div
            className="p-4 rounded-lg flex items-start gap-3"
            style={{
              backgroundColor: colors.warning[50],
              borderColor: colors.warning[200],
            }}
          >
            <AlertTriangle
              className="h-5 w-5 flex-shrink-0 mt-0.5"
              style={{ color: colors.warning[600] }}
            />
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: colors.warning[800] }}
              >
                {enseigne.member_count} organisation(s) liée(s)
              </p>
              <p
                className="text-sm mt-1"
                style={{ color: colors.warning[700] }}
              >
                Les organisations seront automatiquement dissociées de cette
                enseigne mais ne seront pas supprimées.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          <ButtonV2 variant="ghost" onClick={onClose}>
            Annuler
          </ButtonV2>
          <ButtonV2
            variant="destructive"
            onClick={() => {
              void Promise.resolve(onConfirm()).catch(error => {
                console.error('[Enseignes] Delete failed:', error);
              });
            }}
            loading={isSubmitting}
          >
            Supprimer définitivement
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
