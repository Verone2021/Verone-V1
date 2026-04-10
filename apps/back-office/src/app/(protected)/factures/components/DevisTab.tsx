'use client';

import Link from 'next/link';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { QuoteStatusBadge } from '@verone/finance/components';
import {
  Download,
  Eye,
  FileEdit,
  FileText,
  RefreshCw,
  Trash2,
} from 'lucide-react';

import type { QontoQuote } from './types';
import { formatAmount, formatDate } from './types';

interface DevisTabProps {
  quotes: QontoQuote[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onDownloadPdf: (quote: QontoQuote) => void;
  onDelete: (quote: QontoQuote) => void;
}

export function DevisTab({
  quotes,
  loading,
  error,
  onRefresh,
  onDownloadPdf,
  onDelete,
}: DevisTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileEdit className="h-5 w-5" />
              Liste des devis
            </CardTitle>
            <CardDescription>
              Creez des devis depuis vos commandes et convertissez-les en
              factures
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        ) : quotes.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <FileEdit className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Aucun devis</p>
            <p className="text-sm">
              Cliquez sur &quot;Nouveau devis&quot; pour en creer un
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Devis</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map(quote => (
                <TableRow key={quote.id}>
                  <TableCell>
                    <div className="font-mono">{quote.quote_number}</div>
                    {quote.purchase_order_number && (
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {quote.purchase_order_number}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{quote.client?.name ?? '-'}</TableCell>
                  <TableCell>{formatDate(quote.issue_date)}</TableCell>
                  <TableCell>
                    {quote.expiry_date ? formatDate(quote.expiry_date) : '-'}
                  </TableCell>
                  <TableCell>
                    <QuoteStatusBadge status={quote.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatAmount(quote.total_amount, quote.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          href={`/factures/devis/${quote.id}`}
                          title="Voir le detail"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          window.open(
                            `/api/qonto/quotes/${quote.id}/pdf`,
                            '_blank'
                          )
                        }
                        title="Voir PDF"
                        className="text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          void (async () => {
                            try {
                              onDownloadPdf(quote);
                            } catch (error: unknown) {
                              console.error(
                                '[Factures] handleDownloadQuotePdf failed:',
                                error
                              );
                            }
                          })();
                        }}
                        title="Telecharger PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {!quote.converted_to_invoice_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(quote)}
                          title="Supprimer"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
