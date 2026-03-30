'use client';

import { Badge } from '@verone/ui';

import type { DocumentType } from './types';

const STATUS_VARIANTS: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  draft: 'secondary',
  finalized: 'default',
  unpaid: 'default',
  paid: 'default',
  overdue: 'destructive',
  canceled: 'outline',
  cancelled: 'outline',
  accepted: 'default',
  declined: 'destructive',
  expired: 'outline',
  pending_approval: 'secondary',
  to_review: 'secondary',
  to_pay: 'default',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  finalized: 'Finalise',
  unpaid: 'Non payee',
  paid: 'Payee',
  overdue: 'En retard',
  canceled: 'Annulee',
  cancelled: 'Annulee',
  accepted: 'Accepte',
  declined: 'Refuse',
  expired: 'Expire',
  pending_approval: 'En attente',
  to_review: 'A examiner',
  to_pay: 'A payer',
};

interface StatusBadgeProps {
  status: string;
  type: DocumentType;
}

export function StatusBadge({ status }: StatusBadgeProps): React.ReactNode {
  return (
    <Badge variant={STATUS_VARIANTS[status] ?? 'outline'}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
