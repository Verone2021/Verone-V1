'use client';

import Link from 'next/link';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Download } from 'lucide-react';

import { StatusBadge } from './StatusBadge';
import type { QontoInvoice } from './types';

function formatAmount(amount: number | string, currency = 'EUR'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return numAmount.toLocaleString('fr-FR', { style: 'currency', currency });
}

interface InvoiceCardProps {
  invoice: QontoInvoice;
  onDownloadPdf: (id: string) => void;
}

export function InvoiceCard({
  invoice,
  onDownloadPdf,
}: InvoiceCardProps): React.ReactNode {
  const isCanceled =
    invoice.status === 'canceled' || invoice.status === 'cancelled';

  return (
    <Link href={`/factures/${invoice.id}?type=invoice`} className="block">
      <Card
        className={`cursor-pointer transition-shadow hover:shadow-md${
          isCanceled ? ' border-red-200 bg-red-50' : ''
        }`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{invoice.number}</CardTitle>
            <StatusBadge status={invoice.status} type="invoice" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Client: {invoice.client?.name ?? 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">
                Date: {invoice.issue_date} | Echeance: {invoice.due_date}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-lg font-bold">
                {formatAmount(invoice.total_amount.value)}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={e => {
                  e.preventDefault();
                  onDownloadPdf(invoice.id);
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
