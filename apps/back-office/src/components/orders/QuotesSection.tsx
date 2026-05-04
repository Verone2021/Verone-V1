'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { Button, Card, CardContent } from '@verone/ui';
import {
  DocumentResyncAction,
  SendDocumentEmailModal,
} from '@verone/finance/components';
import { Download, Eye, FileEdit, Loader2, Mail } from 'lucide-react';

interface LinkedQuote {
  id: string;
  quote_number: string;
  status: string;
  total_amount: number;
  currency: string;
  issue_date: string;
  expiry_date: string;
  /** [BO-FIN-009 Phase 4] created_at du financial_document local, pour détection out-of-sync */
  document_created_at?: string | null;
  /** [BO-FIN-009 Phase 4] notes libres du document local, préservées lors d'une re-synchronisation */
  document_notes?: string | null;
}

interface QuotesByOrderResponse {
  success: boolean;
  quotes?: LinkedQuote[];
  count?: number;
  /** [BO-FIN-009 Phase 4] sales_orders.updated_at pour comparaison out-of-sync */
  order_updated_at?: string | null;
  error?: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  approved: 'Approuvé',
  accepted: 'Accepté',
  declined: 'Refusé',
  expired: 'Expiré',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'text-gray-500 bg-gray-100',
  approved: 'text-blue-700 bg-blue-100',
  accepted: 'text-green-700 bg-green-100',
  declined: 'text-red-700 bg-red-100',
  expired: 'text-amber-700 bg-amber-100',
};

interface QuotesSectionProps {
  orderId: string;
  /** Email du client lié à la commande — passé au modal d'envoi email. */
  clientEmail?: string;
  /** Nom du client lié à la commande — passé au modal d'envoi email. */
  clientName?: string;
}

export function QuotesSection({
  orderId,
  clientEmail = '',
  clientName = '',
}: QuotesSectionProps) {
  const router = useRouter();
  const [sendModalQuoteId, setSendModalQuoteId] = useState<string | null>(null);
  const [sendModalQuoteNumber, setSendModalQuoteNumber] = useState<string>('');

  const { data, isLoading, refetch } = useQuery<QuotesByOrderResponse>({
    queryKey: ['quotes-by-order', orderId],
    queryFn: async (): Promise<QuotesByOrderResponse> => {
      const res = await fetch(`/api/qonto/quotes/by-order/${orderId}`);
      if (!res.ok) throw new Error('Failed to fetch quotes');
      return res.json() as Promise<QuotesByOrderResponse>;
    },
  });

  const quotes: LinkedQuote[] = data?.quotes ?? [];
  const orderUpdatedAt = data?.order_updated_at ?? null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
            <span className="text-xs text-gray-400">Devis...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (quotes.length === 0) {
    return (
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5">
            <FileEdit className="h-3.5 w-3.5 text-gray-300" />
            <span className="text-xs text-gray-400">Aucun devis</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <FileEdit className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Devis ({quotes.length})
          </span>
        </div>

        {quotes.map(quote => {
          const statusLabel = STATUS_LABELS[quote.status] ?? quote.status;
          const statusColor =
            STATUS_COLORS[quote.status] ?? 'text-gray-500 bg-gray-100';

          return (
            <div
              key={quote.id}
              className="border rounded p-2 space-y-1.5 bg-gray-50/50"
            >
              {/* Header row */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium truncate">
                  {quote.quote_number}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusColor}`}
                  >
                    {statusLabel}
                  </span>
                  <span className="text-xs font-semibold">
                    {quote.total_amount.toFixed(2)} €
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-3 text-[10px] text-gray-500">
                {quote.issue_date && (
                  <span>
                    Émis le{' '}
                    {new Date(quote.issue_date).toLocaleDateString('fr-FR')}
                  </span>
                )}
                {quote.expiry_date && (
                  <span>
                    Exp.{' '}
                    {new Date(quote.expiry_date).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>

              {/* [BO-FIN-009 Phase 4] Badge + bouton Re-synchroniser si out-of-sync (draft uniquement) */}
              <div className="flex flex-wrap items-center gap-1">
                <DocumentResyncAction
                  documentType="quote"
                  orderId={orderId}
                  documentStatus={quote.status}
                  orderUpdatedAt={orderUpdatedAt}
                  documentCreatedAt={
                    quote.document_created_at ?? quote.issue_date ?? null
                  }
                  existingNotes={quote.document_notes ?? ''}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] px-2"
                  onClick={() => {
                    window.open(`/api/qonto/quotes/${quote.id}/pdf`, '_blank');
                  }}
                >
                  <Download className="h-3 w-3 mr-0.5" />
                  PDF
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] px-2"
                  onClick={() => {
                    setSendModalQuoteId(quote.id);
                    setSendModalQuoteNumber(quote.quote_number);
                  }}
                >
                  <Mail className="h-3 w-3 mr-0.5" />
                  Envoyer
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[10px] px-2 ml-auto"
                  onClick={() => {
                    router.push(`/factures/devis/${quote.id}`);
                  }}
                >
                  <Eye className="h-3 w-3 mr-0.5" />
                  Voir
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>

      {sendModalQuoteId && (
        <SendDocumentEmailModal
          open
          onClose={() => {
            setSendModalQuoteId(null);
            setSendModalQuoteNumber('');
          }}
          documentType="quote"
          documentId={sendModalQuoteId}
          documentNumber={sendModalQuoteNumber}
          clientEmail={clientEmail}
          clientName={clientName}
          pdfUrl={`/api/qonto/quotes/${sendModalQuoteId}/pdf`}
          onSent={() => {
            void refetch();
          }}
        />
      )}
    </Card>
  );
}
