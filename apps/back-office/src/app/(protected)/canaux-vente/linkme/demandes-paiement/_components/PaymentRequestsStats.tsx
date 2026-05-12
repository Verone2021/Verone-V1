'use client';

import { Card } from '@verone/ui';

import type { PaymentRequestAdmin } from './types';

interface PaymentRequestsStatsProps {
  requests: PaymentRequestAdmin[] | undefined;
}

export function PaymentRequestsStats({ requests }: PaymentRequestsStatsProps) {
  const stats = {
    total: requests?.length ?? 0,
    pending: requests?.filter(r => r.status === 'pending').length ?? 0,
    toProcess:
      requests?.filter(
        r => r.status === 'invoice_received' || r.status === 'partially_paid'
      ).length ?? 0,
    paid: requests?.filter(r => r.status === 'paid').length ?? 0,
    partiallyPaid:
      requests?.filter(r => r.status === 'partially_paid').length ?? 0,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="p-4">
        <p className="text-xs text-gray-500 uppercase">Total</p>
        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
      </Card>
      <Card className="p-4">
        <p className="text-xs text-orange-500 uppercase">En attente facture</p>
        <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
      </Card>
      <Card className="p-4">
        <p className="text-xs text-blue-500 uppercase">À traiter</p>
        <p className="text-2xl font-bold text-blue-600">{stats.toProcess}</p>
        {stats.partiallyPaid > 0 && (
          <p className="text-xs text-amber-500 mt-0.5">
            dont {stats.partiallyPaid} partielle
            {stats.partiallyPaid > 1 ? 's' : ''}
          </p>
        )}
      </Card>
      <Card className="p-4">
        <p className="text-xs text-emerald-500 uppercase">Payées</p>
        <p className="text-2xl font-bold text-emerald-600">{stats.paid}</p>
      </Card>
    </div>
  );
}
