'use client';

import Link from 'next/link';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Download } from 'lucide-react';

import { StatusBadge } from './StatusBadge';
import type { QontoQuote } from './types';

function formatAmount(amount: number | string, currency = 'EUR'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return numAmount.toLocaleString('fr-FR', { style: 'currency', currency });
}

interface QuoteCardProps {
  quote: QontoQuote;
  onDownloadPdf: (id: string) => void;
}

export function QuoteCard({
  quote,
  onDownloadPdf,
}: QuoteCardProps): React.ReactNode {
  const isNegative = quote.status === 'declined' || quote.status === 'expired';

  return (
    <Link href={`/factures/${quote.id}?type=quote`} className="block">
      <Card
        className={`cursor-pointer transition-shadow hover:shadow-md${
          isNegative ? ' border-red-200 bg-red-50' : ''
        }`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{quote.quote_number}</CardTitle>
            <StatusBadge status={quote.status} type="quote" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Client: {quote.client?.name ?? 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">
                Date: {quote.issue_date} | Expire: {quote.expiry_date}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-lg font-bold">
                {formatAmount(quote.total_amount, quote.currency)}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={e => {
                  e.preventDefault();
                  onDownloadPdf(quote.id);
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
