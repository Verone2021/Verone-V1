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

interface IQuoteFinalizeWarningProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function QuoteFinalizeWarning({
  open,
  onOpenChange,
  onConfirm,
}: IQuoteFinalizeWarningProps): React.ReactNode {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Finaliser le devis ?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Une fois finalisé, le devis ne pourra plus être modifié. Il
              recevra un numéro officiel et pourra être envoyé au client.
            </p>
            <p className="text-sm text-muted-foreground">
              Vous pourrez ensuite le convertir en facture si le client accepte.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Finaliser le devis
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
