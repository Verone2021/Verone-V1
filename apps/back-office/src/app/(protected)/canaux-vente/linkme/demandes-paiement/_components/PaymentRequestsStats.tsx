'use client';

import { Card } from '@verone/ui';

import { type PaymentRequestAdmin } from './types';

interface PaymentRequestsStatsProps {
  requests: PaymentRequestAdmin[] | undefined;
}

export function PaymentRequestsStats({ requests }: PaymentRequestsStatsProps) {
  const stats = {
    total: requests?.length ?? 0,
    pending:
      requests?.filter(r => r.status === 'pending' && !r.invoiceReceived)
        .length ?? 0,
    invoiceReceived:
      requests?.filter(r => r.invoiceReceived && r.status === 'pending')
        .length ?? 0,
    partiallyPaid:
      requests?.filter(r => r.status === 'partially_paid').length ?? 0,
    paid: requests?.filter(r => r.status === 'paid').length ?? 0,
  };

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      <Card className="p-4">
        <p className="text-xs text-gray-500 uppercase">Total</p>
        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
      </Card>
      <Card className="p-4">
        <p className="text-xs text-orange-500 uppercase">En attente facture</p>
        <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
      </Card>
      <Card className="p-4">
        <p className="text-xs text-blue-500 uppercase">Facture reçue</p>
        <p className="text-2xl font-bold text-blue-600">
          {stats.invoiceReceived}
        </p>
      </Card>
      <Card className="p-4">
        <p className="text-xs text-amber-500 uppercase">Partiellement payée</p>
        <p className="text-2xl font-bold text-amber-600">
          {stats.partiallyPaid}
        </p>
      </Card>
      <Card className="p-4">
        <p className="text-xs text-emerald-500 uppercase">Payées</p>
        <p className="text-2xl font-bold text-emerald-600">{stats.paid}</p>
      </Card>
    </div>
  );
}
