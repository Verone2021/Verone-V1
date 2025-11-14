'use client';

import * as React from 'react';

import { AlertTriangle, Info } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';

export interface ConfirmDialogProps {
  /**
   * État ouvert/fermé du dialog
   */
  open: boolean;

  /**
   * Callback pour changer l'état ouvert/fermé
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Titre du dialog de confirmation
   */
  title: string;

  /**
   * Description/message de confirmation
   */
  description: string;

  /**
   * Texte du bouton de confirmation
   * @default "Confirmer"
   */
  confirmText?: string;

  /**
   * Texte du bouton d'annulation
   * @default "Annuler"
   */
  cancelText?: string;

  /**
   * Variant visuel
   * - default: style information (bleu)
   * - destructive: style danger (rouge) pour actions destructives
   * @default "default"
   */
  variant?: 'default' | 'destructive';

  /**
   * Callback appelé lors de la confirmation
   * Peut être synchrone ou async
   */
  onConfirm: () => void | Promise<void>;

  /**
   * Callback optionnel appelé lors de l'annulation
   */
  onCancel?: () => void;

  /**
   * État de chargement (désactive les boutons et affiche un loader)
   */
  loading?: boolean;
}

/**
 * ConfirmDialog
 *
 * Composant de dialogue de confirmation réutilisable
 * basé sur AlertDialog de Radix UI
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <ConfirmDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Supprimer le produit ?"
 *   description="Cette action est irréversible. Le produit sera définitivement supprimé."
 *   variant="destructive"
 *   confirmText="Supprimer"
 *   onConfirm={async () => {
 *     await deleteProduct();
 *     setOpen(false);
 *   }}
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'default',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  const [isConfirming, setIsConfirming] = React.useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      // Fermer le dialog après confirmation réussie
      onOpenChange(false);
    } catch (error) {
      // En cas d'erreur, laisser le dialog ouvert pour que l'utilisateur puisse réessayer
      console.error('Confirm action failed:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  const isLoading = loading || isConfirming;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            {variant === 'destructive' ? (
              <div className="flex-shrink-0 mt-0.5 p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            ) : (
              <div className="flex-shrink-0 mt-0.5 p-2 bg-blue-100 rounded-full">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
            )}
            <div className="flex-1">
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-2">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={
              variant === 'destructive'
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-600'
                : ''
            }
          >
            {isLoading && (
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
