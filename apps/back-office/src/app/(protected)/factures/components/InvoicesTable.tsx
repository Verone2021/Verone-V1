'use client';

import Link from 'next/link';
import {
  Badge,
  Button,
  OrganisationNameDisplay,
  ResponsiveDataTable,
} from '@verone/ui';
import type { ResponsiveColumn } from '@verone/ui';
import {
  Archive,
  ArchiveRestore,
  Banknote,
  CheckCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  ExternalLink,
  FileText,
  Pencil,
  Trash2,
} from 'lucide-react';

import {
  DocumentDiscordanceBadge,
  DocumentSourceBadge,
} from '@verone/finance/components';

import type { Invoice } from './types';
import { formatAmount, formatDate } from './types';
import { InvoiceStatusBadge } from './StatusBadges';

interface InvoicesTableProps {
  invoices: Invoice[];
  loading: boolean;
  onView: (id: string) => void;
  onDownloadPdf: (invoice: Invoice) => void;
  isArchived?: boolean;
  isDraft?: boolean;
  onArchive?: (invoice: Invoice) => Promise<void>;
  onUnarchive?: (invoice: Invoice) => Promise<void>;
  onFinalize?: (invoice: Invoice) => Promise<void>;
  onOpenOrder?: (orderId: string) => void;
  onRapprochement?: (invoice: Invoice) => void;
  onOpenOrg?: (orgId: string) => void;
  onDelete?: (invoice: Invoice) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Column definitions (module-level constant — avoids recreating on each render)
// ---------------------------------------------------------------------------

function buildColumns(
  onOpenOrder: ((orderId: string) => void) | undefined,
  onOpenOrg: ((orgId: string) => void) | undefined,
  onRapprochement: ((invoice: Invoice) => void) | undefined
): ResponsiveColumn<Invoice>[] {
  return [
    {
      id: 'number',
      header: 'N° Facture',
      width: 110,
      cell: invoice => (
        <div>
          <div className="font-mono text-xs">{invoice.number}</div>
          <div className="mt-1">
            <DocumentSourceBadge hasOrderLink={!!invoice.sales_order_id} />
          </div>
          {invoice.sales_order_id && invoice.order_number && (
            <button
              onClick={() => onOpenOrder?.(invoice.sales_order_id!)}
              className="text-[11px] text-muted-foreground hover:text-primary hover:underline mt-0.5 block"
            >
              {invoice.order_number}
            </button>
          )}
        </div>
      ),
    },
    {
      id: 'client',
      header: 'Client',
      minWidth: 180,
      cell: invoice =>
        invoice.partner_id && invoice.partner_legal_name ? (
          <button
            onClick={() => onOpenOrg?.(invoice.partner_id!)}
            className="inline-flex items-center gap-1 text-left text-primary hover:underline cursor-pointer"
          >
            <OrganisationNameDisplay
              legalName={invoice.partner_legal_name}
              tradeName={invoice.partner_trade_name}
              variant="compact"
            />
            <ExternalLink className="h-3 w-3 opacity-60" />
          </button>
        ) : (
          <span>{invoice.client?.name ?? '-'}</span>
        ),
    },
    {
      id: 'issue_date',
      header: 'Date',
      width: 90,
      hideBelow: 'xl',
      cell: invoice => formatDate(invoice.issue_date),
    },
    {
      id: 'due_date',
      header: 'Échéance',
      width: 90,
      hideBelow: 'lg',
      cell: invoice => (
        <span
          className={
            new Date(invoice.due_date) < new Date() &&
            invoice.status !== 'paid' &&
            invoice.status !== 'canceled'
              ? 'text-red-600 font-medium'
              : ''
          }
        >
          {formatDate(invoice.due_date)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Statut',
      width: 100,
      cell: invoice => <InvoiceStatusBadge status={invoice.status} />,
    },
    {
      id: 'payment',
      header: 'Paiement',
      width: 130,
      hideBelow: 'lg',
      cell: invoice =>
        invoice.status !== 'draft' && invoice.status !== 'canceled' ? (
          <div className="flex flex-col gap-1">
            {invoice.status === 'paid' ? (
              <Badge
                variant="default"
                className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 w-fit"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Payee
              </Badge>
            ) : (
              <>
                <Badge
                  variant="outline"
                  className="text-amber-600 border-amber-200 w-fit"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Non payee
                </Badge>
                {onRapprochement && invoice.sales_order_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-fit"
                    onClick={() => onRapprochement(invoice)}
                    title="Rapprocher avec une transaction"
                  >
                    <Banknote className="h-3 w-3 mr-1" />
                    Rapprocher
                  </Button>
                )}
              </>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        ),
    },
    {
      id: 'amount',
      header: 'Montant',
      width: 110,
      align: 'right',
      cell: invoice => (
        <div className="flex items-center justify-end gap-2">
          <DocumentDiscordanceBadge
            localTotalTtcEuros={invoice.local_total_ttc}
            qontoTotalCents={invoice.total_amount_cents}
          />
          <span className="font-medium">
            {formatAmount(
              parseFloat(invoice.total_amount.value),
              invoice.total_amount.currency
            )}
          </span>
        </div>
      ),
    },
  ];
}

// ---------------------------------------------------------------------------
// Actions renderer
// ---------------------------------------------------------------------------

function renderActions(
  invoice: Invoice,
  isDraft: boolean | undefined,
  isArchived: boolean | undefined,
  onDownloadPdf: (invoice: Invoice) => void,
  onArchive: ((invoice: Invoice) => Promise<void>) | undefined,
  onUnarchive: ((invoice: Invoice) => Promise<void>) | undefined,
  onFinalize: ((invoice: Invoice) => Promise<void>) | undefined,
  onDelete: ((invoice: Invoice) => Promise<void>) | undefined
): React.ReactNode {
  return (
    <div className="flex gap-0.5 justify-end">
      {/* Draft actions: Edit + Delete + Finalize */}
      {isDraft && (
        <>
          <Button variant="ghost" size="icon" asChild>
            <Link
              href={`/factures/${invoice.id}/edit?type=invoice`}
              title="Modifier le brouillon"
            >
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void onDelete(invoice)}
              title="Supprimer le brouillon"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {onFinalize && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void onFinalize(invoice)}
              title="Finaliser"
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
        </>
      )}
      {/* Non-draft: View detail */}
      {!isDraft && (
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/factures/${invoice.id}?type=invoice`} title="Voir">
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      )}
      {/* Finalized: PDF actions */}
      {!isDraft && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              window.open(`/api/qonto/invoices/${invoice.id}/pdf`, '_blank')
            }
            title="Voir PDF"
            className="text-primary hover:text-primary hover:bg-primary/10"
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDownloadPdf(invoice)}
            title="Telecharger PDF"
          >
            <Download className="h-4 w-4" />
          </Button>
        </>
      )}
      {/* Archive action */}
      {!isArchived && !isDraft && onArchive && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void onArchive(invoice)}
          title="Archiver"
        >
          <Archive className="h-4 w-4" />
        </Button>
      )}
      {isArchived && onUnarchive && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void onUnarchive(invoice)}
          title="Desarchiver"
        >
          <ArchiveRestore className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function InvoicesTable({
  invoices,
  loading,
  onView: _onView,
  onDownloadPdf,
  isArchived,
  isDraft,
  onArchive,
  onUnarchive,
  onFinalize,
  onOpenOrder,
  onRapprochement,
  onOpenOrg,
  onDelete,
}: InvoicesTableProps) {
  const columns = buildColumns(onOpenOrder, onOpenOrg, onRapprochement);

  const emptyState = (
    <div className="text-center py-4 text-muted-foreground">
      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>Aucune facture trouvee</p>
      <p className="text-sm">
        Cliquez sur &quot;Nouvelle facture&quot; pour en creer une
      </p>
    </div>
  );

  return (
    <ResponsiveDataTable<Invoice>
      columns={columns}
      data={invoices}
      rowKey={invoice => invoice.id}
      actions={invoice =>
        renderActions(
          invoice,
          isDraft,
          isArchived,
          onDownloadPdf,
          onArchive,
          onUnarchive,
          onFinalize,
          onDelete
        )
      }
      actionsWidth={150}
      loading={loading}
      skeletonRows={3}
      emptyState={emptyState}
      density="compact"
    />
  );
}
