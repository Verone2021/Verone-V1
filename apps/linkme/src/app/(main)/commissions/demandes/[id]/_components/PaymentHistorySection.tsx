/**
 * PaymentHistorySection — Historique des virements reçus pour une demande
 * Affiché dans la page détail côté affilié.
 *
 * @module PaymentHistorySection
 */

'use client';

import { Banknote, Loader2, FileText } from 'lucide-react';

import type { AffiliatePayment } from '../../../../../../lib/hooks/use-payment-requests';
import {
  formatCurrency,
  formatDateFR,
} from '../../../../../../types/analytics';

interface Props {
  payments: AffiliatePayment[];
  isLoading: boolean;
}

export function PaymentHistorySection({ payments, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        Aucun virement enregistré pour l&apos;instant.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {payments.map(payment => (
        <li
          key={payment.id}
          className="flex items-start justify-between gap-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100"
        >
          <div className="flex items-start gap-3 min-w-0">
            <Banknote className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {formatCurrency(payment.amountTTC)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatDateFR(payment.paymentDate, {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="text-xs text-gray-400 truncate">
                Réf : {payment.paymentReference}
              </p>
              {payment.notes && (
                <p className="text-xs text-gray-500 mt-1 italic">
                  {payment.notes}
                </p>
              )}
            </div>
          </div>

          {payment.paymentProofUrl && (
            <a
              href={payment.paymentProofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium"
            >
              <FileText className="h-3.5 w-3.5" />
              Justificatif
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
