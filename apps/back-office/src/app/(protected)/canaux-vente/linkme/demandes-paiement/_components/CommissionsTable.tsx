'use client';

import { Card } from '@verone/ui';

import { formatCurrency, formatDate } from './helpers';

interface CommissionRow {
  order_number: string;
  order_date: string | null;
  order_amount_ht: number;
  total_payout_ht: number;
  total_payout_ttc: number;
}

interface CommissionsTableProps {
  commissions: CommissionRow[];
}

export function CommissionsTable({ commissions }: CommissionsTableProps) {
  const totalPayoutHT = commissions.reduce((s, c) => s + c.total_payout_ht, 0);
  const totalPayoutTTC = commissions.reduce(
    (s, c) => s + c.total_payout_ttc,
    0
  );

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-700">
          Commandes incluses ({commissions.length})
        </h2>
        <span className="text-xs text-gray-500">
          Total : {formatCurrency(totalPayoutTTC)} TTC
        </span>
      </div>

      {commissions.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-400">
          Aucune commande liée à cette demande.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                  N° commande
                </th>
                <th className="hidden px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 lg:table-cell">
                  Date
                </th>
                <th className="hidden px-4 py-2 text-right text-xs font-medium uppercase text-gray-500 xl:table-cell">
                  Montant HT
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">
                  Rémunération HT
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">
                  Rémunération TTC
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {commissions.map((c, idx) => (
                <tr
                  key={`${c.order_number}-${idx}`}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-2.5">
                    <span className="text-sm font-medium text-gray-900">
                      {c.order_number}
                    </span>
                  </td>
                  <td className="hidden px-4 py-2.5 text-sm text-gray-500 lg:table-cell">
                    {formatDate(c.order_date)}
                  </td>
                  <td className="hidden px-4 py-2.5 text-right text-sm text-gray-600 xl:table-cell">
                    {formatCurrency(c.order_amount_ht)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm text-gray-700">
                    {formatCurrency(c.total_payout_ht)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm font-medium text-emerald-600">
                    {formatCurrency(c.total_payout_ttc)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-200 bg-gray-50">
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-700"
                >
                  Total
                </td>
                <td className="px-4 py-2.5 text-right text-sm font-semibold text-gray-700">
                  {formatCurrency(totalPayoutHT)}
                </td>
                <td className="px-4 py-2.5 text-right text-sm font-semibold text-emerald-700">
                  {formatCurrency(totalPayoutTTC)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  );
}
