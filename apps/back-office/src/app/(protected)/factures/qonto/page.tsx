'use client';

import { useState, useEffect, useCallback } from 'react';

import Link from 'next/link';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@verone/ui';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  FileText,
  FileCheck,
  FileMinus,
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

interface QontoInvoice {
  id: string;
  number: string;
  status: string;
  total_amount: { value: string; currency: string };
  total_amount_cents: number;
  issue_date: string;
  due_date: string;
  pdf_url?: string;
  client?: {
    name: string;
    email?: string;
  };
}

interface QontoQuote {
  id: string;
  quote_number: string;
  status: string;
  total_amount: number;
  currency: string;
  issue_date: string;
  expiry_date: string;
  pdf_url?: string;
  client?: {
    name: string;
    email?: string;
  };
}

interface QontoCreditNote {
  id: string;
  number: string;
  credit_note_number?: string;
  status: string;
  total_amount?: { value: string; currency: string };
  total_amount_cents?: number;
  issue_date: string;
  pdf_url?: string;
  client?: {
    name: string;
    email?: string;
  };
  invoice_id?: string;
}

type DocumentType = 'invoice' | 'quote' | 'credit_note';

// ============================================================
// STATUS BADGE COMPONENT
// ============================================================

function StatusBadge({
  status,
  type: _type,
}: {
  status: string;
  type: DocumentType;
}): React.ReactNode {
  const variants: Record<
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
  };

  const labels: Record<string, string> = {
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
  };

  return (
    <Badge variant={variants[status] || 'outline'}>
      {labels[status] || status}
    </Badge>
  );
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================

