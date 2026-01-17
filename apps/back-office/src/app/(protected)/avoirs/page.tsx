'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Badge,
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
import { Download, Eye, FileX, RefreshCw } from 'lucide-react';

interface CreditNote {
  id: string;
  credit_note_number: string;
  status: 'draft' | 'finalized';
  currency: string;
  total_amount: number;
  issue_date: string;
  client?: {
    name: string;
  };
  invoice_id?: string;
}

function formatAmount(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('fr-FR').format(new Date(dateString));
}

function StatusBadge({ status }: { status: string }): React.ReactNode {
  const variants: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    draft: 'secondary',
    finalized: 'default',
  };

  const labels: Record<string, string> = {
    draft: 'Brouillon',
    finalized: 'Finalisé',
  };

  return (
    <Badge variant={variants[status] || 'outline'}>
      {labels[status] || status}
    </Badge>
  );
}

export default function AvoirsPage(): React.ReactNode {
  const router = useRouter();
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreditNotes = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/qonto/credit-notes');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch credit notes');
      }

      setCreditNotes(data.credit_notes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCreditNotes();
  }, []);

  const handleDownloadPdf = async (creditNote: CreditNote): Promise<void> => {
    try {
      const response = await fetch(
        `/api/qonto/credit-notes/${creditNote.id}/pdf`
      );

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `avoir-${creditNote.credit_note_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Avoirs</h1>
          <p className="text-muted-foreground">
            Gestion des avoirs clients (Credit Notes)
          </p>
        </div>
        <Button variant="outline" onClick={fetchCreditNotes} disabled={loading}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
          />
          Actualiser
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileX className="h-5 w-5" />
            Liste des avoirs
          </CardTitle>
          <CardDescription>
            Les avoirs sont créés depuis la page de détail d&apos;une facture
            finalisée
          </CardDescription>
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
                Les avoirs sont créés depuis la page de détail d&apos;une
                facture
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Avoir</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
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
                    <TableCell>{creditNote.client?.name || '-'}</TableCell>
                    <TableCell>{formatDate(creditNote.issue_date)}</TableCell>
                    <TableCell>
                      <StatusBadge status={creditNote.status} />
                    </TableCell>
                    <TableCell className="text-right font-medium text-destructive">
                      -
                      {formatAmount(
                        creditNote.total_amount,
                        creditNote.currency
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/avoirs/${creditNote.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {creditNote.status === 'finalized' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadPdf(creditNote)}
                          >
                            <Download className="h-4 w-4" />
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
    </div>
  );
}
