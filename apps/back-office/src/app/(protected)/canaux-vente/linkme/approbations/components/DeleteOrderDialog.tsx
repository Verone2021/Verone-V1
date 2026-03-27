'use client';

import { Loader2, Trash2 } from 'lucide-react';

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

import type { PendingOrder } from '../../hooks/use-linkme-order-actions';

interface DeleteOrderDialogProps {
  target: PendingOrder | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: (order: PendingOrder) => void;
}

export function DeleteOrderDialog({
  target,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteOrderDialogProps) {
  return (
    <AlertDialog
      open={target !== null}
      onOpenChange={open => {
        if (!open) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            Supprimer la commande
          </AlertDialogTitle>
          <AlertDialogDescription>
            Etes-vous sur de vouloir supprimer la commande{' '}
            <strong>
              {target?.linkme_display_number ?? target?.order_number}
            </strong>{' '}
            ? Cette action est irreversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700"
            disabled={isDeleting}
            onClick={e => {
              e.preventDefault();
              if (target) {
                onConfirm(target);
              }
            }}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
