'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import {
  ArrowRight,
  FileSignature,
  FileText,
  FileX,
  Truck,
} from 'lucide-react';

import type { InvoiceDetail } from './types';
import { formatAmount } from './utils';

interface InvoiceRelatedDocsProps {
  invoice: InvoiceDetail;
}

export function InvoiceRelatedDocs({
  invoice,
}: InvoiceRelatedDocsProps): React.ReactNode {
  const hasRelatedDocs =
    (invoice.related_credit_notes && invoice.related_credit_notes.length > 0) ??
    invoice.source_quote ??
    invoice.sales_order;

  if (!hasRelatedDocs) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Documents lies
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Devis source */}
        {invoice.source_quote && (
          <div className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
            <div className="flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-blue-500" />
              <span>Creee depuis devis</span>
              <span className="font-medium">
                {invoice.source_quote.quote_number}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() =>
                window.open(`/devis/${invoice.source_quote!.id}`, '_blank')
              }
            >
              Voir le devis
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Commande liee */}
        {invoice.sales_order && (
          <div className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-green-500" />
              <span>Commande liee</span>
              <span className="font-medium">
                {invoice.sales_order.order_number}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() =>
                window.open(
                  `/commandes/clients/${invoice.sales_order_id}`,
                  '_blank'
                )
              }
            >
              Voir la commande
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Avoirs lies */}
        {invoice.related_credit_notes?.map(creditNote => (
          <div
            key={creditNote.id}
            className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <FileX className="h-4 w-4 text-red-500" />
              <span>Avoir</span>
              <span className="font-medium">
                {creditNote.credit_note_number}
              </span>
              <Badge variant="outline" className="text-xs">
                {formatAmount(creditNote.total_ttc)}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => window.open(`/avoirs/${creditNote.id}`, '_blank')}
            >
              Voir l avoir
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
