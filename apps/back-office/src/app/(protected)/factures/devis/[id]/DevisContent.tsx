'use client';

import Link from 'next/link';

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { Calendar } from 'lucide-react';

import type { QontoQuoteDetail } from './types';
import {
  formatDate,
  formatAmountCents,
  formatVatRate,
  computeQuoteTotals,
} from './helpers';

interface DevisContentProps {
  quote: QontoQuoteDetail;
}

export function DevisContent({ quote }: DevisContentProps) {
  const computedTotals = computeQuoteTotals(quote);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* LEFT COLUMN (2/3) */}
      <div className="space-y-6 lg:col-span-2">
        {/* CLIENT INFO */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Nom</p>
                <p className="font-medium">{quote.client?.name ?? '-'}</p>
              </div>
              {quote.client?.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{quote.client.email}</p>
                </div>
              )}
              {(quote.client?.tax_identification_number ??
                quote.client?.vat_number) && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {quote.client?.tax_identification_number
                      ? 'SIRET'
                      : 'N° TVA'}
                  </p>
                  <p className="font-medium">
                    {quote.client?.tax_identification_number ??
                      quote.client?.vat_number}
                  </p>
                </div>
              )}
              {(() => {
                const b = quote.client?.billing_address;
                const billingLine = b
                  ? [
                      b.street_address,
                      [b.zip_code, b.city].filter(Boolean).join(' '),
                      b.country_code,
                    ]
                      .filter(Boolean)
                      .join(', ')
                  : [
                      quote.client?.address,
                      [quote.client?.zip_code, quote.client?.city]
                        .filter(Boolean)
                        .join(' '),
                      quote.client?.country_code,
                    ]
                      .filter(Boolean)
                      .join(', ');

                const d = quote.client?.delivery_address;
                const deliveryLine = d
                  ? [
                      d.street_address,
                      [d.zip_code, d.city].filter(Boolean).join(' '),
                      d.country_code,
                    ]
                      .filter(Boolean)
                      .join(', ')
                  : '';

                const hasDifferentDelivery =
                  deliveryLine.length > 0 && deliveryLine !== billingLine;

                return (
                  <>
                    {billingLine && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Adresse de facturation
                        </p>
                        <p className="text-sm">{billingLine}</p>
                      </div>
                    )}
                    {hasDifferentDelivery && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Adresse de livraison
                        </p>
                        <p className="text-sm">{deliveryLine}</p>
                      </div>
                    )}
                  </>
                );
              })()}
              {quote.purchase_order_number && (
                <div>
                  <p className="text-sm text-muted-foreground">N° commande</p>
                  <p className="font-medium">{quote.purchase_order_number}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ITEMS TABLE */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">
                    Produit / Description
                  </TableHead>
                  <TableHead className="text-right">Qte</TableHead>
                  <TableHead className="text-right">Prix unit. HT</TableHead>
                  <TableHead className="text-right">TVA</TableHead>
                  <TableHead className="text-right">Total HT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Aucun article
                    </TableCell>
                  </TableRow>
                ) : (
                  quote.items.map((item, index) => (
                    <TableRow key={item.id ?? index}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity} {item.unit ?? ''}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.unit_price?.value}{' '}
                        {item.unit_price?.currency ?? quote.currency}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatVatRate(item.vat_rate)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(
                          parseFloat(item.quantity || '0') *
                          parseFloat(item.unit_price?.value || '0')
                        ).toFixed(2)}{' '}
                        {item.unit_price?.currency ?? quote.currency}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-medium">
                    Sous-total HT
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatAmountCents(
                      computedTotals.subtotalCents,
                      quote.currency
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-medium">
                    TVA
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAmountCents(computedTotals.vatCents, quote.currency)}
                  </TableCell>
                </TableRow>
                <TableRow className="font-bold">
                  <TableCell colSpan={4} className="text-right">
                    Total TTC
                  </TableCell>
                  <TableCell className="text-right text-lg">
                    {formatAmountCents(
                      computedTotals.totalCents,
                      quote.currency
                    )}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>

        {/* NOTES / HEADER / FOOTER */}
        {(quote.header ?? quote.footer ?? quote.terms_and_conditions) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mentions & conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quote.header && (
                <div>
                  <p className="text-sm text-muted-foreground">En-tete</p>
                  <p className="whitespace-pre-wrap text-sm">{quote.header}</p>
                </div>
              )}
              {quote.footer && (
                <div>
                  <p className="text-sm text-muted-foreground">Pied de page</p>
                  <p className="whitespace-pre-wrap text-sm">{quote.footer}</p>
                </div>
              )}
              {quote.terms_and_conditions && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Conditions generales
                  </p>
                  <p className="whitespace-pre-wrap text-sm">
                    {quote.terms_and_conditions}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* RIGHT COLUMN (1/3) */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">N° Devis</p>
              <p className="font-medium">
                {quote.number ?? quote.quote_number ?? '-'}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">
                <Calendar className="mr-1 inline h-3 w-3" />
                Date d&apos;emission
              </p>
              <p className="font-medium">{formatDate(quote.issue_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                <Calendar className="mr-1 inline h-3 w-3" />
                Date d&apos;expiration
              </p>
              <p className="font-medium">{formatDate(quote.expiry_date)}</p>
            </div>
            {quote.finalized_at && (
              <div>
                <p className="text-sm text-muted-foreground">Finalise le</p>
                <p className="font-medium">{formatDate(quote.finalized_at)}</p>
              </div>
            )}
            {quote.accepted_at && (
              <div>
                <p className="text-sm text-muted-foreground">Accepte le</p>
                <p className="font-medium">{formatDate(quote.accepted_at)}</p>
              </div>
            )}
            {quote.declined_at && (
              <div>
                <p className="text-sm text-muted-foreground">Refuse le</p>
                <p className="font-medium">{formatDate(quote.declined_at)}</p>
              </div>
            )}
            <Separator />
            {quote.converted_to_invoice_id && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Converti en facture
                </p>
                <Link
                  href={`/factures/${quote.converted_to_invoice_id}?type=invoice`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Voir la facture
                </Link>
              </div>
            )}
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total HT</span>
                <span>
                  {formatAmountCents(
                    computedTotals.subtotalCents,
                    quote.currency
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TVA</span>
                <span>
                  {formatAmountCents(computedTotals.vatCents, quote.currency)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total TTC</span>
                <span>
                  {formatAmountCents(computedTotals.totalCents, quote.currency)}
                </span>
              </div>
            </div>
            {quote.converted_to_invoice_id && (
              <Badge
                variant="outline"
                className="text-xs w-full justify-center"
              >
                Converti en facture
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
