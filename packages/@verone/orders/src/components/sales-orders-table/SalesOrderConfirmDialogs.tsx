'use client';

import React from 'react';

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

export interface SalesOrderConfirmDialogsProps {
  /** Validate confirmation */
  showValidateConfirmation: boolean;
  onValidateConfirmationChange: (open: boolean) => void;
  onValidateConfirmed: () => void;

  /** Devalidate confirmation */
  showDevalidateConfirmation: boolean;
  onDevalidateConfirmationChange: (open: boolean) => void;
  onDevalidateConfirmed: () => void;

  /** Delete confirmation */
  showDeleteConfirmation: boolean;
  onDeleteConfirmationChange: (open: boolean) => void;
  onDeleteConfirmed: () => void;

  /** Cancel confirmation */
  showCancelConfirmation: boolean;
  onCancelConfirmationChange: (open: boolean) => void;
  onCancelConfirmed: () => void;
}

export function SalesOrderConfirmDialogs({
  showValidateConfirmation,
  onValidateConfirmationChange,
  onValidateConfirmed,
  showDevalidateConfirmation,
  onDevalidateConfirmationChange,
  onDevalidateConfirmed,
  showDeleteConfirmation,
  onDeleteConfirmationChange,
  onDeleteConfirmed,
  showCancelConfirmation,
  onCancelConfirmationChange,
  onCancelConfirmed,
}: SalesOrderConfirmDialogsProps) {
  return (
    <>
      {/* AlertDialog Confirmation Validation */}
      <AlertDialog
        open={showValidateConfirmation}
        onOpenChange={onValidateConfirmationChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la validation</AlertDialogTitle>
            <AlertDialogDescription>
              Vous etes sur le point de valider cette commande client. Une fois
              validee, la commande pourra etre expediee et les alertes de stock
              seront generees automatiquement si necessaire.
              <br />
              <br />
              Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onValidateConfirmed();
              }}
            >
              Valider la commande
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog Confirmation Devalidation */}
      <AlertDialog
        open={showDevalidateConfirmation}
        onOpenChange={onDevalidateConfirmationChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la devalidation</AlertDialogTitle>
            <AlertDialogDescription>
              Vous etes sur le point de devalider cette commande client. Elle
              repassera en statut brouillon et ne pourra plus etre expediee tant
              qu&apos;elle ne sera pas revalidee.
              <br />
              <br />
              Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDevalidateConfirmed();
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Devalider la commande
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog Confirmation Suppression */}
      <AlertDialog
        open={showDeleteConfirmation}
        onOpenChange={onDeleteConfirmationChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Vous etes sur le point de supprimer cette commande client. Cette
              action est irreversible.
              <br />
              <br />
              Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDeleteConfirmed();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer la commande
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog Confirmation Annulation */}
      <AlertDialog
        open={showCancelConfirmation}
        onOpenChange={onCancelConfirmationChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l&apos;annulation</AlertDialogTitle>
            <AlertDialogDescription>
              Vous etes sur le point d&apos;annuler cette commande client. Elle
              passera en statut annule et ne pourra plus etre modifiee.
              <br />
              <br />
              Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onCancelConfirmed();
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Annuler la commande
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
