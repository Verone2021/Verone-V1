'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';

import type { InvoiceDetail } from './types';

interface InvoiceNotesCardProps {
  invoice: InvoiceDetail;
}

export function InvoiceNotesCard({
  invoice,
}: InvoiceNotesCardProps): React.ReactNode {
  if (!invoice.description && !invoice.notes) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Notes</CardTitle>
      </CardHeader>
      <CardContent>
        {invoice.description && (
          <p className="text-sm mb-2">{invoice.description}</p>
        )}
        {invoice.notes && (
          <p className="text-sm text-muted-foreground">{invoice.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}
