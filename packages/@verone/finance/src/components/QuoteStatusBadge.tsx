'use client';

import { Badge } from '@verone/ui';

const QUOTE_STATUS_VARIANTS: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  draft: 'secondary',
  sent: 'outline',
  pending_approval: 'outline',
  finalized: 'default',
  accepted: 'default',
  declined: 'destructive',
  expired: 'outline',
  converted: 'default',
};

const QUOTE_STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  pending_approval: 'En attente',
  finalized: 'Finalisé',
  accepted: 'Accepté',
  declined: 'Refusé',
  expired: 'Expiré',
  converted: 'Converti',
};

export function QuoteStatusBadge({
  status,
}: {
  status: string;
}): React.ReactNode {
  return (
    <Badge variant={QUOTE_STATUS_VARIANTS[status] ?? 'outline'}>
      {QUOTE_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
