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

import type { Quote } from './quote-types';

export interface QuoteDialogsProps {
  quote: Quote;
  showFinalizeWarning: boolean;
  showDeleteWarning: boolean;
  showConvertWarning: boolean;
  onFinalizeOpenChange: (v: boolean) => void;
  onDeleteOpenChange: (v: boolean) => void;
  onConvertOpenChange: (v: boolean) => void;
  onFinalizeConfirm: () => void;
  onDeleteConfirm: () => void;
  onConvertConfirm: () => void;
}

export function QuoteDialogs({
  quote,
  showFinalizeWarning,
  showDeleteWarning,
  showConvertWarning,
  onFinalizeOpenChange,
  onDeleteOpenChange,
  onConvertOpenChange,
  onFinalizeConfirm,
  onDeleteConfirm,
  onConvertConfirm,
}: QuoteDialogsProps): React.ReactNode {
  return (
    <>
      <AlertDialog
        open={showFinalizeWarning}
        onOpenChange={onFinalizeOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Envoyer le devis au client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le devis sera envoyé par email à{' '}
              {quote.client?.email ?? "l'adresse du client"}. Une fois envoyé,
              le PDF sera disponible au téléchargement et vous pourrez le
              convertir en facture.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={onFinalizeConfirm}>
              Envoyer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteWarning} onOpenChange={onDeleteOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le devis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement ce devis brouillon.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={onDeleteConfirm}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showConvertWarning} onOpenChange={onConvertOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convertir en facture ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action créera une facture en brouillon basée sur ce devis.
              Vous devrez ensuite finaliser la facture manuellement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={onConvertConfirm}>
              Convertir en facture
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
