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
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Download,
  ExternalLink,
  Eye,
  FileEdit,
  Loader2,
  Send,
  Trash2,
} from 'lucide-react';

import {
  formatAmount,
  formatDate,
  parseItemQuantity,
  parseItemUnitPrice,
  parseQontoAmount,
  calcSubtotalFromItems,
  calcVatFromItems,
} from './quote-helpers';
import type { Quote, QuoteItem } from './quote-types';

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

export function StatusBadge({ status }: { status: string }): React.ReactNode {
  const variants: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    draft: 'secondary',
    pending_approval: 'secondary', // Qonto uses this for drafts
    finalized: 'default',
    accepted: 'default',
    declined: 'destructive',
    expired: 'outline',
  };

  const labels: Record<string, string> = {
    draft: 'Brouillon',
    pending_approval: 'Brouillon', // Qonto uses this for drafts
    finalized: 'Finalisé',
    accepted: 'Accepté',
    declined: 'Refusé',
    expired: 'Expiré',
  };

  return (
    <Badge variant={variants[status] ?? 'outline'}>
      {labels[status] ?? status}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// QuoteHeader
// ---------------------------------------------------------------------------

interface QuoteHeaderProps {
  quote: Quote;
  onBack: () => void;
}

export function QuoteHeader({
  quote,
  onBack,
}: QuoteHeaderProps): React.ReactNode {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <FileEdit className="h-6 w-6" />
            Devis {quote.quote_number}
          </h1>
          <p className="text-muted-foreground">
            {quote.client?.name} - {formatDate(quote.issue_date)}
          </p>
        </div>
      </div>
      <StatusBadge status={quote.status} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// QuoteActions
// ---------------------------------------------------------------------------

interface QuoteActionsProps {
  quoteId: string;
  quote: Quote;
  canFinalize: boolean;
  canDelete: boolean;
  canConvert: boolean;
  actionLoading: boolean;
  onFinalizeClick: () => void;
  onDeleteClick: () => void;
  onConvertClick: () => void;
  onDownloadPdf: () => void;
}

export function QuoteActions({
  quoteId,
  quote,
  canFinalize,
  canDelete,
  canConvert,
  actionLoading,
  onFinalizeClick,
  onDeleteClick,
  onConvertClick,
  onDownloadPdf,
}: QuoteActionsProps): React.ReactNode {
  return (
    <div className="flex gap-2">
      <Button
        variant="default"
        onClick={() =>
          window.open(`/api/qonto/quotes/${quoteId}/view`, '_blank')
        }
      >
        <Eye className="mr-2 h-4 w-4" />
        Voir PDF
      </Button>
      <Button variant="outline" onClick={onDownloadPdf}>
        <Download className="mr-2 h-4 w-4" />
        Télécharger PDF
      </Button>
      {canFinalize && (
        <Button onClick={onFinalizeClick} disabled={actionLoading}>
          {actionLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Envoyer au client
        </Button>
      )}
      {canConvert && (
        <Button
          variant="default"
          onClick={onConvertClick}
          disabled={actionLoading}
        >
          <ArrowRight className="mr-2 h-4 w-4" />
          Convertir en facture
        </Button>
      )}
      {canDelete && (
        <Button
          variant="outline"
          onClick={onDeleteClick}
          disabled={actionLoading}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </Button>
      )}
      {quote.public_url && (
        <Button variant="outline" asChild>
          <a href={quote.public_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Voir sur Qonto
          </a>
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// QuoteNotices
// ---------------------------------------------------------------------------

interface QuoteNoticesProps {
  quote: Quote;
  isDraft: boolean;
  isFinalized: boolean;
  onNavigateToInvoice: (invoiceId: string) => void;
}

export function QuoteNotices({
  quote,
  isDraft,
  isFinalized,
  onNavigateToInvoice,
}: QuoteNoticesProps): React.ReactNode {
  return (
    <>
      {isDraft && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
          <div>
            <p className="font-medium text-blue-800">
              Ce devis est en brouillon
            </p>
            <p className="mt-1 text-sm text-blue-700">
              Vous pouvez télécharger le PDF à tout moment. Pour convertir ce
              devis en facture, vous devez d&apos;abord l&apos;envoyer au
              client.
            </p>
          </div>
        </div>
      )}
      {isFinalized && !quote.converted_to_invoice_id && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
          <div>
            <p className="font-medium text-green-800">
              Devis finalisé - PDF disponible
            </p>
            <p className="mt-1 text-sm text-green-700">
              Vous pouvez télécharger le PDF et le partager avec votre client.
              {quote.status === 'finalized' &&
                ' Si le client accepte, vous pouvez convertir ce devis en facture.'}
            </p>
          </div>
        </div>
      )}
      {quote.converted_to_invoice_id && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-green-800">
            Ce devis a été converti en facture.{' '}
            <Button
              variant="ghost"
              className="h-auto p-0 text-green-800 underline"
              onClick={() =>
                onNavigateToInvoice(quote.converted_to_invoice_id!)
              }
            >
              Voir la facture
            </Button>
          </p>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// QuoteItemRow
// ---------------------------------------------------------------------------

function QuoteItemRow({
  item,
  index,
}: {
  item: QuoteItem;
  index: number;
}): React.ReactNode {
  const qty = parseItemQuantity(item.quantity);
  const vatRate =
    typeof item.vat_rate === 'string'
      ? parseFloat(item.vat_rate)
      : item.vat_rate;
  const unitPrice = parseItemUnitPrice(item.unit_price);
  const totalHT = qty * unitPrice;
  const vatPercent = vatRate < 1 ? vatRate * 100 : vatRate;

  return (
    <tr key={index} className="border-b last:border-0 hover:bg-muted/50">
      <td className="py-4">
        <p className="font-medium">{item.title}</p>
        {item.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {item.description}
          </p>
        )}
        {item.unit && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Unité: {item.unit}
          </p>
        )}
      </td>
      <td className="py-4 text-right tabular-nums">{qty}</td>
      <td className="py-4 text-right tabular-nums">
        {formatAmount(unitPrice)}
      </td>
      <td className="py-4 text-right tabular-nums">{vatPercent.toFixed(0)}%</td>
      <td className="py-4 text-right font-medium tabular-nums">
        {formatAmount(totalHT)}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// QuoteItemsTable
// ---------------------------------------------------------------------------

interface QuoteItemsTableProps {
  quote: Quote;
}

export function QuoteItemsTable({
  quote,
}: QuoteItemsTableProps): React.ReactNode {
  const hasItems = quote.items && quote.items.length > 0;

  if (!hasItems) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Aucun article dans ce devis.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Articles ({quote.items!.length} ligne
          {quote.items!.length > 1 ? 's' : ''})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">Article</th>
                <th className="pb-3 text-right font-medium">Qté</th>
                <th className="pb-3 text-right font-medium">Prix HT</th>
                <th className="pb-3 text-right font-medium">TVA</th>
                <th className="pb-3 text-right font-medium">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {quote.items!.map((item, index) => (
                <QuoteItemRow key={index} item={item} index={index} />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// QuoteInfo
// ---------------------------------------------------------------------------

interface QuoteInfoProps {
  quote: Quote;
}

export function QuoteInfo({ quote }: QuoteInfoProps): React.ReactNode {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Client</p>
          <p className="font-medium">{quote.client?.name}</p>
          {quote.client?.email && (
            <p className="text-sm text-muted-foreground">
              {quote.client.email}
            </p>
          )}
          {quote.client?.billing_address && (
            <div className="mt-2 text-sm text-muted-foreground">
              {quote.client.billing_address.street_address && (
                <p>{quote.client.billing_address.street_address}</p>
              )}
              {(quote.client.billing_address.zip_code ??
                quote.client.billing_address.city) && (
                <p>
                  {quote.client.billing_address.zip_code}{' '}
                  {quote.client.billing_address.city}
                </p>
              )}
              {quote.client.billing_address.country_code && (
                <p>{quote.client.billing_address.country_code}</p>
              )}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Date d&apos;émission</p>
          <p className="font-medium">{formatDate(quote.issue_date)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            Date d&apos;expiration
          </p>
          <p className="font-medium">{formatDate(quote.expiry_date)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// QuoteAmounts
// ---------------------------------------------------------------------------

interface QuoteAmountsProps {
  quote: Quote;
}

export function QuoteAmounts({ quote }: QuoteAmountsProps): React.ReactNode {
  // Calculer les montants à partir des items si l'API ne les retourne pas
  let subtotalHT = parseQontoAmount(
    quote.subtotal_amount,
    quote.subtotal_amount_cents
  );
  let totalVAT = parseQontoAmount(
    quote.total_vat_amount,
    quote.total_vat_amount_cents
  );
  const totalTTC = parseQontoAmount(
    quote.total_amount,
    quote.total_amount_cents
  );

  // Si subtotal est 0 mais qu'on a des items, calculer depuis les items
  if (subtotalHT === 0 && quote.items && quote.items.length > 0) {
    subtotalHT = calcSubtotalFromItems(quote.items);
  }

  // Calculer la TVA si elle est 0
  if (totalVAT === 0 && quote.items && quote.items.length > 0) {
    totalVAT = calcVatFromItems(quote.items);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Montants</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Sous-total HT</span>
          <span className="tabular-nums">{formatAmount(subtotalHT)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">TVA</span>
          <span className="tabular-nums">{formatAmount(totalVAT)}</span>
        </div>
        <div className="flex justify-between border-t pt-2 text-lg font-bold">
          <span>Total TTC</span>
          <span className="tabular-nums">
            {formatAmount(totalTTC > 0 ? totalTTC : subtotalHT + totalVAT)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
