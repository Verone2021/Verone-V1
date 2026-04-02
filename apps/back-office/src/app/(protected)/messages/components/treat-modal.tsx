'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@verone/ui';

interface TreatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
}

export function TreatModal({
  open,
  onOpenChange,
  onConfirm,
  title,
}: TreatModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Marquer comme traite ?</AlertDialogTitle>
          <AlertDialogDescription>
            {title
              ? `"${title}" sera supprime de la liste des notifications a traiter.`
              : 'Cette notification sera supprimee de la liste des notifications a traiter.'}{' '}
            Vous pourrez la retrouver dans l&apos;historique.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirmer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
