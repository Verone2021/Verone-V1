'use client';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { CreditCard, Banknote, Link2, ExternalLink } from 'lucide-react';

import type { SalesOrder } from '@verone/orders/hooks';

export interface OrderPaymentSummaryCardProps {
  order: SalesOrder;
  readOnly: boolean;
  canMarkAsPaid: boolean;
  onOpenPaymentDialog: () => void;
}

/** Format a date string to French locale */
function formatDate(date: string | null): string {
  if (!date) return 'Non d\u00e9finie';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function OrderPaymentSummaryCard({
  order,
  readOnly,
  canMarkAsPaid,
  onOpenPaymentDialog,
}: OrderPaymentSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CreditCard className="h-3 w-3" />
          Paiement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {order.payment_status_v2 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Statut :</span>
            <Badge
              className={`text-xs ${
                order.payment_status_v2 === 'overpaid'
                  ? 'bg-red-100 text-red-800'
                  : order.payment_status_v2 === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : order.payment_status_v2 === 'partially_paid'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-orange-100 text-orange-800'
              }`}
            >
              {order.payment_status_v2 === 'overpaid'
                ? 'Surpay\u00e9'
                : order.payment_status_v2 === 'paid'
                  ? 'Pay\u00e9'
                  : order.payment_status_v2 === 'partially_paid'
                    ? 'Partiellement pay\u00e9'
                    : 'En attente'}
            </Badge>
          </div>
        )}

        {order.payment_terms && (
          <div className="bg-green-50 p-2 rounded border border-green-200">
            <p className="text-xs font-medium text-green-800">
              {order.payment_terms}
            </p>
          </div>
        )}

        {order.paid_amount !== undefined && order.paid_amount > 0 && (
          <div className="bg-green-50 p-2 rounded border border-green-200">
            <p className="text-xs text-gray-600">Montant pay\u00e9</p>
            <p className="text-sm font-bold text-green-700">
              {formatCurrency(order.paid_amount)} /{' '}
              {formatCurrency(order.total_ttc || 0)}
            </p>
            {order.paid_at && (
              <p className="text-xs text-gray-600 mt-1">
                Le {formatDate(order.paid_at)}
              </p>
            )}
          </div>
        )}

        {!readOnly && canMarkAsPaid && (
          <ButtonV2
            onClick={onOpenPaymentDialog}
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Banknote className="h-3 w-3 mr-1" />
            Enregistrer un paiement
          </ButtonV2>
        )}
      </CardContent>
    </Card>
  );
}

export interface OrderReconciliationCardProps {
  order: SalesOrder;
}

export function OrderReconciliationCard({
  order,
}: OrderReconciliationCardProps) {
  const formatDateShort = (date: string | null): string => {
    if (!date) return 'Non d\u00e9finie';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Link2 className="h-3 w-3" />
          Rapprochement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {order.is_matched ? (
          <div className="bg-green-50 p-3 rounded border border-green-200 space-y-2">
            <div className="flex items-center gap-2">
              <Link2 className="h-3 w-3 text-green-600" />
              <p className="text-sm font-medium text-green-800">
                Transaction li\u00e9e
              </p>
            </div>
            <p className="text-xs text-gray-700">
              {order.matched_transaction_label ?? 'Transaction'}
            </p>
            <p className="text-sm font-bold text-green-700">
              {formatCurrency(Math.abs(order.matched_transaction_amount ?? 0))}
            </p>
            {order.matched_transaction_emitted_at && (
              <p className="text-xs text-gray-600">
                Pay\u00e9 le{' '}
                {formatDateShort(order.matched_transaction_emitted_at)}
              </p>
            )}
            {order.matched_transaction_attachment_ids?.[0] && (
              <a
                href={`https://app.qonto.com/transactions/${order.matched_transaction_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Voir sur Qonto
              </a>
            )}
          </div>
        ) : (
          <p className="text-center text-xs text-gray-500 py-2">
            Non rapproch\u00e9e
          </p>
        )}
      </CardContent>
    </Card>
  );
}
