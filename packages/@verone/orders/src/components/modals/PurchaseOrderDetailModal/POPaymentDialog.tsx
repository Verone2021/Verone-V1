'use client';

import type { ExistingLink } from '@verone/finance/components';
import { RapprochementContent } from '@verone/finance/components';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import { Badge } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { History, Banknote, Link2, Link2Off, Trash2 } from 'lucide-react';

import type {
  PurchaseOrder,
  ManualPaymentType,
  OrderPayment,
} from '@verone/orders/hooks';

import type { RapprochementOrderShape } from './types';
import { paymentTypeLabels } from './types';
import { POManualPaymentForm } from './POManualPaymentForm';

interface POPaymentDialogProps {
  order: PurchaseOrder;
  open: boolean;
  onOpenChange: (v: boolean) => void;

  // Summary data
  orderTotalTtc: number;
  totalPaid: number;
  unifiedRemaining: number;
  isFullyPaid: boolean;

  // Payment history
  orderPayments: OrderPayment[];
  existingLinks: ExistingLink[];
  deletingPaymentId: string | null;
  onDeletePayment: (paymentId: string) => void;

  // Rapprochement
  rapprochementOrder: RapprochementOrderShape | null;
  onLinksChanged: (links: ExistingLink[]) => void;
  onRapprochementSuccess: () => void;

  // Manual payment form
  manualPaymentType: ManualPaymentType;
  setManualPaymentType: (v: ManualPaymentType) => void;
  manualPaymentAmount: string;
  setManualPaymentAmount: (v: string) => void;
  manualPaymentDate: string;
  setManualPaymentDate: (v: string) => void;
  manualPaymentRef: string;
  setManualPaymentRef: (v: string) => void;
  manualPaymentNote: string;
  setManualPaymentNote: (v: string) => void;
  paymentSubmitting: boolean;
  onSubmitManualPayment: () => void;

  // Delete confirmation
  showDeletePaymentConfirmation: boolean;
  setShowDeletePaymentConfirmation: (v: boolean) => void;
  onDeletePaymentConfirmed: () => void;
}

export function POPaymentDialog({
  order,
  open,
  onOpenChange,
  orderTotalTtc,
  totalPaid,
  unifiedRemaining,
  isFullyPaid,
  orderPayments,
  existingLinks,
  deletingPaymentId,
  onDeletePayment,
  rapprochementOrder,
  onLinksChanged,
  onRapprochementSuccess,
  manualPaymentType,
  setManualPaymentType,
  manualPaymentAmount,
  setManualPaymentAmount,
  manualPaymentDate,
  setManualPaymentDate,
  manualPaymentRef,
  setManualPaymentRef,
  manualPaymentNote,
  setManualPaymentNote,
  paymentSubmitting,
  onSubmitManualPayment,
  showDeletePaymentConfirmation,
  setShowDeletePaymentConfirmation,
  onDeletePaymentConfirmed,
}: POPaymentDialogProps) {
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
            <p className="text-sm text-gray-500">Commande {order.po_number}</p>
          </DialogHeader>

          {/* === Unified payment summary === */}
          <div className="p-3 bg-slate-100 rounded-lg">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-slate-500">Montant total</p>
                <p className="text-sm font-bold text-slate-900">
                  {formatCurrency(orderTotalTtc)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Deja paye</p>
                <p className="text-sm font-bold text-green-600">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Reste a payer</p>
                <p
                  className={`text-sm font-bold ${isFullyPaid ? 'text-green-600' : 'text-orange-600'}`}
                >
                  {formatCurrency(unifiedRemaining)}
                </p>
              </div>
            </div>
          </div>

          {/* === Payment history (manual + bank links) === */}
          {(orderPayments.length > 0 || existingLinks.length > 0) && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <History className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Historique des paiements (
                  {orderPayments.length + existingLinks.length})
                </span>
              </div>
              <div className="space-y-1.5">
                {orderPayments.map(payment => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-2 bg-white rounded border text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                        <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200">
                          Manuel
                        </Badge>
                        <span className="font-medium truncate">
                          {paymentTypeLabels[payment.payment_type] ||
                            payment.payment_type}
                        </span>
                        <span className="font-bold text-blue-700">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 ml-5.5 flex gap-2">
                        <span>
                          {new Date(payment.payment_date).toLocaleDateString(
                            'fr-FR'
                          )}
                        </span>
                        {payment.reference && (
                          <span className="truncate">
                            Ref: {payment.reference}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeletePayment(payment.id)}
                      disabled={deletingPaymentId === payment.id}
                      className="ml-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                      title="Supprimer ce paiement"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {existingLinks.map(link => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-2 bg-white rounded border text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                        <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200">
                          Auto
                        </Badge>
                        <span className="font-medium truncate">
                          {link.counterparty_name ?? link.transaction_label}
                        </span>
                        <span className="font-bold text-blue-700">
                          {formatCurrency(Math.abs(link.allocated_amount))}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 ml-5.5 flex gap-2">
                        <span>
                          {new Date(link.transaction_date).toLocaleDateString(
                            'fr-FR'
                          )}
                        </span>
                        {link.bank_provider && (
                          <span>{link.bank_provider}</span>
                        )}
                      </div>
                    </div>
                    <span
                      className="ml-2 p-1 text-slate-300"
                      title="Délier depuis l'onglet Rapprochement"
                    >
                      <Link2Off className="h-3.5 w-3.5" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === Tabs === */}
          <Tabs defaultValue="manual" className="mt-1">
            <TabsList className="w-full">
              <TabsTrigger value="rapprochement" className="flex-1">
                Rapprochement bancaire
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex-1">
                Paiement manuel
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rapprochement" className="mt-4">
              <RapprochementContent
                order={rapprochementOrder}
                orderType="purchase_order"
                onSuccess={onRapprochementSuccess}
                onLinksChanged={onLinksChanged}
              />
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              <POManualPaymentForm
                unifiedRemaining={unifiedRemaining}
                manualPaymentType={manualPaymentType}
                setManualPaymentType={setManualPaymentType}
                manualPaymentAmount={manualPaymentAmount}
                setManualPaymentAmount={setManualPaymentAmount}
                manualPaymentDate={manualPaymentDate}
                setManualPaymentDate={setManualPaymentDate}
                manualPaymentRef={manualPaymentRef}
                setManualPaymentRef={setManualPaymentRef}
                manualPaymentNote={manualPaymentNote}
                setManualPaymentNote={setManualPaymentNote}
                paymentSubmitting={paymentSubmitting}
                onSubmit={onSubmitManualPayment}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showDeletePaymentConfirmation}
        onOpenChange={setShowDeletePaymentConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce paiement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous etes sur le point de supprimer ce paiement manuel. Le statut
              de paiement de la commande sera recalcule automatiquement.
              <br />
              <br />
              Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeletePaymentConfirmed}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer le paiement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
