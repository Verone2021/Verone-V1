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

export interface CancelGuardDoc {
  id: string;
  documentType: 'customer_quote' | 'customer_invoice';
  documentNumber: string | null;
  qontoStatus: string;
}

export interface DeleteDependency {
  id: string;
  documentType: 'customer_quote' | 'customer_invoice';
  documentNumber: string | null;
  status: string | null;
  softDeleted: boolean;
}

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
  deleteDependencies: DeleteDependency[];
  loadingDeleteDependencies: boolean;

  /** Cancel confirmation */
  showCancelConfirmation: boolean;
  onCancelConfirmationChange: (open: boolean) => void;
  onCancelConfirmed: () => void;

  /** Cancel guard (documents Qonto bloquants) */
  showCancelGuardDialog: boolean;
  onCancelGuardChange: (open: boolean) => void;
  onCancelGuardConfirmed: () => void;
  guardReason: string;
  docsToDelete: CancelGuardDoc[];
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
  deleteDependencies,
  loadingDeleteDependencies,
  showCancelConfirmation,
  onCancelConfirmationChange,
  onCancelConfirmed,
  showCancelGuardDialog,
  onCancelGuardChange,
  onCancelGuardConfirmed,
  guardReason,
  docsToDelete,
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
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Vous êtes sur le point de supprimer cette commande client.
                  Cette action est irréversible.
                </p>

                {loadingDeleteDependencies && (
                  <p className="text-xs italic text-muted-foreground">
                    Chargement des documents liés…
                  </p>
                )}

                {!loadingDeleteDependencies &&
                  deleteDependencies.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Aucun devis ni facture lié à cette commande.
                    </p>
                  )}

                {!loadingDeleteDependencies &&
                  deleteDependencies.length > 0 && (
                    <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-sm">
                      <p className="mb-2 font-medium text-orange-900">
                        Documents liés qui seront impactés :
                      </p>
                      <ul className="space-y-1">
                        {deleteDependencies.map(dep => (
                          <li
                            key={dep.id}
                            className="flex items-start gap-2 text-orange-800"
                          >
                            <span className="mt-0.5">•</span>
                            <span className="flex-1">
                              <span className="font-mono">
                                {dep.documentNumber ?? '(sans numéro)'}
                              </span>
                              {' — '}
                              {dep.documentType === 'customer_quote'
                                ? 'Devis'
                                : 'Facture'}
                              {dep.status ? ` (${dep.status})` : ''}
                              {dep.softDeleted
                                ? ' — déjà annulé, lien sera détaché'
                                : ' — lien sera détaché'}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-orange-700">
                        Note : les documents eux-mêmes restent conservés pour
                        l'historique comptable. Seul le lien avec la commande
                        est retiré.
                      </p>
                    </div>
                  )}

                <p>Voulez-vous continuer ?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDeleteConfirmed();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={loadingDeleteDependencies}
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

      {/* AlertDialog Garde-fou — documents Qonto bloquants */}
      <AlertDialog
        open={showCancelGuardDialog}
        onOpenChange={onCancelGuardChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Attention — action critique
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>{guardReason}</p>
                {docsToDelete.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm">
                    {docsToDelete.map(doc => (
                      <li key={doc.id} className="flex items-start gap-1">
                        <span className="mt-0.5 text-red-500">•</span>
                        <span>
                          {doc.documentType === 'customer_quote'
                            ? 'Devis'
                            : 'Proforma'}{' '}
                          <strong>{doc.documentNumber ?? doc.id}</strong> (
                          {doc.qontoStatus}) sera supprimé(e)
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onCancelGuardConfirmed();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Annuler quand même
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
