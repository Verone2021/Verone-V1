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
  const billingAddr = order.billing_address;
  const org = order.organisations;
  const billingLine1 =
    billingAddr?.address_line1 ??
    org?.billing_address_line1 ??
    org?.address_line1;
  const billingCity = billingAddr?.city ?? org?.billing_city ?? org?.city;
  const billingPostal =
    billingAddr?.postal_code ?? org?.billing_postal_code ?? org?.postal_code;

  const shipAddr = order.shipping_address;
  const hasShipping = org?.has_different_shipping_address;
  const shippingLine1 =
    shipAddr?.address_line1 ??
    (hasShipping ? org?.shipping_address_line1 : null);
  const shippingCity =
    shipAddr?.city ?? (hasShipping ? org?.shipping_city : null);
  const shippingPostal =
    shipAddr?.postal_code ?? (hasShipping ? org?.shipping_postal_code : null);

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

        {(billingLine1 ?? billingCity) && (
          <div className="text-xs text-muted-foreground border-t pt-2 mt-1">
            <p className="font-medium text-foreground text-xs mb-0.5">
              Adresse de facturation
            </p>
            {billingLine1 && <p>{billingLine1}</p>}
            {(billingPostal ?? billingCity) && (
              <p>{[billingPostal, billingCity].filter(Boolean).join(' ')}</p>
            )}
          </div>
        )}

        {(shippingLine1 ?? shippingCity) && (
          <div className="text-xs text-muted-foreground border-t pt-2 mt-1">
            <p className="font-medium text-foreground text-xs mb-0.5">
              Adresse de livraison
            </p>
            {shippingLine1 && <p>{shippingLine1}</p>}
            {(shippingPostal ?? shippingCity) && (
              <p>{[shippingPostal, shippingCity].filter(Boolean).join(' ')}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
