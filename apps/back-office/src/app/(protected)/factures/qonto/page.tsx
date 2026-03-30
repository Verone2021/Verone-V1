'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';

import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import {
  ArrowLeft,
  RefreshCw,
  FileText,
  FileCheck,
  FileMinus,
} from 'lucide-react';

import { CreditNoteCard } from './_components/CreditNoteCard';
import { DocumentListSkeleton } from './_components/DocumentListSkeleton';
import { InvoiceCard } from './_components/InvoiceCard';
import { QuoteCard } from './_components/QuoteCard';
import { useQontoDocuments } from './_components/useQontoDocuments';

export default function QontoDocumentsPage(): React.ReactNode {
  const [activeTab, setActiveTab] = useState<string>('invoices');

  const {
    invoices,
    quotes,
    creditNotes,
    loadingInvoices,
    loadingQuotes,
    loadingCreditNotes,
    errorInvoices,
    errorQuotes,
    errorCreditNotes,
    fetchInvoices,
    fetchQuotes,
    fetchCreditNotes,
  } = useQontoDocuments();

  useEffect(() => {
    void fetchInvoices();
    void fetchQuotes();
    void fetchCreditNotes();
  }, [fetchInvoices, fetchQuotes, fetchCreditNotes]);

  const isLoading =
    (activeTab === 'invoices' && loadingInvoices) ||
    (activeTab === 'quotes' && loadingQuotes) ||
    (activeTab === 'credit_notes' && loadingCreditNotes);

  const handleRefresh = (): void => {
    if (activeTab === 'invoices') void fetchInvoices();
    else if (activeTab === 'quotes') void fetchQuotes();
    else if (activeTab === 'credit_notes') void fetchCreditNotes();
  };

  const handleDownloadPdf =
    (type: 'invoices' | 'quotes' | 'credit-notes') =>
    (id: string): void => {
      window.open(`/api/qonto/${type}/${id}/pdf`, '_blank');
    };

  return (
    <div className="container mx-auto space-y-6 py-6">
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

        <TabsContent value="invoices" className="mt-6">
          <DocumentListSkeleton
            loading={loadingInvoices}
            error={errorInvoices}
            isEmpty={invoices.length === 0}
            emptyMessage="Aucune facture trouvee dans Qonto"
          >
            {invoices.map(invoice => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onDownloadPdf={handleDownloadPdf('invoices')}
              />
            ))}
          </DocumentListSkeleton>
        </TabsContent>

        <TabsContent value="quotes" className="mt-6">
          <DocumentListSkeleton
            loading={loadingQuotes}
            error={errorQuotes}
            isEmpty={quotes.length === 0}
            emptyMessage="Aucun devis trouve dans Qonto"
          >
            {quotes.map(quote => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                onDownloadPdf={handleDownloadPdf('quotes')}
              />
            ))}
          </DocumentListSkeleton>
        </TabsContent>

        <TabsContent value="credit_notes" className="mt-6">
          <DocumentListSkeleton
            loading={loadingCreditNotes}
            error={errorCreditNotes}
            isEmpty={creditNotes.length === 0}
            emptyMessage="Aucun avoir trouve dans Qonto"
          >
            {creditNotes.map(creditNote => (
              <CreditNoteCard
                key={creditNote.id}
                creditNote={creditNote}
                onDownloadPdf={handleDownloadPdf('credit-notes')}
              />
            ))}
          </DocumentListSkeleton>
        </TabsContent>
      </Tabs>
    </div>
  );
}
