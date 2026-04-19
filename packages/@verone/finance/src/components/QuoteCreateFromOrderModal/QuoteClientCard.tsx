'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';

import type { IOrderForDocument } from '../OrderSelectModal';

interface IQuoteClientCardProps {
  order: IOrderForDocument;
  customerName: string;
}

export function QuoteClientCard({
  order,
  customerName,
}: IQuoteClientCardProps): React.ReactNode {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Client</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <p className="font-medium">{customerName}</p>
          <p className="text-sm text-muted-foreground">
            {order.organisations?.email ?? order.individual_customers?.email}
          </p>
          {order.organisations?.siret && (
            <p className="text-xs text-muted-foreground font-mono">
              SIRET : {order.organisations.siret}
            </p>
          )}
          {order.organisations?.vat_number && (
            <p className="text-xs text-muted-foreground font-mono">
              TVA : {order.organisations.vat_number}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
