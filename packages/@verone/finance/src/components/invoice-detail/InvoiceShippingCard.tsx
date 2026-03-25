'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Truck } from 'lucide-react';

import type { InvoiceDetail } from './types';
import { formatAddress } from './utils';

interface InvoiceShippingCardProps {
  invoice: InvoiceDetail;
}

export function InvoiceShippingCard({
  invoice,
}: InvoiceShippingCardProps): React.ReactNode {
  const shippingAddress =
    invoice.shipping_address ?? invoice.sales_order?.shipping_address;

  if (!shippingAddress) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Truck className="h-4 w-4" />
          Adresse de livraison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{formatAddress(shippingAddress)}</p>
      </CardContent>
    </Card>
  );
}
