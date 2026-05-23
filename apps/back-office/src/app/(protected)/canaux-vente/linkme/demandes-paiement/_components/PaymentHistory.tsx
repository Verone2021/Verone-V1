'use client';

import { Banknote, Loader2 } from 'lucide-react';

import { Card } from '@verone/ui';

import { usePaymentHistory } from '../hooks/use-linkme-payments';
import { formatCurrency, formatDate } from './helpers';

interface PaymentHistoryProps {
  requestId: string;
  totalAmountTTC: number;
  onProcessPayment: () => void;
}

export function PaymentHistory({
  requestId,
  totalAmountTTC,
  onProcessPayment,
}: PaymentHistoryProps) {
  const { data: payments = [], isLoading } = usePaymentHistory(requestId);
  const totalPaid = payments.reduce((s, p) => s + p.amountTTC, 0);
  const remaining = Math.max(0, totalAmountTTC - totalPaid);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">
            Virements enregistrés ({payments.length})
          </h2>
        </div>
        {remaining > 0.005 && (
          <button
            onClick={onProcessPayment}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 px-3 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Banknote className="h-3.5 w-3.5" />
            Traiter le paiement
          </button>
        )}
      </div>

      {/* Résumé montants */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
        <div className="p-3 text-center">
          <p className="text-xs text-gray-400">Total dû</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(totalAmountTTC)}
          </p>
        </div>
        <div className="p-3 text-center">
          <p className="text-xs text-gray-400">Versé</p>
          <p className="text-sm font-semibold text-emerald-600">
            {formatCurrency(totalPaid)}
          </p>
        </div>
        <div className="p-3 text-center">
          <p className="text-xs text-gray-400">Restant dû</p>
          <p
            className={`text-sm font-bold ${remaining > 0.005 ? 'text-amber-600' : 'text-emerald-600'}`}
          >
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : payments.length === 0 ? (
        <div className="p-6 text-center text-sm text-gray-400">
          Aucun virement enregistré pour le moment.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                  Date
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                  Référence
                </th>
                <th className="hidden px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 lg:table-cell">
                  Notes
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">
                  Montant TTC
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-sm text-gray-600">
                    {formatDate(p.paymentDate)}
                  </td>
                  <td className="px-4 py-2.5 text-sm font-medium text-gray-900">
                    {p.paymentReference}
                  </td>
                  <td className="hidden px-4 py-2.5 text-sm text-gray-500 lg:table-cell">
                    {p.notes ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm font-semibold text-emerald-600">
                    {formatCurrency(p.amountTTC)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