export default function QontoDocumentsPage(): React.ReactNode {
  // State for each document type
  const [invoices, setInvoices] = useState<QontoInvoice[]>([]);
  const [quotes, setQuotes] = useState<QontoQuote[]>([]);
  const [creditNotes, setCreditNotes] = useState<QontoCreditNote[]>([]);

  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [loadingQuotes, setLoadingQuotes] = useState(true);
  const [loadingCreditNotes, setLoadingCreditNotes] = useState(true);

  const [errorInvoices, setErrorInvoices] = useState<string | null>(null);
  const [errorQuotes, setErrorQuotes] = useState<string | null>(null);
  const [errorCreditNotes, setErrorCreditNotes] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>('invoices');

  // ============================================================
  // FETCH FUNCTIONS
  // ============================================================

  const fetchInvoices = useCallback(async (): Promise<void> => {
    setLoadingInvoices(true);
    setErrorInvoices(null);

    try {
      const response = await fetch('/api/qonto/invoices');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Erreur chargement factures');
      }

      setInvoices(data.invoices ?? []);
    } catch (err) {
      setErrorInvoices(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingInvoices(false);
    }
  }, []);

  const fetchQuotes = useCallback(async (): Promise<void> => {
    setLoadingQuotes(true);
    setErrorQuotes(null);

    try {
      const response = await fetch('/api/qonto/quotes');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Erreur chargement devis');
      }

      setQuotes(data.quotes ?? []);
    } catch (err) {
      setErrorQuotes(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingQuotes(false);
    }
  }, []);

  const fetchCreditNotes = useCallback(async (): Promise<void> => {
    setLoadingCreditNotes(true);
    setErrorCreditNotes(null);

    try {
      const response = await fetch('/api/qonto/credit-notes');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Erreur chargement avoirs');
      }

      setCreditNotes(data.credit_notes ?? []);
    } catch (err) {
      setErrorCreditNotes(
        err instanceof Error ? err.message : 'Erreur inconnue'
      );
    } finally {
      setLoadingCreditNotes(false);
    }
  }, []);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    void fetchInvoices();
    void fetchQuotes();
    void fetchCreditNotes();
  }, [fetchInvoices, fetchQuotes, fetchCreditNotes]);

  // ============================================================
  // REFRESH HANDLER
  // ============================================================

  const handleRefresh = (): void => {
    if (activeTab === 'invoices') {
      void fetchInvoices();
    } else if (activeTab === 'quotes') {
      void fetchQuotes();
    } else if (activeTab === 'credit_notes') {
      void fetchCreditNotes();
    }
  };

  const isLoading =
    (activeTab === 'invoices' && loadingInvoices) ||
    (activeTab === 'quotes' && loadingQuotes) ||
    (activeTab === 'credit_notes' && loadingCreditNotes);

  // ============================================================
  // PDF DOWNLOAD HANDLERS
  // ============================================================

  const handleDownloadInvoicePdf = (invoiceId: string): void => {
    window.open(`/api/qonto/invoices/${invoiceId}/pdf`, '_blank');
  };

  const handleDownloadQuotePdf = (quoteId: string): void => {
    window.open(`/api/qonto/quotes/${quoteId}/pdf`, '_blank');
  };

  const handleDownloadCreditNotePdf = (creditNoteId: string): void => {
    window.open(`/api/qonto/credit-notes/${creditNoteId}/pdf`, '_blank');
  };

  // ============================================================
  // FORMAT HELPERS
  // ============================================================

  const formatAmount = (amount: number | string, currency = 'EUR'): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return numAmount.toLocaleString('fr-FR', {
      style: 'currency',
      currency,
    });
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/factures">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Documents Qonto</h1>
            <p className="text-muted-foreground">
              Factures, Devis et Avoirs synchronises depuis Qonto
            </p>
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
          />
          Rafraichir
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Factures ({invoices.length})
          </TabsTrigger>
          <TabsTrigger value="quotes" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Devis ({quotes.length})
          </TabsTrigger>
          <TabsTrigger value="credit_notes" className="flex items-center gap-2">
            <FileMinus className="h-4 w-4" />
            Avoirs ({creditNotes.length})
          </TabsTrigger>
        </TabsList>

        {/* INVOICES TAB */}
        <TabsContent value="invoices" className="mt-6">
          {errorInvoices && (
            <Card className="mb-4 border-destructive/50 bg-destructive/10">
              <CardContent className="pt-6">
                <p className="text-destructive">{errorInvoices}</p>
              </CardContent>
            </Card>
          )}

          {loadingInvoices && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          )}

          {!loadingInvoices && invoices.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Aucune facture trouvee dans Qonto
              </CardContent>
            </Card>
          )}

          {!loadingInvoices && invoices.length > 0 && (
            <div className="space-y-4">
              {invoices.map(invoice => (
                <Card
                  key={invoice.id}
                  className={
                    invoice.status === 'canceled' ||
                    invoice.status === 'cancelled'
                      ? 'border-red-200 bg-red-50'
                      : undefined
                  }
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {invoice.number}
                      </CardTitle>
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
                          Date: {invoice.issue_date} | Echeance:{' '}
                          {invoice.due_date}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-lg font-bold">
                          {formatAmount(invoice.total_amount.value)}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadInvoicePdf(invoice.id)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* QUOTES TAB */}
        <TabsContent value="quotes" className="mt-6">
          {errorQuotes && (
            <Card className="mb-4 border-destructive/50 bg-destructive/10">
              <CardContent className="pt-6">
                <p className="text-destructive">{errorQuotes}</p>
              </CardContent>
            </Card>
          )}

          {loadingQuotes && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          )}

          {!loadingQuotes && quotes.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Aucun devis trouve dans Qonto
              </CardContent>
            </Card>
          )}

          {!loadingQuotes && quotes.length > 0 && (
            <div className="space-y-4">
              {quotes.map(quote => (
                <Card
                  key={quote.id}
                  className={
                    quote.status === 'declined' || quote.status === 'expired'
                      ? 'border-red-200 bg-red-50'
                      : undefined
                  }
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {quote.quote_number}
                      </CardTitle>
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
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadQuotePdf(quote.id)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* CREDIT NOTES TAB */}
        <TabsContent value="credit_notes" className="mt-6">
          {errorCreditNotes && (
            <Card className="mb-4 border-destructive/50 bg-destructive/10">
              <CardContent className="pt-6">
                <p className="text-destructive">{errorCreditNotes}</p>
              </CardContent>
            </Card>
          )}

          {loadingCreditNotes && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          )}

          {!loadingCreditNotes && creditNotes.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Aucun avoir trouve dans Qonto
              </CardContent>
            </Card>
          )}

          {!loadingCreditNotes && creditNotes.length > 0 && (
            <div className="space-y-4">
              {creditNotes.map(creditNote => (
                <Card key={creditNote.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {creditNote.credit_note_number ||
                          creditNote.number ||
                          'N/A'}
                      </CardTitle>
                      <StatusBadge
                        status={creditNote.status}
                        type="credit_note"
                      />
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
                          {creditNote.total_amount
                            ? formatAmount(creditNote.total_amount.value)
                            : creditNote.total_amount_cents
                              ? formatAmount(
                                  creditNote.total_amount_cents / 100
                                )
                              : '-'}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDownloadCreditNotePdf(creditNote.id)
                            }
                          >
                            <Download className="mr-2 h-4 w-4" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
