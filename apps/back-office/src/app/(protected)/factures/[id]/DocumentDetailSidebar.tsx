'use client';

import Link from 'next/link';

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  OrganisationNameDisplay,
} from '@verone/ui';
import { StatusPill, qontoInvoiceStatusConfig } from '@verone/ui-business';
import { Building2, ExternalLink, ShoppingCart } from 'lucide-react';

import {
  type DocumentType,
  type QontoDocument,
  formatDate,
  formatAmount,
  isTechnicalEmail,
} from './types';

interface DocumentDetailSidebarProps {
  document: QontoDocument;
  documentType: DocumentType;
  orderLink: { sales_order_id: string; order_number: string | null } | null;
  organisationId: string | null;
  partnerLegalName: string | null;
  partnerTradeName: string | null;
  onShowOrgModal: () => void;
}

export function DocumentDetailSidebar({
  document,
  documentType,
  orderLink,
  organisationId,
  partnerLegalName,
  partnerTradeName,
  onShowOrgModal,
}: DocumentDetailSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Client info */}
      {document.client && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {organisationId ? (
                <button
                  type="button"
                  onClick={onShowOrgModal}
                  className="text-primary hover:underline text-left"
                >
                  {partnerLegalName ? (
                    <OrganisationNameDisplay
                      legalName={partnerLegalName}
                      tradeName={partnerTradeName}
                    />
                  ) : (
                    <p className="font-medium">{document.client.name}</p>
                  )}
                </button>
              ) : (
                <p className="font-medium">{document.client.name}</p>
              )}
              {document.client.email &&
                !isTechnicalEmail(document.client.email) && (
                  <p className="text-sm text-slate-600">
                    {document.client.email}
                  </p>
                )}
              {document.client.billing_address && (
                <div className="text-sm text-slate-600">
                  {document.client.billing_address.street_address && (
                    <p>{document.client.billing_address.street_address}</p>
                  )}
                  <p>
                    {document.client.billing_address.zip_code}{' '}
                    {document.client.billing_address.city}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment summary (invoices only) */}
      {documentType === 'invoice' && (
        <Card>
          <CardHeader>
            <CardTitle>Paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total TTC</span>
              <span className="font-bold">
                {formatAmount(document.total_amount_cents, document.currency)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Statut</span>
              <StatusPill
                status={document.status}
                config={qontoInvoiceStatusConfig}
                size="sm"
              />
            </div>
            {document.paid_at && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Payée le</span>
                <span className="text-green-600 font-medium">
                  {formatDate(document.paid_at)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Commande liée (invoices only) */}
      {documentType === 'invoice' && orderLink && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Commande liée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={`/commandes/clients?id=${orderLink.sales_order_id}`}>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-muted"
              >
                {orderLink.order_number ?? orderLink.sales_order_id}
              </Badge>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Related invoice (credit notes) */}
      {documentType === 'credit_note' && document.invoice_id && (
        <Card>
          <CardHeader>
            <CardTitle>Facture d&apos;origine</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/factures/${document.invoice_id}?type=invoice`}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Voir la facture
              <ExternalLink className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Converted invoice (quotes) */}
      {documentType === 'quote' && document.converted_to_invoice_id && (
        <Card>
          <CardHeader>
            <CardTitle>Facture créée</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/factures/${document.converted_to_invoice_id}?type=invoice`}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Voir la facture
              <ExternalLink className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Métadonnées</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-slate-500 space-y-1">
          <p>Créé le {formatDate(document.created_at)}</p>
          <p>Modifié le {formatDate(document.updated_at)}</p>
          {document.finalized_at && (
            <p>Finalisé le {formatDate(document.finalized_at)}</p>
          )}
          <p className="font-mono text-[10px] text-slate-400 mt-2">
            ID: {document.id}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
