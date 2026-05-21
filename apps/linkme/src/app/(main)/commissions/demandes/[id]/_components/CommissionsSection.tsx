/**
 * CommissionsSection — Liste des commissions incluses dans une demande
 * Affiché dans la page détail côté affilié.
 *
 * @module CommissionsSection
 */

'use client';

import { ShoppingBag } from 'lucide-react';

import type { CommissionItem } from '../../../../../../types/analytics';
import { formatCurrency } from '../../../../../../types/analytics';

interface Props {
  commissions: CommissionItem[];
}

export function CommissionsSection({ commissions }: Props) {
  if (commissions.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        Aucune commission associée.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {commissions.map(commission => (
        <li
          key={commission.id}
          className="flex items-start justify-between gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100"
        >
          <div className="flex items-start gap-3 min-w-0">
            <ShoppingBag className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                Commande {commission.orderNumber}
              </p>
              {commission.selectionName && (
                <p className="text-xs text-gray-500 truncate">
                  Sélection : {commission.selectionName}
                </p>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-semibold text-emerald-600">
              {formatCurrency(commission.totalPayoutTTC)}
            </p>
            <p className="text-xs text-gray-400">TTC</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
