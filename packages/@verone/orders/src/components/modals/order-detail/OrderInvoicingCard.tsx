'use client';

import Link from 'next/link';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { FileText } from 'lucide-react';

import type { SalesOrder } from '@verone/orders/hooks';

export interface ILinkedInvoice {
  id: string;
  document_number: string | null;
  status: string | null;
  total_ttc: number;
  qonto_invoice_id: string | null;
}

export interface ILinkedQuote {
  id: string;
  quote_number: string;
  status: string;
  total_amount: number;
}

export interface OrderInvoicingCardProps {
  order: SalesOrder;
  readOnly: boolean;
  linkedInvoices: ILinkedInvoice[];
  linkedQuotes: ILinkedQuote[];
  loadingLinkedInvoices: boolean;
  loadingLinkedQuotes: boolean;
  activeInvoices: ILinkedInvoice[];
  hasActiveInvoice: boolean;
  onShowInvoiceModal: () => void;
  onShowQuoteModal: () => void;
}

export function OrderInvoicingCard({
  order,
  readOnly,
  linkedInvoices,
  linkedQuotes,
  loadingLinkedInvoices,
  loadingLinkedQuotes,
  activeInvoices,
  hasActiveInvoice,
  onShowInvoiceModal,
  onShowQuoteModal,
}: OrderInvoicingCardProps) {
  const showInvoicing = !readOnly && order.status !== 'cancelled';

  const showQuotes =
    showInvoicing && !linkedInvoices.some(inv => inv.status !== 'draft');

  return (
    <>
      {/* Card Facturation */}
      {showInvoicing && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-3 w-3" />
              Facturation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingLinkedInvoices ? (
              <ButtonV2 size="sm" className="w-full" disabled>
                <FileText className="h-3 w-3 mr-1 animate-pulse" />
                Chargement...
              </ButtonV2>
            ) : hasActiveInvoice ? (
              <div className="space-y-1">
                {activeInvoices.map(inv => (
                  <div
                    key={inv.id}
                    className="flex items-center gap-2 text-sm p-2 rounded border bg-muted/30"
                  >
                    <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    {inv.qonto_invoice_id ? (
                      <Link
                        href={`/factures/${inv.qonto_invoice_id}?type=invoice`}
                        target="_blank"
                        className="font-mono text-xs flex-1 text-blue-600 hover:underline"
                      >
                        {inv.document_number ?? inv.id.slice(0, 8)}
                      </Link>
                    ) : (
                      <span className="font-mono text-xs flex-1">
                        {inv.document_number ?? inv.id.slice(0, 8)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <ButtonV2
                size="sm"
                className="w-full"
                onClick={onShowInvoiceModal}
              >
                <FileText className="h-3 w-3 mr-1" />
                Générer facture
              </ButtonV2>
            )}
          </CardContent>
        </Card>
      )}

      {/* Card Devis */}
      {showQuotes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-3 w-3" />
              Devis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingLinkedQuotes ? (
              <ButtonV2 size="sm" className="w-full" disabled>
                <FileText className="h-3 w-3 mr-1 animate-pulse" />
                Chargement...
              </ButtonV2>
            ) : linkedQuotes.length > 0 ? (
              <div className="space-y-1">
                {linkedQuotes.map(q => (
                  <div
                    key={q.id}
                    className="flex items-center gap-2 text-sm p-2 rounded border bg-muted/30"
                  >
                    <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <Link
                      href={`/factures/devis/${q.id}`}
                      target="_blank"
                      className="font-mono text-xs flex-1 text-blue-600 hover:underline"
                    >
                      {q.quote_number}
                    </Link>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {q.status === 'draft'
                        ? 'Brouillon'
                        : q.status === 'finalized' ||
                            q.status === 'pending_approval'
                          ? 'En attente'
                          : q.status === 'accepted'
                            ? 'Accepté'
                            : q.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <ButtonV2 size="sm" className="w-full" onClick={onShowQuoteModal}>
                <FileText className="h-3 w-3 mr-1" />
                Créer un devis
              </ButtonV2>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
