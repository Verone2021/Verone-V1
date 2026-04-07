'use client';

import type { PurchaseOrder } from '@verone/orders';
import { CancelRemainderModal } from '@verone/orders';
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

import type { ShortageDetail, CancelRemainderItem } from '../types';

interface FournisseursAlertDialogsProps {
  // Validate
  showValidateConfirmation: boolean;
  setShowValidateConfirmation: (v: boolean) => void;
  onValidateConfirmed: () => void;

  // Devalidate
  showDevalidateConfirmation: boolean;
  setShowDevalidateConfirmation: (v: boolean) => void;
  onDevalidateConfirmed: () => void;

  // Delete
  showDeleteConfirmation: boolean;
  setShowDeleteConfirmation: (v: boolean) => void;
  onDeleteConfirmed: () => void;

  // Cancel
  showCancelConfirmation: boolean;
  setShowCancelConfirmation: (v: boolean) => void;
  onCancelConfirmed: () => void;

  // Shortage warning
  showShortageWarning: boolean;
  setShowShortageWarning: (v: boolean) => void;
  shortageDetails: ShortageDetail[];
  setShortageDetails: (v: ShortageDetail[]) => void;
  onAutoAdjustQuantities: () => void;
  onValidateAnyway: () => void;

  // Cancel remainder
  showCancelRemainderModal: boolean;
  cancelRemainderOrder: PurchaseOrder | null;
  cancelRemainderItems: CancelRemainderItem[];
  onCloseCancelRemainder: () => void;
  onSuccessCancelRemainder: () => void;
}

export function FournisseursAlertDialogs({
  showValidateConfirmation,
  setShowValidateConfirmation,
  onValidateConfirmed,
  showDevalidateConfirmation,
  setShowDevalidateConfirmation,
  onDevalidateConfirmed,
  showDeleteConfirmation,
  setShowDeleteConfirmation,
  onDeleteConfirmed,
  showCancelConfirmation,
  setShowCancelConfirmation,
  onCancelConfirmed,
  showShortageWarning,
  setShowShortageWarning,
  shortageDetails,
  setShortageDetails,
  onAutoAdjustQuantities,
  onValidateAnyway,
  showCancelRemainderModal,
  cancelRemainderOrder,
  cancelRemainderItems,
  onCloseCancelRemainder,
  onSuccessCancelRemainder,
}: FournisseursAlertDialogsProps) {
  return (
    <>
      {/* AlertDialog Confirmation Validation */}
      <AlertDialog
        open={showValidateConfirmation}
        onOpenChange={setShowValidateConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la validation</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de confirmer cette commande fournisseur.
              Une fois confirmée, la commande sera envoyée au fournisseur et
              pourra être réceptionnée.
              <br />
              <br />
              Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void Promise.resolve(onValidateConfirmed()).catch(error => {
                  console.error(
                    '[PurchaseOrders] Validate confirmed failed:',
                    error
                  );
                });
              }}
            >
              Confirmer la commande
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog Confirmation Devalidation */}
      <AlertDialog
        open={showDevalidateConfirmation}
        onOpenChange={setShowDevalidateConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la devalidation</AlertDialogTitle>
            <AlertDialogDescription>
              Vous etes sur le point de devalider cette commande fournisseur.
              Elle repassera en statut brouillon et ne pourra plus etre
              receptionnee tant qu&apos;elle ne sera pas revalidee.
              <br />
              <br />
              Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void Promise.resolve(onDevalidateConfirmed()).catch(error => {
                  console.error(
                    '[PurchaseOrders] Devalidate confirmed failed:',
                    error
                  );
                });
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Devalider la commande
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog Suppression PO */}
      <AlertDialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de supprimer cette commande fournisseur.
              Cette action est irréversible.
              <br />
              <br />
              Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void Promise.resolve(onDeleteConfirmed()).catch(error => {
                  console.error(
                    '[PurchaseOrders] Delete confirmed failed:',
                    error
                  );
                });
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer la commande
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog Annulation PO */}
      <AlertDialog
        open={showCancelConfirmation}
        onOpenChange={setShowCancelConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l&apos;annulation</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point d&apos;annuler cette commande fournisseur.
              Elle passera en statut annulé et ne pourra plus être modifiée.
              <br />
              <br />
              Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void Promise.resolve(onCancelConfirmed()).catch(error => {
                  console.error(
                    '[PurchaseOrders] Cancel confirmed failed:',
                    error
                  );
                });
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Annuler la commande
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog Avertissement Quantité Insuffisante */}
      <AlertDialog
        open={showShortageWarning}
        onOpenChange={setShowShortageWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quantité insuffisante</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Les produits suivants n&apos;atteignent pas leur seuil minimum
                  :
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  {shortageDetails.map((item, idx) => (
                    <li key={idx}>
                      <strong>{item.productName}</strong> ({item.sku})
                      <br />
                      <span className="text-sm text-gray-600">
                        Stock réel : {item.stockReal} | Seuil : {item.minStock}
                      </span>
                      <br />
                      <span>
                        Quantité commandée : {item.quantityOrdered} →{' '}
                        <span className="text-green-600 font-medium">
                          {item.newQuantity}
                        </span>
                        <span className="text-red-600">
                          {' '}
                          (+{item.shortage})
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-gray-600 mt-2">
                  Cliquez sur &quot;Ajuster automatiquement&quot; pour mettre à
                  jour les quantités.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowShortageWarning(false);
                setShortageDetails([]);
              }}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void Promise.resolve(onAutoAdjustQuantities()).catch(error => {
                  console.error('[PurchaseOrders] Auto adjust failed:', error);
                });
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Ajuster automatiquement
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                setShowShortageWarning(false);
                setShortageDetails([]);
                onValidateAnyway();
              }}
            >
              Valider quand même
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Annulation Reliquat */}
      {cancelRemainderOrder && (
        <CancelRemainderModal
          open={showCancelRemainderModal}
          onClose={onCloseCancelRemainder}
          purchaseOrderId={cancelRemainderOrder.id}
          poNumber={cancelRemainderOrder.po_number}
          remainderItems={cancelRemainderItems}
          onSuccess={onSuccessCancelRemainder}
        />
      )}
    </>
  );
}
