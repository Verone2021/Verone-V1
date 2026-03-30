'use client';

import Link from 'next/link';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Download } from 'lucide-react';

import { StatusBadge } from './StatusBadge';
import type { QontoCreditNote } from './types';

function formatAmount(amount: number | string, currency = 'EUR'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return numAmount.toLocaleString('fr-FR', { style: 'currency', currency });
}

function resolveCreditNoteAmount(creditNote: QontoCreditNote): string {
  if (creditNote.total_amount) {
    return formatAmount(creditNote.total_amount.value);
  }
  if (creditNote.total_amount_cents !== undefined) {
    return formatAmount(creditNote.total_amount_cents / 100);
  }
  return '-';
}

interface CreditNoteCardProps {
  creditNote: QontoCreditNote;
  onDownloadPdf: (id: string) => void;
}

export function CreditNoteCard({
  creditNote,
  onDownloadPdf,
}: CreditNoteCardProps): React.ReactNode {
  return (
    <Link
      href={`/factures/${creditNote.id}?type=credit_note`}
      className="block"
    >
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {creditNote.credit_note_number ?? creditNote.number ?? 'N/A'}
            </CardTitle>
            <StatusBadge status={creditNote.status} type="credit_note" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Client: {creditNote.client?.name ?? 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">
                Date: {creditNote.issue_date}
                {creditNote.invoice_id && (
                  <> | Ref facture: {creditNote.invoice_id}</>
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-lg font-bold">
                {resolveCreditNoteAmount(creditNote)}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={e => {
                  e.preventDefault();
                  onDownloadPdf(creditNote.id);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
