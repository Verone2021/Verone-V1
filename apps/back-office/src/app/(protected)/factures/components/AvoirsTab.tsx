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
import {
  Download,
  Eye,
  ExternalLink,
  FileText,
  FileX,
  RefreshCw,
} from 'lucide-react';

import type { CreditNote } from './types';
import { formatAmount, formatDate } from './types';
import { CreditNoteStatusBadge } from './StatusBadges';

interface AvoirsTabProps {
  creditNotes: CreditNote[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onDownloadPdf: (creditNote: CreditNote) => void;
}

export function AvoirsTab({
  creditNotes,
  loading,
  error,
  onRefresh,
  onDownloadPdf,
}: AvoirsTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileX className="h-5 w-5" />
              Liste des avoirs
            </CardTitle>
            <CardDescription>
              Les avoirs sont crees depuis la page de detail d&apos;une facture
              finalisee
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
        ) : creditNotes.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <FileX className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Aucun avoir</p>
            <p className="text-sm">
              Les avoirs sont crees depuis la page de detail d&apos;une facture
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Avoir</TableHead>
                <TableHead className="hidden lg:table-cell">Client</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Facture liee
                </TableHead>
                <TableHead className="hidden xl:table-cell">Date</TableHead>
                <TableHead className="hidden xl:table-cell">Statut</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditNotes.map(creditNote => (
                <TableRow key={creditNote.id}>
                  <TableCell className="font-mono">
                    {creditNote.credit_note_number}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {creditNote.client?.name ?? '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {creditNote.invoice_id ? (
                      <Link
                        href={`/factures/${creditNote.invoice_id}?type=invoice`}
                        className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-sm"
                      >
                        {creditNote.invoice?.invoice_number ?? 'Voir facture'}
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {formatDate(creditNote.issue_date)}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <CreditNoteStatusBadge status={creditNote.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    -
                    {formatAmount(
                      Math.abs((creditNote.total_amount_cents ?? 0) / 100),
                      creditNote.currency
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          href={`/factures/${creditNote.id}?type=credit_note`}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          window.open(
                            `/api/qonto/credit-notes/${creditNote.id}/pdf`,
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
                        onClick={() => void onDownloadPdf(creditNote)}
                        title="Telecharger PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
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
