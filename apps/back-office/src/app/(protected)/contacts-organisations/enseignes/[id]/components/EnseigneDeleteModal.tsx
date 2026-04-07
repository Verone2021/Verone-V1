'use client';

import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Loader2 } from 'lucide-react';

interface EnseigneDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enseigneName: string;
  isSubmitting: boolean;
  handleDelete: () => void;
}

export function EnseigneDeleteModal({
  open,
  onOpenChange,
  enseigneName,
  isSubmitting,
  handleDelete,
}: EnseigneDeleteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Supprimer l'enseigne</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer l'enseigne &quot;{enseigneName}
            &quot; ? Les organisations membres seront dissociées mais pas
            supprimées.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <ButtonV2 variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </ButtonV2>
          <ButtonV2
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Suppression...
              </>
            ) : (
              'Supprimer'
            )}
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
