'use client';

import Link from 'next/link';
import {
  Badge,
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  OrganisationNameDisplay,
} from '@verone/ui';
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
} from 'lucide-react';

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
}

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
}: InvoicesTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (invoices.length === 0) {
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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>N° Facture</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Commande</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Echeance</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Paiement</TableHead>
          <TableHead className="text-right">Montant</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map(invoice => (
          <TableRow key={invoice.id}>
            <TableCell className="font-mono">{invoice.number}</TableCell>
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
            <TableCell>
              {invoice.sales_order_id && invoice.order_number ? (
                <button
                  onClick={() => onOpenOrder?.(invoice.sales_order_id!)}
                  className="inline-flex items-center gap-1"
                >
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                  >
                    {invoice.order_number}
                  </Badge>
                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-60" />
                </button>
              ) : (
                <span className="text-muted-foreground text-sm">-</span>
              )}
            </TableCell>
            <TableCell>{formatDate(invoice.issue_date)}</TableCell>
            <TableCell>
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
            </TableCell>
            <TableCell>
              <InvoiceStatusBadge status={invoice.status} />
            </TableCell>
            <TableCell>
              {invoice.status !== 'draft' && invoice.status !== 'canceled' ? (
                <div className="flex items-center gap-1">
                  {invoice.status === 'paid' ? (
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Payee
                    </Badge>
                  ) : (
                    <>
                      <Badge
                        variant="outline"
                        className="text-amber-600 border-amber-200"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Non payee
                      </Badge>
                      {onRapprochement && invoice.sales_order_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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
              )}
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatAmount(
                parseFloat(invoice.total_amount.value),
                invoice.total_amount.currency
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                {/* Draft actions: Edit + Finalize */}
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
                {/* Common: View detail */}
                <Button variant="ghost" size="icon" asChild>
                  <Link
                    href={`/factures/${invoice.id}?type=invoice`}
                    title="Voir"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
                {/* Finalized: PDF actions */}
                {!isDraft && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        window.open(
                          `/api/qonto/invoices/${invoice.id}/pdf`,
                          '_blank'
                        )
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
