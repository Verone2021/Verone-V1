'use client';

import { Calendar, CheckCircle2, CreditCard, User } from 'lucide-react';

import { Card } from '@verone/ui';

import { formatCurrency, formatDate } from './helpers';
import type { PaymentRequestStatus } from './types';

interface RequestInfoCardsProps {
  affiliateName: string;
  affiliateEmail: string;
  totalAmountTTC: number;
  totalAmountHT: number;
  paidAt: string | null;
  paymentReference: string | null;
  status: PaymentRequestStatus;
  commissionsCount: number;
}

export function RequestInfoCards({
  affiliateName,
  affiliateEmail,
  totalAmountTTC,
  totalAmountHT,
  paidAt,
  paymentReference,
  commissionsCount,
}: RequestInfoCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card className="p-4 flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-lg">
          <User className="h-4 w-4 text-gray-500" />
        </div>
        <div>
          <p className="text-xs text-gray-500">Affilié</p>
          <p className="text-sm font-medium text-gray-900">{affiliateName}</p>
          {affiliateEmail && (
            <p className="text-xs text-gray-400">{affiliateEmail}</p>
          )}
        </div>
      </Card>

      <Card className="p-4 flex items-center gap-3">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <CreditCard className="h-4 w-4 text-emerald-600" />
        </div>
        <div>
          <p className="text-xs text-gray-500">Montant total TTC</p>
          <p className="text-sm font-semibold text-emerald-600">
            {formatCurrency(totalAmountTTC)}
          </p>
          <p className="text-xs text-gray-400">
            HT : {formatCurrency(totalAmountHT)}
          </p>
        </div>
      </Card>

      {paidAt && (
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Soldée le</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDate(paidAt)}
            </p>
            {paymentReference && (
              <p className="text-xs text-gray-400 truncate max-w-[160px]">
                {paymentReference}
              </p>
            )}
          </div>
        </Card>
      )}

      <Card className="p-4 flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Calendar className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="text-xs text-gray-500">Commandes incluses</p>
          <p className="text-sm font-semibold text-gray-900">
            {commissionsCount} commande{commissionsCount > 1 ? 's' : ''}
          </p>
        </div>
      </Card>
    </div>
  );
}
