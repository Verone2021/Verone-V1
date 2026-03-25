'use client';

import { Badge } from '@verone/ui';

export function CreditNoteStatusBadge({
  status,
}: {
  status: string;
}): React.ReactNode {
  const variants: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    draft: 'secondary',
    finalized: 'default',
  };

  const labels: Record<string, string> = {
    draft: 'Brouillon',
    finalized: 'Finalise',
  };

  return (
    <Badge variant={variants[status] ?? 'outline'}>
      {labels[status] ?? status}
    </Badge>
  );
}

export function InvoiceStatusBadge({
  status,
}: {
  status: string;
}): React.ReactNode {
  const variants: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    draft: 'secondary',
    pending: 'outline',
    unpaid: 'outline',
    paid: 'default',
    partially_paid: 'secondary',
    overdue: 'destructive',
    cancelled: 'destructive',
    canceled: 'destructive', // Qonto uses 'canceled' (US spelling)
  };

  const labels: Record<string, string> = {
    draft: 'Brouillon',
    pending: 'En attente',
    unpaid: 'Non payee',
    paid: 'Payee',
    partially_paid: 'Partiellement payee',
    overdue: 'En retard',
    cancelled: 'Annulee',
    canceled: 'Annulee', // Qonto uses 'canceled' (US spelling)
  };

  const isOverdue = status === 'overdue';

  return (
    <Badge
      variant={variants[status] ?? 'outline'}
      className={isOverdue ? 'animate-pulse' : undefined}
    >
      {labels[status] ?? status}
    </Badge>
  );
}
