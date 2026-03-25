'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  OrganisationNameDisplay,
} from '@verone/ui';
import { Building2, MapPin } from 'lucide-react';

import type { InvoiceDetail } from './types';
import { formatAddress } from './utils';

interface InvoiceClientCardProps {
  invoice: InvoiceDetail;
}

export function InvoiceClientCard({
  invoice,
}: InvoiceClientCardProps): React.ReactNode {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Client
        </CardTitle>
      </CardHeader>
      <CardContent>
        {invoice.partner ? (
          <div className="space-y-3">
            <OrganisationNameDisplay
              legalName={invoice.partner.legal_name ?? 'Client sans nom'}
              tradeName={invoice.partner.trade_name}
            />

            <div className="grid grid-cols-2 gap-4 text-sm">
              {invoice.partner.siret && (
                <div>
                  <p className="text-muted-foreground">SIRET</p>
                  <p className="font-mono">{invoice.partner.siret}</p>
                </div>
              )}
              {invoice.partner.vat_number && (
                <div>
                  <p className="text-muted-foreground">N TVA</p>
                  <p className="font-mono">{invoice.partner.vat_number}</p>
                </div>
              )}
              {invoice.partner.email && (
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p>{invoice.partner.email}</p>
                </div>
              )}
              {invoice.partner.phone && (
                <div>
                  <p className="text-muted-foreground">Telephone</p>
                  <p>{invoice.partner.phone}</p>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 pt-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground text-sm">
                  Adresse de facturation
                </p>
                <p className="text-sm">
                  {formatAddress(
                    invoice.billing_address ?? invoice.partner.billing_address
                  )}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Aucun client associe</p>
        )}
      </CardContent>
    </Card>
  );
}
