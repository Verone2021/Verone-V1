'use client';

/**
 * InvoiceMobileCard — Carte mobile pour une facture
 *
 * Affiche les infos principales d'une facture sous forme de carte
 * pour les ecrans < md (< 768px). Inclut toutes les actions via InvoiceActions.
 *
 * HOOKS : aucun hook interne — composant pur basé sur props.
 */

import { Badge, Card, CardContent, CardFooter, OrganisationNameDisplay } from '@verone/ui';
import {
  Banknote,
  CheckCircle,
  Clock,
  ExternalLink,
  FileText,
} from 'lucide-react';

import {
  DocumentDiscordanceBadge,
  DocumentSourceBadge,
} from '@verone/finance/components';

import type { Invoice } from './types';
import { formatAmount, formatDate } from './types';
import { InvoiceStatusBadge } from './StatusBadges';
import { InvoiceActions } from './InvoiceActions';

export interface InvoiceMobileCardProps {
  invoice: Invoice;
  isDraft?: boolean;
  isArchived?: boolean;
  onView?: (id: string) => void;
  onDownloadPdf?: (invoice: Invoice) => void;
  onOpenOrder?: (orderId: string) => void;
  onOpenOrg?: (orgId: string) => void;
  onRapprochement?: (invoice: Invoice) => void;
  onArchive?: (invoice: Invoice) => Promise<void>;
  onUnarchive?: (invoice: Invoice) => Promise<void>;
  onFinalize?: (invoice: Invoice) => Promise<void>;
  onDelete?: (invoice: Invoice) => Promise<void>;
}

export function InvoiceMobileCard({
  invoice,
  isDraft = false,
  isArchived = false,
  onView,
  onDownloadPdf,
  onOpenOrder,
  onOpenOrg,
  onRapprochement,
  onArchive,
  onUnarchive,
  onFinalize,
  onDelete,
}: InvoiceMobileCardProps) {
  const isOverdue =
    new Date(invoice.due_date) < new Date() &&
    invoice.status !== 'paid' &&
    invoice.status !== 'canceled';

  return (
    <Card className="w-full">
      <CardContent className="pt-4 pb-2">
        {/* Ligne 1 : N° facture + montant */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="font-mono text-xs font-medium truncate">
              {invoice.number}
            </span>
            <DocumentSourceBadge hasOrderLink={!!invoice.sales_order_id} />
            {invoice.sales_order_id && invoice.order_number && (
              <button
                onClick={() => onOpenOrder?.(invoice.sales_order_id!)}
                className="text-[11px] text-muted-foreground hover:text-primary hover:underline text-left"
              >
                {invoice.order_number}
              </button>
            )}
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-1">
              <DocumentDiscordanceBadge
                localTotalTtcEuros={invoice.local_total_ttc}
                qontoTotalCents={invoice.total_amount_cents}
              />
              <span className="font-semibold text-sm">
                {formatAmount(
                  parseFloat(invoice.total_amount.value),
                  invoice.total_amount.currency
                )}
              </span>
            </div>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
        </div>

        {/* Ligne 2 : Client */}
        <div className="mb-2">
          {invoice.partner_id && invoice.partner_legal_name ? (
            <button
              onClick={() => onOpenOrg?.(invoice.partner_id!)}
              className="inline-flex items-center gap-1 text-left text-primary hover:underline cursor-pointer text-sm"
            >
              <OrganisationNameDisplay
                legalName={invoice.partner_legal_name}
                tradeName={invoice.partner_trade_name}
                variant="compact"
              />
              <ExternalLink className="h-3 w-3 opacity-60 shrink-0" />
            </button>
          ) : (
            <span className="text-sm text-muted-foreground">
              {invoice.client?.name ?? '-'}
            </span>
          )}
        </div>

        {/* Ligne 3 : Dates */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
          <span>
            <span className="font-medium">Emission :</span>{' '}
            {formatDate(invoice.issue_date)}
          </span>
          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
            <span className="font-medium">Echeance :</span>{' '}
            {formatDate(invoice.due_date)}
          </span>
        </div>

        {/* Ligne 4 : Paiement (si finalisee) */}
        {!isDraft && invoice.status !== 'canceled' && (
          <div className="mb-2">
            {invoice.status === 'paid' ? (
              <Badge
                variant="default"
                className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 w-fit"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Payee
              </Badge>
            ) : invoice.status !== 'draft' ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="text-amber-600 border-amber-200 w-fit"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Non payee
                </Badge>
                {onRapprochement && invoice.sales_order_id && (
                  <button
                    onClick={() => onRapprochement(invoice)}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    <Banknote className="h-3 w-3" />
                    Rapprocher
                  </button>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground text-xs">
                <FileText className="inline h-3 w-3 mr-1" />
                Brouillon
              </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 pb-3 flex justify-end">
        <InvoiceActions
          invoice={invoice}
          isDraft={isDraft}
          isArchived={isArchived}
          onView={onView}
          onDownloadPdf={onDownloadPdf}
          onOpenOrder={onOpenOrder}
          onOpenOrg={onOpenOrg}
          onRapprochement={onRapprochement}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
          onFinalize={onFinalize}
          onDelete={onDelete}
        />
      </CardFooter>
    </Card>
  );
}
