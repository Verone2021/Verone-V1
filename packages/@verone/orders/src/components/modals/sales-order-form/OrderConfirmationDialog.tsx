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
import { formatCurrency } from '@verone/utils';

interface OrderConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading: boolean;
  mode: 'create' | 'edit';
  customerName?: string;
  itemCount: number;
  totalTTC: number;
  stockWarnings: string[];
}

export function OrderConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  loading,
  mode,
  customerName,
  itemCount,
  totalTTC,
  stockWarnings,
}: OrderConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {mode === 'edit'
              ? 'Confirmer la mise à jour'
              : 'Confirmer la création de la commande'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground">
              {mode === 'edit' ? (
                <span>
                  Vous êtes sur le point de mettre à jour la commande avec{' '}
                  {itemCount} article(s).
                </span>
              ) : (
                <span>
                  Vous êtes sur le point de créer une commande client pour{' '}
                  <span className="font-semibold">{customerName}</span> avec{' '}
                  {itemCount} article(s) pour un montant total de{' '}
                  <span className="font-semibold">
                    {formatCurrency(totalTTC)}
                  </span>
                  .
                </span>
              )}
              {stockWarnings.length > 0 && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
                  <p className="text-sm font-medium text-amber-800">
                    Attention : Stock insuffisant
                  </p>
                  <ul className="mt-1 text-xs text-amber-700 space-y-1">
                    {stockWarnings.slice(0, 3).map((warning, i) => (
                      <li key={i}>&#8226; {warning}</li>
                    ))}
                    {stockWarnings.length > 3 && (
                      <li>... et {stockWarnings.length - 3} autres</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
            }}
            disabled={loading}
          >
            {loading
              ? mode === 'edit'
                ? 'Mise à jour...'
                : 'Création...'
              : mode === 'edit'
                ? 'Mettre à jour'
                : 'Créer la commande'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
