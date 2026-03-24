'use client';

import { RapprochementContent } from '@verone/finance/components';
import type { ExistingLink } from '@verone/finance/components';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { Banknote, History, Link2, Link2Off, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';

import type {
  SalesOrder,
  ManualPaymentType,
  OrderPayment,
} from '@verone/orders/hooks';

const paymentTypeLabels: Record<string, string> = {
  cash: 'Esp\u00e8ces',
  check: 'Ch\u00e8que',
  transfer_other: 'Virement bancaire',
  card: 'Carte bancaire',
  compensation: 'Compensation',
};

export interface OrderPaymentDialogProps {
  open: boolean;
  onClose: (open: boolean) => void;
  order: SalesOrder;
  orderPayments: OrderPayment[];
  existingLinks: ExistingLink[];
  rapprochementOrder: {
    id: string;
    order_number: string;
    customer_name: string;
    customer_name_alt: string | null;
    total_ttc: number;
    paid_amount: number;
    created_at: string;
    order_date: string | null;
    shipped_at: string | null;
    payment_status_v2: string | null | undefined;
  } | null;
  deletingPaymentId: string | null;
  onRefreshPayments: () => void;
  onDeletePayment: (paymentId: string) => void;
  onLinksChanged: (links: ExistingLink[]) => void;
  /** Manual payment form state & handlers */
  manualPaymentType: ManualPaymentType;
  manualPaymentAmount: string;
  manualPaymentDate: string;
  manualPaymentRef: string;
  manualPaymentNote: string;
  onSetManualPaymentType: (v: ManualPaymentType) => void;
  onSetManualPaymentAmount: (v: string) => void;
  onSetManualPaymentDate: (v: string) => void;
  onSetManualPaymentRef: (v: string) => void;
  onSetManualPaymentNote: (v: string) => void;
  /** Submit handler */
  onSubmitManualPayment: () => void;
  paymentSubmitting: boolean;
}

export function OrderPaymentDialog({
  open,
  onClose,
  order,
  orderPayments,
  existingLinks,
  rapprochementOrder,
  deletingPaymentId,
  onRefreshPayments,
  onDeletePayment,
  onLinksChanged,
  manualPaymentType,
  manualPaymentAmount,
  manualPaymentDate,
  manualPaymentRef,
  manualPaymentNote,
  onSetManualPaymentType,
  onSetManualPaymentAmount,
  onSetManualPaymentDate,
  onSetManualPaymentRef,
  onSetManualPaymentNote,
  onSubmitManualPayment,
  paymentSubmitting,
}: OrderPaymentDialogProps) {
  // Unified totals for the payment summary
  const manualTotal = orderPayments.reduce((sum, p) => sum + p.amount, 0);
  const linksTotal = existingLinks.reduce(
    (sum, l) => sum + l.allocated_amount,
    0
  );
  const totalPaid = manualTotal + linksTotal;
  const orderTotalTtc = Math.abs(order.total_ttc || 0);
  const unifiedRemaining = Math.max(0, orderTotalTtc - totalPaid);
  const isFullyPaid = totalPaid >= orderTotalTtc && orderTotalTtc > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement</DialogTitle>
          <p className="text-sm text-gray-500">Commande {order.order_number}</p>
        </DialogHeader>

        {/* === Unified payment summary (always visible) === */}
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
              {/* Manual payments */}
              {orderPayments.map(payment => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-2 bg-white rounded border text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                      <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
                        Manuel
                      </Badge>
                      <span className="font-medium truncate">
                        {paymentTypeLabels[payment.payment_type] ||
                          payment.payment_type}
                      </span>
                      <span className="font-bold text-green-700">
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
              {/* Bank reconciliation links */}
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
                        {formatCurrency(link.allocated_amount)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 ml-5.5 flex gap-2">
                      <span>
                        {new Date(link.transaction_date).toLocaleDateString(
                          'fr-FR'
                        )}
                      </span>
                      {link.bank_provider && <span>{link.bank_provider}</span>}
                    </div>
                  </div>
                  <span
                    className="ml-2 p-1 text-slate-300"
                    title="D\u00e9lier depuis l'onglet Rapprochement"
                  >
                    <Link2Off className="h-3.5 w-3.5" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === Tabs (below the summary) === */}
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
              orderType={(order.total_ttc ?? 0) < 0 ? 'avoir' : 'sales_order'}
              onSuccess={() => {
                onRefreshPayments();
              }}
              onLinksChanged={onLinksChanged}
            />
          </TabsContent>

          <TabsContent value="manual" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-type">Type de paiement</Label>
              <Select
                value={manualPaymentType}
                onValueChange={v =>
                  onSetManualPaymentType(v as ManualPaymentType)
                }
              >
                <SelectTrigger id="payment-type">
                  <SelectValue placeholder="S\u00e9lectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer_other">
                    Virement bancaire
                  </SelectItem>
                  <SelectItem value="cash">Esp\u00e8ces</SelectItem>
                  <SelectItem value="check">Ch\u00e8que</SelectItem>
                  <SelectItem value="card">Carte bancaire</SelectItem>
                  <SelectItem value="compensation">Compensation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-amount">
                Montant (EUR)
                {unifiedRemaining > 0 && (
                  <span className="text-muted-foreground font-normal ml-1">
                    \u2014 Reste a payer : {unifiedRemaining.toFixed(2)} EUR
                  </span>
                )}
              </Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={unifiedRemaining}
                value={manualPaymentAmount}
                onChange={e => onSetManualPaymentAmount(e.target.value)}
              />
              {parseFloat(manualPaymentAmount) > unifiedRemaining + 0.01 && (
                <p className="text-sm text-destructive">
                  Le montant d\u00e9passe le reste \u00e0 payer (
                  {unifiedRemaining.toFixed(2)} EUR)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-date">Date du paiement</Label>
              <Input
                id="payment-date"
                type="date"
                value={manualPaymentDate}
                onChange={e => onSetManualPaymentDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-ref">
                Reference{' '}
                <span className="text-gray-400 font-normal">(optionnel)</span>
              </Label>
              <Input
                id="payment-ref"
                placeholder="N\u00b0 ch\u00e8que, r\u00e9f. virement..."
                value={manualPaymentRef}
                onChange={e => onSetManualPaymentRef(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-note">
                Note{' '}
                <span className="text-gray-400 font-normal">(optionnel)</span>
              </Label>
              <Input
                id="payment-note"
                placeholder="Commentaire..."
                value={manualPaymentNote}
                onChange={e => onSetManualPaymentNote(e.target.value)}
              />
            </div>

            <ButtonV2
              onClick={onSubmitManualPayment}
              disabled={
                paymentSubmitting ||
                !manualPaymentAmount ||
                parseFloat(manualPaymentAmount) <= 0 ||
                parseFloat(manualPaymentAmount) > unifiedRemaining + 0.01 ||
                unifiedRemaining <= 0
              }
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {paymentSubmitting
                ? 'Enregistrement...'
                : 'Enregistrer le paiement'}
            </ButtonV2>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
