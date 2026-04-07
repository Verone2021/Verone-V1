'use client';

import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
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
import { StatusPill, qontoInvoiceStatusConfig } from '@verone/ui-business';
import { FileText } from 'lucide-react';

import {
  type DocumentType,
  type QontoDocument,
  formatDate,
  formatAmount,
  formatVatRate,
  getDocumentTypeLabel,
  InfoRow,
} from './types';

interface DocumentDetailMainProps {
  document: QontoDocument;
  documentType: DocumentType;
  docNumber: string;
  isOverdue: string | boolean | null | undefined;
  computedTotals: {
    subtotalCents: number;
    vatCents: number;
    totalCents: number;
  };
}

export function DocumentDetailMain({
  document,
  documentType,
  docNumber,
  isOverdue,
  computedTotals,
}: DocumentDetailMainProps) {
  return (
    <div className="lg:col-span-2 space-y-6">
      {/* Document info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informations {getDocumentTypeLabel(documentType).toLowerCase()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8">
            <div>
              <InfoRow label="Numéro">{docNumber}</InfoRow>
              <InfoRow label="Statut">
                <StatusPill
                  status={document.status}
                  config={qontoInvoiceStatusConfig}
                  size="sm"
                />
              </InfoRow>
              <InfoRow label="Date d'émission">
                {formatDate(document.issue_date)}
              </InfoRow>
              {documentType === 'invoice' && document.payment_deadline && (
                <InfoRow label="Échéance">
                  <span className={isOverdue ? 'text-red-600' : ''}>
                    {formatDate(document.payment_deadline)}
                  </span>
                </InfoRow>
              )}
              {documentType === 'quote' && document.expiry_date && (
                <InfoRow label="Validité">
                  {formatDate(document.expiry_date)}
                </InfoRow>
              )}
              {documentType === 'credit_note' && document.invoice_id && (
                <InfoRow label="Facture liée">
                  <Link
                    href={`/factures/${document.invoice_id}?type=invoice`}
                    className="text-primary hover:underline"
                  >
                    Voir la facture
                  </Link>
                </InfoRow>
              )}
            </div>
            <div>
              <InfoRow label="Montant HT">
                {formatAmount(computedTotals.subtotalCents, document.currency)}
              </InfoRow>
              <InfoRow label="Montant TVA">
                {formatAmount(computedTotals.vatCents, document.currency)}
              </InfoRow>
              <InfoRow label="Montant TTC">
                <span className="font-bold">
                  {formatAmount(
                    documentType === 'credit_note'
                      ? Math.abs(computedTotals.totalCents)
                      : computedTotals.totalCents,
                    document.currency
                  )}
                </span>
              </InfoRow>
            </div>
          </div>

          {document.reason && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-sm text-slate-600 mb-1">
                  Motif de l&apos;avoir
                </p>
                <p className="text-sm">{document.reason}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Items table */}
      {document.items && document.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lignes</CardTitle>
            <CardDescription>
              {document.items.length} ligne
              {document.items.length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qté</TableHead>
                  <TableHead className="text-right">P.U. HT</TableHead>
                  <TableHead className="text-right">TVA</TableHead>
                  <TableHead className="text-right">Total HT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {document.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity} {item.unit ?? ''}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.unit_price?.value} {item.unit_price?.currency}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatVatRate(item.vat_rate)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {(
                        parseFloat(item.quantity || '0') *
                        parseFloat(item.unit_price?.value || '0')
                      ).toFixed(2)}{' '}
                      {item.unit_price?.currency ?? document.currency}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-medium">
                    Sous-total HT
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatAmount(
                      computedTotals.subtotalCents,
                      document.currency
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-medium">
                    TVA
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatAmount(computedTotals.vatCents, document.currency)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-right font-semibold text-base"
                  >
                    Total TTC
                  </TableCell>
                  <TableCell className="text-right font-bold text-base">
                    {formatAmount(computedTotals.totalCents, document.currency)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
