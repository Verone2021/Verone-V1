'use client';

/**
 * InvoicesTable — Table factures responsive (T1 + T2 + T3 + T5)
 *
 * Technique T1 : ResponsiveDataView bascule table/cartes selon breakpoint md.
 * Technique T2 : Colonnes masquables progressivement (hidden lg/xl/2xl).
 * Technique T3 : Actions via InvoiceActions (ResponsiveActionMenu breakpoint lg).
 * Technique T5 : Largeurs fluides, colonne principale absorbe l'espace.
 *
 * HOOKS AUDIT :
 * - Aucun hook appele dans ce composant (zero useState/useEffect/useMemo).
 * - Les hooks sont dans les sous-composants InvoiceActions et InvoiceMobileCard.
 * - Aucun hook apres early return possible — ResponsiveDataView gere loading/empty.
 */

import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  OrganisationNameDisplay,
  ResponsiveDataView,
} from '@verone/ui';
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
import { InvoiceMobileCard } from './InvoiceMobileCard';

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

function InvoiceEmptyState() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>Aucune facture trouvee</p>
      <p className="text-sm">
        Cliquez sur &quot;Nouvelle facture&quot; pour en creer une
      </p>
    </div>
  );
}

function PaymentCell({
  invoice,
  isDraft,
  onRapprochement,
}: {
  invoice: Invoice;
  isDraft: boolean;
  onRapprochement?: (invoice: Invoice) => void;
}) {
  if (isDraft || invoice.status === 'canceled') {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  if (invoice.status === 'paid') {
    return (
      <Badge
        variant="default"
        className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 w-fit"
      >
        <CheckCircle className="h-3 w-3 mr-1" />
        Payee
      </Badge>
    );
  }

  return (
    <div className="flex flex-col gap-1">
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
    </div>
  );
}

export function InvoicesTable({
  invoices,
  loading,
  onView,
  onDownloadPdf,
  isArchived = false,
  isDraft = false,
  onArchive,
  onUnarchive,
  onFinalize,
  onOpenOrder,
  onRapprochement,
  onOpenOrg,
  onDelete,
}: InvoicesTableProps) {
  return (
    <ResponsiveDataView<Invoice>
      data={invoices}
      loading={loading}
      emptyMessage={<InvoiceEmptyState />}
      breakpoint="md"
      renderCard={(invoice) => (
        <InvoiceMobileCard
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
      )}
      renderTable={(items) => (
        /* T5 : overflow-x-auto + largeurs explicites, zero w-auto */
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {/* Toujours visible : identifiant */}
                <TableHead className="w-[160px]">N° Facture</TableHead>
                {/* Toujours visible : client (colonne principale, absorbe espace) */}
                <TableHead className="min-w-[180px]">Client</TableHead>
                {/* T2 : Date masquee sous lg */}
                <TableHead className="hidden lg:table-cell w-[110px]">
                  Date
                </TableHead>
                {/* T2 : Echeance masquee sous xl */}
                <TableHead className="hidden xl:table-cell w-[110px]">
                  Echeance
                </TableHead>
                {/* Toujours visible : statut */}
                <TableHead className="w-[120px]">Statut</TableHead>
                {/* T2 : Paiement masque sous lg */}
                <TableHead className="hidden lg:table-cell w-[140px]">
                  Paiement
                </TableHead>
                {/* Toujours visible : montant */}
                <TableHead className="text-right w-[120px]">Montant</TableHead>
                {/* Toujours visible : actions */}
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(invoice => {
                const isOverdue =
                  new Date(invoice.due_date) < new Date() &&
                  invoice.status !== 'paid' &&
                  invoice.status !== 'canceled';

                return (
                  <TableRow key={invoice.id}>
                    {/* N° Facture + badges source/commande */}
                    <TableCell>
                      <div className="font-mono text-xs">{invoice.number}</div>
                      <div className="mt-1">
                        <DocumentSourceBadge
                          hasOrderLink={!!invoice.sales_order_id}
                        />
                      </div>
                      {invoice.sales_order_id && invoice.order_number && (
                        <button
                          onClick={() =>
                            onOpenOrder?.(invoice.sales_order_id!)
                          }
                          className="text-[11px] text-muted-foreground hover:text-primary hover:underline mt-0.5 block"
                        >
                          {invoice.order_number}
                        </button>
                      )}
                    </TableCell>

                    {/* Client */}
                    <TableCell>
                      {invoice.partner_id && invoice.partner_legal_name ? (
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
                      )}
                    </TableCell>

                    {/* Date — T2 hidden lg */}
                    <TableCell className="hidden lg:table-cell">
                      {formatDate(invoice.issue_date)}
                    </TableCell>

                    {/* Echeance — T2 hidden xl */}
                    <TableCell className="hidden xl:table-cell">
                      <span
                        className={
                          isOverdue ? 'text-red-600 font-medium' : ''
                        }
                      >
                        {formatDate(invoice.due_date)}
                      </span>
                    </TableCell>

                    {/* Statut */}
                    <TableCell>
                      <InvoiceStatusBadge status={invoice.status} />
                    </TableCell>

                    {/* Paiement — T2 hidden lg */}
                    <TableCell className="hidden lg:table-cell">
                      <PaymentCell
                        invoice={invoice}
                        isDraft={isDraft}
                        onRapprochement={onRapprochement}
                      />
                    </TableCell>

                    {/* Montant */}
                    <TableCell className="text-right font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <DocumentDiscordanceBadge
                          localTotalTtcEuros={invoice.local_total_ttc}
                          qontoTotalCents={invoice.total_amount_cents}
                        />
                        <span>
                          {formatAmount(
                            parseFloat(invoice.total_amount.value),
                            invoice.total_amount.currency
                          )}
                        </span>
                      </div>
                    </TableCell>

                    {/* Actions — T3 via InvoiceActions */}
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    />
  );
}
