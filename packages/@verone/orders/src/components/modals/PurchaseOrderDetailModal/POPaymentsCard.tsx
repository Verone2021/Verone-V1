'use client';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { Link2, Banknote, Loader2 } from 'lucide-react';

import type { OrderPayment } from '@verone/orders/hooks';

import type { LinkedTransaction } from './types';
import { paymentTypeLabels } from './types';

interface POPaymentsCardProps {
  orderPayments: OrderPayment[];
  linkedTransactions: LinkedTransaction[];
  isLoadingFinance: boolean;
  canMarkAsPaid: boolean;
  onOpenPaymentDialog: () => void;
}

export function POPaymentsCard({
  orderPayments,
  linkedTransactions,
  isLoadingFinance,
  canMarkAsPaid,
  onOpenPaymentDialog,
}: POPaymentsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Link2 className="h-3 w-3" />
          Paiements & Rapprochement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoadingFinance ? (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          </div>
        ) : orderPayments.length > 0 || linkedTransactions.length > 0 ? (
          <>
            {/* Manual payments */}
            {orderPayments.map(payment => (
              <div
                key={payment.id}
                className="bg-blue-50 p-2 rounded border border-blue-200 text-xs space-y-1"
              >
                <div className="flex items-center gap-1">
                  <Banknote className="h-3 w-3 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    Paiement manuel
                  </span>
                  <Badge className="text-[9px] px-1 py-0 bg-blue-100 text-blue-700 border-blue-200">
                    {paymentTypeLabels[payment.payment_type] ||
                      payment.payment_type}
                  </Badge>
                </div>
                {payment.reference && (
                  <p className="text-gray-700 truncate">
                    Ref: {payment.reference}
                  </p>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    {new Date(payment.payment_date).toLocaleDateString('fr-FR')}
                  </span>
                  <span className="font-semibold text-blue-700">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
              </div>
            ))}
            {/* Bank reconciliation links */}
            {linkedTransactions.map(link => (
              <div
                key={link.id}
                className="bg-blue-50 p-2 rounded border border-blue-200 text-xs space-y-1"
              >
                <div className="flex items-center gap-1">
                  <Link2 className="h-3 w-3 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    Transaction liée
                  </span>
                </div>
                <p className="text-gray-700 truncate">
                  {link.bank_transactions?.label ?? 'Transaction'}
                </p>
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    {link.bank_transactions?.settled_at
                      ? new Date(
                          link.bank_transactions.settled_at
                        ).toLocaleDateString('fr-FR')
                      : link.bank_transactions?.emitted_at
                        ? new Date(
                            link.bank_transactions.emitted_at
                          ).toLocaleDateString('fr-FR')
                        : ''}
                  </span>
                  <span className="font-semibold text-blue-700">
                    {formatCurrency(Math.abs(link.allocated_amount))}
                  </span>
                </div>
              </div>
            ))}
          </>
        ) : (
          <p className="text-center text-xs text-gray-500 py-2">
            Aucun paiement enregistré
          </p>
        )}

        {/* Bouton unique — ouvre Dialog paiement (rapprochement + manuel) */}
        {canMarkAsPaid && (
          <ButtonV2
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={onOpenPaymentDialog}
          >
            <Link2 className="h-3 w-3 mr-1" />
            Paiement / Rapprochement
          </ButtonV2>
        )}
      </CardContent>
    </Card>
  );
}
