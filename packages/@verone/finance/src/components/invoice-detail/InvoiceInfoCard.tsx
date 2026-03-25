'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Calendar } from 'lucide-react';

import type { InvoiceDetail } from './types';
import { formatDate } from './utils';

interface InvoiceInfoCardProps {
  invoice: InvoiceDetail;
}

export function InvoiceInfoCard({
  invoice,
}: InvoiceInfoCardProps): React.ReactNode {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Informations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Date de facture</p>
            <p className="font-medium">{formatDate(invoice.document_date)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Date d echeance</p>
            <p className="font-medium">{formatDate(invoice.due_date)}</p>
          </div>
          {invoice.payment_terms && (
            <div>
              <p className="text-muted-foreground">Conditions de paiement</p>
              <p className="font-medium">{invoice.payment_terms}</p>
            </div>
          )}
          {invoice.sales_order && (
            <div>
              <p className="text-muted-foreground">Commande liee</p>
              <p className="font-medium">{invoice.sales_order.order_number}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
