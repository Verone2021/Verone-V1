'use client';

import { useState, useMemo, useEffect } from 'react';

import Link from 'next/link';

import {
  useMissingInvoices,
  type TransactionMissingInvoice,
} from '@verone/finance';
import {
  InvoiceUploadModal,
  InvoiceCreateFromOrderModal,
  InvoiceCreateServiceModal,
  OrderSelectModal,
  QuoteCreateFromOrderModal,
  QuoteCreateServiceModal,
  type TransactionForUpload,
  type IOrderForInvoice,
  type IOrderForDocument,
} from '@verone/finance/components';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Skeleton,
} from '@verone/ui';
import {
  Money,
  StatusPill,
  KpiCard,
  KpiGrid,
  DataTableToolbar,
  DocumentBadge,
  PartnerChipMini,
  SyncButton,
} from '@verone/ui-business';
import { featureFlags } from '@verone/utils/feature-flags';
import {
  FileText,
  Plus,
  Download,
  Eye,
  AlertCircle,
  Lock,
  Clock,
  CheckCircle,
  RefreshCw,
  Upload,
  AlertTriangle,
  Paperclip,
  Briefcase,
  ChevronDown,
  ShoppingCart,
  FileEdit,
  FileX,
  Send,
  Trash2,
  Loader2,
  Archive,
  ArchiveRestore,
} from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

type TabType = 'factures' | 'devis' | 'avoirs' | 'manquantes';

interface Quote {
  id: string;
  quote_number: string;
  status:
    | 'draft'
    | 'pending_approval'
    | 'finalized'
    | 'accepted'
    | 'declined'
    | 'expired';
  currency: string;
  total_amount: number;
  issue_date: string;
  expiry_date: string;
  client?: {
    name: string;
  };
  converted_to_invoice_id?: string;
}

interface CreditNote {
  id: string;
  credit_note_number: string;
  status: 'draft' | 'finalized' | 'canceled';
  currency: string;
  total_amount_cents: number; // Qonto API uses cents
  issue_date: string;
  client?: {
    id: string;
    name: string;
  };
  invoice_id?: string;
  invoice?: {
    id: string;
    invoice_number: string;
  };
  pdf_url?: string;
  attachment_id?: string;
}

interface Invoice {
  id: string;
  number: string; // Qonto uses 'number' not 'invoice_number'
  status: 'draft' | 'pending' | 'paid' | 'unpaid' | 'overdue' | 'canceled';
  currency: string;
  total_amount: {
    value: string;
    currency: string;
  };
  total_amount_cents: number;
  issue_date: string;
  due_date: string;
  client?: {
    name: string;
  };
  purchase_order?: string;
  // Données locales enrichies depuis financial_documents
  workflow_status?: string | null;
  local_pdf_path?: string | null;
  local_document_id?: string | null;
  has_local_pdf?: boolean;
  deleted_at?: string | null;
}

// =====================================================================
// HELPERS
// =====================================================================

function formatAmount(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('fr-FR').format(new Date(dateString));
}

function QuoteStatusBadge({ status }: { status: string }): React.ReactNode {
  const variants: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    draft: 'secondary',
    pending_approval: 'outline',
    finalized: 'default',
    accepted: 'default',
    declined: 'destructive',
    expired: 'outline',
  };

  const labels: Record<string, string> = {
    draft: 'Brouillon',
    pending_approval: 'En attente',
    finalized: 'Finalisé',
    accepted: 'Accepté',
    declined: 'Refusé',
    expired: 'Expiré',
  };

  return (
    <Badge variant={variants[status] || 'outline'}>
      {labels[status] || status}
    </Badge>
  );
}

function CreditNoteStatusBadge({
  status,
}: {
  status: string;
}): React.ReactNode {
  const variants: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    draft: 'secondary',
    finalized: 'default',
  };

  const labels: Record<string, string> = {
    draft: 'Brouillon',
    finalized: 'Finalisé',
  };

  return (
    <Badge variant={variants[status] || 'outline'}>
      {labels[status] || status}
    </Badge>
  );
}

function InvoiceStatusBadge({ status }: { status: string }): React.ReactNode {
  const variants: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    draft: 'secondary',
    pending: 'outline',
    unpaid: 'outline',
    paid: 'default',
    overdue: 'destructive',
    cancelled: 'destructive',
    canceled: 'destructive', // Qonto uses 'canceled' (US spelling)
  };

  const labels: Record<string, string> = {
    draft: 'Brouillon',
    pending: 'En attente',
    unpaid: 'Non payée',
    paid: 'Payée',
    overdue: 'En retard',
    cancelled: 'Annulée',
    canceled: 'Annulée', // Qonto uses 'canceled' (US spelling)
  };

  return (
    <Badge variant={variants[status] || 'outline'}>
      {labels[status] || status}
    </Badge>
  );
}

/**
 * Badge pour afficher le workflow local (synchronized → draft_validated → finalized)
 */
function WorkflowStatusBadge({ status, hasLocalPdf }: { status: string | null | undefined; hasLocalPdf?: boolean }): React.ReactNode {
  if (!status) return null;

  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    synchronized: {
      label: 'Synchronisé',
      className: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: <RefreshCw className="h-3 w-3 mr-1" />,
    },
    draft_validated: {
      label: 'Brouillon validé',
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      icon: <Clock className="h-3 w-3 mr-1" />,
    },
    finalized: {
      label: 'Définitif',
      className: 'bg-green-100 text-green-700 border-green-200',
      icon: <CheckCircle className="h-3 w-3 mr-1" />,
    },
    sent: {
      label: 'Envoyé',
      className: 'bg-purple-100 text-purple-700 border-purple-200',
      icon: <Send className="h-3 w-3 mr-1" />,
    },
    paid: {
      label: 'Payé',
      className: 'bg-green-100 text-green-700 border-green-200',
      icon: <CheckCircle className="h-3 w-3 mr-1" />,
    },
  };

  const currentConfig = config[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-700',
    icon: null,
  };

  return (
    <div className="flex items-center gap-1">
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${currentConfig.className}`}>
        {currentConfig.icon}
        {currentConfig.label}
      </span>
      {hasLocalPdf && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700 border border-emerald-200" title="PDF stocké localement">
          <Lock className="h-3 w-3" />
        </span>
      )}
    </div>
  );
}

// =====================================================================
// COMPOSANT: TABLEAU DE FACTURES (Qonto)
// =====================================================================

function InvoicesTable({
  invoices,
  loading,
  onView,
  onDownloadPdf,
  isArchived,
  onArchive,
  onUnarchive,
}: {
  invoices: Invoice[];
  loading: boolean;
  onView: (id: string) => void;
  onDownloadPdf: (invoice: Invoice) => void;
  isArchived?: boolean;
  onArchive?: (invoice: Invoice) => Promise<void>;
  onUnarchive?: (invoice: Invoice) => Promise<void>;
}) {
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
        <p>Aucune facture trouvée</p>
        <p className="text-sm">
          Cliquez sur &quot;Nouvelle facture&quot; pour en créer une
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
          <TableHead>Date</TableHead>
          <TableHead>Échéance</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Workflow</TableHead>
          <TableHead className="text-right">Montant</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map(invoice => (
          <TableRow key={invoice.id}>
            <TableCell className="font-mono">{invoice.number}</TableCell>
            <TableCell>{invoice.client?.name || '-'}</TableCell>
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
              <WorkflowStatusBadge status={invoice.workflow_status} hasLocalPdf={invoice.has_local_pdf} />
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatAmount(
                parseFloat(invoice.total_amount.value),
                invoice.total_amount.currency
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" asChild>
                  <Link
                    href={`/factures/${invoice.id}?type=invoice`}
                    title="Voir"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
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
                  title="Télécharger PDF"
                >
                  <Download className="h-4 w-4" />
                </Button>
                {!isArchived &&
                  ['draft_validated', 'finalized', 'sent', 'paid'].includes(
                    invoice.workflow_status || ''
                  ) &&
                  onArchive && (
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
                    title="Désarchiver"
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

// =====================================================================
// COMPOSANT: TABLEAU FACTURES MANQUANTES
// =====================================================================

function MissingInvoicesTable({
  transactions,
  loading,
  onUpload,
}: {
  transactions: TransactionMissingInvoice[];
  loading: boolean;
  onUpload: (transaction: TransactionMissingInvoice) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-70" />
        <p className="font-medium text-foreground">
          Toutes les transactions ont une facture!
        </p>
        <p className="text-sm mt-1">Aucune facture manquante à uploader</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 text-sm font-medium">Transaction</th>
            <th className="text-left p-3 text-sm font-medium">Contrepartie</th>
            <th className="text-left p-3 text-sm font-medium">Date</th>
            <th className="text-left p-3 text-sm font-medium">Commande</th>
            <th className="text-right p-3 text-sm font-medium">Montant</th>
            <th className="text-center p-3 text-sm font-medium">Statut</th>
            <th className="text-right p-3 text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(tx => (
            <tr key={tx.id} className="border-t hover:bg-muted/30">
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {tx.label || 'Sans libellé'}
                  </span>
                </div>
              </td>
              <td className="p-3">
                <span className="text-sm">{tx.counterparty_name ?? '-'}</span>
              </td>
              <td className="p-3 text-sm">
                {tx.emitted_at
                  ? new Date(tx.emitted_at).toLocaleDateString('fr-FR')
                  : '-'}
              </td>
              <td className="p-3">
                {tx.order_number ? (
                  <Badge variant="outline">{tx.order_number}</Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </td>
              <td className="p-3 text-right">
                <Money
                  amount={Math.abs(tx.amount)}
                  size="sm"
                  className="text-green-600 font-medium"
                />
              </td>
              <td className="p-3 text-center">
                {tx.upload_status === 'pending' ? (
                  <Badge variant="secondary">En attente</Badge>
                ) : tx.upload_status === 'uploading' ? (
                  <Badge variant="secondary" className="animate-pulse">
                    Upload...
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <Paperclip className="h-3 w-3" />
                    Manquante
                  </Badge>
                )}
              </td>
              <td className="p-3 text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpload(tx)}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Uploader
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =====================================================================
// PAGE COMPONENT
// =====================================================================

export default function FacturationPage() {
  const [activeTab, setActiveTab] = useState<TabType>('factures');
  const [invoiceView, setInvoiceView] = useState<'active' | 'archived'>(
    'active'
  );
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedMissingTx, setSelectedMissingTx] =
    useState<TransactionMissingInvoice | null>(null);

  // Etats pour creation de facture depuis commande
  const [showOrderSelect, setShowOrderSelect] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<IOrderForInvoice | null>(
    null
  );
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Etat pour facture de service (sans commande)
  const [showServiceModal, setShowServiceModal] = useState(false);

  // États pour les devis
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [errorQuotes, setErrorQuotes] = useState<string | null>(null);
  const [showQuoteOrderSelect, setShowQuoteOrderSelect] = useState(false);
  const [showQuoteCreate, setShowQuoteCreate] = useState(false);
  const [showQuoteServiceModal, setShowQuoteServiceModal] = useState(false);
  const [selectedQuoteOrder, setSelectedQuoteOrder] =
    useState<IOrderForDocument | null>(null);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [deletingQuote, setDeletingQuote] = useState(false);
  const [finalizingQuoteId, setFinalizingQuoteId] = useState<string | null>(
    null
  );

  // États pour les avoirs
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loadingCreditNotes, setLoadingCreditNotes] = useState(false);
  const [errorCreditNotes, setErrorCreditNotes] = useState<string | null>(null);

  // États pour les factures (Qonto)
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [errorInvoices, setErrorInvoices] = useState<string | null>(null);

  // Récupérer les transactions sans facture
  const {
    transactions: missingInvoices,
    loading: loadingMissing,
    error: errorMissing,
    refresh: refreshMissing,
    count: missingCount,
  } = useMissingInvoices();

  // Fetch invoices (Qonto)
  const fetchInvoices = async (): Promise<void> => {
    setLoadingInvoices(true);
    setErrorInvoices(null);

    try {
      const response = await fetch('/api/qonto/invoices');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch invoices');
      }

      setInvoices(data.invoices || []);
    } catch (err) {
      setErrorInvoices(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Fetch quotes
  const fetchQuotes = async (): Promise<void> => {
    setLoadingQuotes(true);
    setErrorQuotes(null);

    try {
      const response = await fetch('/api/qonto/quotes');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch quotes');
      }

      setQuotes(data.quotes || []);
    } catch (err) {
      setErrorQuotes(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingQuotes(false);
    }
  };

  // Fetch credit notes
  const fetchCreditNotes = async (): Promise<void> => {
    setLoadingCreditNotes(true);
    setErrorCreditNotes(null);

    try {
      const response = await fetch('/api/qonto/credit-notes');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch credit notes');
      }

      setCreditNotes(data.credit_notes || []);
    } catch (err) {
      setErrorCreditNotes(
        err instanceof Error ? err.message : 'Erreur inconnue'
      );
    } finally {
      setLoadingCreditNotes(false);
    }
  };

  // Load invoices at mount
  useEffect(() => {
    void fetchInvoices();
  }, []);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'factures' && invoices.length === 0) {
      void fetchInvoices();
    } else if (activeTab === 'devis' && quotes.length === 0) {
      void fetchQuotes();
    } else if (activeTab === 'avoirs' && creditNotes.length === 0) {
      void fetchCreditNotes();
    }
  }, [activeTab]);

  // Convertir TransactionMissingInvoice en TransactionForUpload
  const transactionForUpload: TransactionForUpload | null = useMemo(() => {
    if (!selectedMissingTx) return null;
    return {
      id: selectedMissingTx.id,
      transaction_id: selectedMissingTx.transaction_id,
      label: selectedMissingTx.label,
      counterparty_name: selectedMissingTx.counterparty_name,
      amount: selectedMissingTx.amount,
      currency: selectedMissingTx.currency,
      emitted_at: selectedMissingTx.emitted_at,
      has_attachment: selectedMissingTx.has_attachment,
      matched_document_id: selectedMissingTx.matched_document_id,
      order_number: selectedMissingTx.order_number,
    };
  }, [selectedMissingTx]);

  // Handler pour ouvrir le modal d'upload
  const handleOpenUpload = (tx: TransactionMissingInvoice): void => {
    setSelectedMissingTx(tx);
    setShowUploadModal(true);
  };

  // Handler pour selection de commande et ouverture du modal de creation facture
  const handleOrderSelected = (order: IOrderForInvoice): void => {
    setSelectedOrder(order);
    setShowOrderSelect(false);
    setShowInvoiceModal(true);
  };

  // Handler pour fermeture du modal de creation facture
  const handleInvoiceModalClose = (): void => {
    setShowInvoiceModal(false);
    setSelectedOrder(null);
  };

  // Handler pour succes de creation facture
  const handleInvoiceCreated = (_invoiceId: string): void => {
    void fetchInvoices();
  };

  // Handler pour télécharger le PDF d'une facture
  const handleDownloadInvoicePdf = async (invoice: Invoice): Promise<void> => {
    try {
      const response = await fetch(`/api/qonto/invoices/${invoice.id}/pdf`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Erreur ${response.status}: ${response.statusText}`
        );
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error('Le PDF est vide');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${invoice.number}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 1000);
    } catch (err) {
      console.error('Download error:', err);
      setErrorInvoices(
        err instanceof Error ? err.message : 'Erreur de téléchargement'
      );
    }
  };

  // Quote handlers
  const handleQuoteOrderSelected = (order: IOrderForDocument): void => {
    setSelectedQuoteOrder(order);
    setShowQuoteOrderSelect(false);
    setShowQuoteCreate(true);
  };

  const handleQuoteCreated = (): void => {
    setShowQuoteCreate(false);
    setSelectedQuoteOrder(null);
    void fetchQuotes();
  };

  const handleDownloadQuotePdf = async (quote: Quote): Promise<void> => {
    try {
      const response = await fetch(`/api/qonto/quotes/${quote.id}/pdf`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Erreur ${response.status}: ${response.statusText}`
        );
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error('Le PDF est vide');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devis-${quote.quote_number}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 1000);
    } catch (err) {
      console.error('Download error:', err);
      setErrorQuotes(
        err instanceof Error ? err.message : 'Erreur de téléchargement'
      );
    }
  };

  const handleDeleteQuote = async (): Promise<void> => {
    if (!quoteToDelete) return;

    setDeletingQuote(true);
    try {
      const response = await fetch(`/api/qonto/quotes/${quoteToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      void fetchQuotes();
    } catch (err) {
      console.error('Delete error:', err);
      setErrorQuotes(
        err instanceof Error ? err.message : 'Erreur de suppression'
      );
    } finally {
      setDeletingQuote(false);
      setQuoteToDelete(null);
    }
  };

  const handleFinalizeQuote = async (quote: Quote): Promise<void> => {
    setFinalizingQuoteId(quote.id);
    try {
      const response = await fetch(`/api/qonto/quotes/${quote.id}/finalize`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la finalisation');
      }

      void fetchQuotes();
    } catch (err) {
      console.error('Finalize error:', err);
      setErrorQuotes(
        err instanceof Error ? err.message : 'Erreur de finalisation'
      );
    } finally {
      setFinalizingQuoteId(null);
    }
  };

  const isDraftQuote = (quote: Quote): boolean => {
    return quote.status === 'draft' || quote.status === 'pending_approval';
  };

  // Credit note handlers
  const handleDownloadCreditNotePdf = async (
    creditNote: CreditNote
  ): Promise<void> => {
    try {
      const response = await fetch(
        `/api/qonto/credit-notes/${creditNote.id}/pdf`
      );

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `avoir-${creditNote.credit_note_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Calculer les KPIs pour les factures (Qonto)
  const kpis = useMemo(() => {
    // Helper pour vérifier si une facture est annulée
    // Qonto utilise 'cancelled' (UK) mais on vérifie les deux par sécurité
    const isAnnulee = (status: string) =>
      status === 'cancelled' || status === 'canceled';

    // Exclure les factures annulées et brouillons du total facturé
    const facturesActives = invoices.filter(
      inv => !isAnnulee(inv.status) && inv.status !== 'draft'
    );
    // Utiliser total_amount_cents (en centimes) et convertir en euros
    const totalFacture =
      facturesActives.reduce(
        (sum, inv) => sum + (inv.total_amount_cents || 0),
        0
      ) / 100;
    const totalPaye =
      invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.total_amount_cents || 0), 0) / 100;
    const enRetard = invoices.filter(
      inv =>
        inv.due_date &&
        new Date(inv.due_date) < new Date() &&
        inv.status !== 'paid' &&
        !isAnnulee(inv.status)
    );
    const enAttente = invoices.filter(
      inv =>
        inv.status !== 'paid' &&
        !isAnnulee(inv.status) &&
        inv.status !== 'draft'
    );

    return {
      totalFacture,
      totalPaye,
      nombreFacturesActives: facturesActives.length,
      enAttente: enAttente.length,
      montantEnAttente:
        enAttente.reduce((sum, inv) => sum + (inv.total_amount_cents || 0), 0) /
        100,
      enRetard: enRetard.length,
      montantEnRetard:
        enRetard.reduce((sum, inv) => sum + (inv.total_amount_cents || 0), 0) /
        100,
    };
  }, [invoices]);

  // Handler pour voir une facture
  const handleView = (
    id: string,
    type: 'invoice' | 'quote' | 'credit_note' = 'invoice'
  ) => {
    window.location.href = `/factures/${id}?type=${type}`;
  };

  // Handler sync Qonto - Sync transactions ET factures
  const handleSync = async () => {
    try {
      // 1. Sync transactions bancaires
      const transactionsResponse = await fetch('/api/qonto/sync', {
        method: 'POST',
      });
      const transactionsResult = await transactionsResponse.json();

      if (!transactionsResult.success) {
        console.error(
          '[Qonto Sync Transactions] Failed:',
          transactionsResult.message
        );
      } else {
        console.log('[Qonto Sync Transactions] Success:', transactionsResult);
      }

      // 2. Sync factures clients vers financial_documents
      const invoicesResponse = await fetch('/api/qonto/sync-invoices', {
        method: 'POST',
      });
      const invoicesResult = await invoicesResponse.json();

      if (!invoicesResult.success) {
        console.error('[Qonto Sync Invoices] Failed:', invoicesResult.message);
      } else {
        console.log('[Qonto Sync Invoices] Success:', invoicesResult);
      }

      // Rafraîchir les données
      void fetchInvoices();
      void fetchQuotes();
      void fetchCreditNotes();
    } catch (error) {
      console.error('[Qonto Sync] Error:', error);
      void fetchInvoices();
    }
  };

  // FEATURE FLAG: Finance module disabled for Phase 1
  if (!featureFlags.financeEnabled) {
    return (
      <div className="w-full py-8">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-orange-600" />
              <div>
                <CardTitle className="text-orange-900">
                  Module Finance - Phase 2
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Ce module sera disponible après le déploiement Phase 1
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-orange-900">
                    Phase 1 (Actuelle)
                  </p>
                  <p className="text-sm text-orange-700">
                    Sourcing - Catalogue - Organisations - Stock - Commandes
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Lock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-orange-900">
                    Phase 2 (Prochainement)
                  </p>
                  <p className="text-sm text-orange-700">
                    Facturation - Trésorerie - Rapprochement bancaire -
                    Intégrations (Qonto)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Facturation</h1>
          <p className="text-muted-foreground">
            Gestion des factures, devis et avoirs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/factures/qonto">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Voir Qonto
            </Button>
          </Link>
          <SyncButton onSync={handleSync} label="Sync Qonto" showLastSync />
          {activeTab === 'factures' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle facture
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowOrderSelect(true)}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Depuis une commande
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowServiceModal(true)}>
                  <Briefcase className="h-4 w-4 mr-2" />
                  Facture de service
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {activeTab === 'devis' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau devis
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowQuoteOrderSelect(true)}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Depuis une commande
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowQuoteServiceModal(true)}
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Devis de service
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* KPIs - Only show for factures tab */}
      {activeTab === 'factures' && (
        <KpiGrid columns={4}>
          <KpiCard
            title="Total facturé"
            value={kpis.totalFacture}
            valueType="money"
            icon={<FileText className="h-4 w-4" />}
            description={`${kpis.nombreFacturesActives} facture(s) finalisée(s)`}
          />
          <KpiCard
            title="Total payé"
            value={kpis.totalPaye}
            valueType="money"
            icon={<CheckCircle className="h-4 w-4" />}
            variant="success"
          />
          <KpiCard
            title="En attente"
            value={kpis.montantEnAttente}
            valueType="money"
            icon={<Clock className="h-4 w-4" />}
            description={`${kpis.enAttente} facture(s)`}
            variant="warning"
          />
          <KpiCard
            title="En retard"
            value={kpis.montantEnRetard}
            valueType="money"
            icon={<AlertCircle className="h-4 w-4" />}
            description={`${kpis.enRetard} facture(s)`}
            variant="danger"
          />
        </KpiGrid>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabType)}>
        <TabsList>
          <TabsTrigger value="factures">
            <FileText className="h-4 w-4 mr-1" />
            Factures
            <Badge variant="secondary" className="ml-2">
              {invoices.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="devis">
            <FileEdit className="h-4 w-4 mr-1" />
            Devis
            <Badge variant="secondary" className="ml-2">
              {quotes.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="avoirs">
            <FileX className="h-4 w-4 mr-1" />
            Avoirs
            <Badge variant="secondary" className="ml-2">
              {creditNotes.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="manquantes">
            <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
            Factures manquantes
            {missingCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {missingCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Toolbar - Only for factures */}
        {activeTab === 'factures' && (
          <div className="mt-4">
            <DataTableToolbar
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Rechercher par numéro, partenaire..."
              filters={[
                {
                  id: 'status',
                  label: 'Statut',
                  options: [
                    { value: 'draft', label: 'Brouillon' },
                    { value: 'sent', label: 'Envoyee' },
                    { value: 'paid', label: 'Payee' },
                    { value: 'partially_paid', label: 'Paiement partiel' },
                    { value: 'overdue', label: 'En retard' },
                    { value: 'canceled', label: 'Annulee' },
                  ],
                },
              ]}
              activeFilters={{ status: statusFilter }}
              onFilterChange={(id, value) => {
                if (id === 'status') setStatusFilter(value as string);
              }}
              onResetFilters={() => {
                setSearch('');
                setStatusFilter('all');
              }}
              loading={loadingInvoices}
              resultCount={invoices.length}
              actions={
                <Button variant="outline" size="sm" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              }
            />
          </div>
        )}

        {/* Contenu des tabs */}
        <TabsContent value="factures" className="mt-4 space-y-4">
          {/* Sub-tabs for Active/Archived invoices */}
          <Tabs
            value={invoiceView}
            onValueChange={v => setInvoiceView(v as 'active' | 'archived')}
          >
            <TabsList>
              <TabsTrigger value="active">Factures actives</TabsTrigger>
              <TabsTrigger value="archived">Archives</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4">
              <InvoicesTable
                invoices={invoices.filter(inv => !inv.deleted_at)}
                loading={loadingInvoices}
                onView={handleView}
                onDownloadPdf={handleDownloadInvoicePdf}
                isArchived={false}
                onArchive={async invoice => {
                  try {
                    const response = await fetch(
                      `/api/financial-documents/${invoice.id}/archive`,
                      { method: 'POST' }
                    );
                    const data = await response.json();
                    if (!data.success) throw new Error(data.error);
                    void fetchInvoices();
                  } catch (error) {
                    console.error('Archive error:', error);
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="archived" className="mt-4">
              <InvoicesTable
                invoices={invoices.filter(inv => inv.deleted_at)}
                loading={loadingInvoices}
                onView={handleView}
                onDownloadPdf={handleDownloadInvoicePdf}
                isArchived={true}
                onUnarchive={async invoice => {
                  try {
                    const response = await fetch(
                      `/api/financial-documents/${invoice.id}/unarchive`,
                      { method: 'POST' }
                    );
                    const data = await response.json();
                    if (!data.success) throw new Error(data.error);
                    void fetchInvoices();
                  } catch (error) {
                    console.error('Unarchive error:', error);
                  }
                }}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="devis" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileEdit className="h-5 w-5" />
                    Liste des devis
                  </CardTitle>
                  <CardDescription>
                    Créez des devis depuis vos commandes et convertissez-les en
                    factures
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void fetchQuotes()}
                  disabled={loadingQuotes}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${loadingQuotes ? 'animate-spin' : ''}`}
                  />
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingQuotes ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : errorQuotes ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
                  {errorQuotes}
                </div>
              ) : quotes.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <FileEdit className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>Aucun devis</p>
                  <p className="text-sm">
                    Cliquez sur &quot;Nouveau devis&quot; pour en créer un
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Devis</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Expiration</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotes.map(quote => (
                      <TableRow key={quote.id}>
                        <TableCell className="font-mono">
                          {quote.quote_number}
                        </TableCell>
                        <TableCell>{quote.client?.name || '-'}</TableCell>
                        <TableCell>{formatDate(quote.issue_date)}</TableCell>
                        <TableCell>{formatDate(quote.expiry_date)}</TableCell>
                        <TableCell>
                          <QuoteStatusBadge status={quote.status} />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatAmount(quote.total_amount, quote.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" asChild>
                              <Link
                                href={`/factures/${quote.id}?type=quote`}
                                title="Voir"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            {isDraftQuote(quote) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleFinalizeQuote(quote)}
                                title="Envoyer au client"
                                disabled={finalizingQuoteId === quote.id}
                                className="text-primary hover:text-primary hover:bg-primary/10"
                              >
                                {finalizingQuoteId === quote.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                window.open(
                                  `/api/qonto/quotes/${quote.id}/view`,
                                  '_blank'
                                )
                              }
                              title="Voir PDF"
                              className="text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <FileEdit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadQuotePdf(quote)}
                              title="Télécharger PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {isDraftQuote(quote) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setQuoteToDelete(quote)}
                                title="Supprimer"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="avoirs" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileX className="h-5 w-5" />
                    Liste des avoirs
                  </CardTitle>
                  <CardDescription>
                    Les avoirs sont créés depuis la page de détail d&apos;une
                    facture finalisée
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void fetchCreditNotes()}
                  disabled={loadingCreditNotes}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${loadingCreditNotes ? 'animate-spin' : ''}`}
                  />
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingCreditNotes ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : errorCreditNotes ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
                  {errorCreditNotes}
                </div>
              ) : creditNotes.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <FileX className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>Aucun avoir</p>
                  <p className="text-sm">
                    Les avoirs sont créés depuis la page de détail d&apos;une
                    facture
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Avoir</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Facture liée</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creditNotes.map(creditNote => (
                      <TableRow key={creditNote.id}>
                        <TableCell className="font-mono">
                          {creditNote.credit_note_number}
                        </TableCell>
                        <TableCell>{creditNote.client?.name ?? '-'}</TableCell>
                        <TableCell>
                          {creditNote.invoice_id ? (
                            <Link
                              href={`/factures/${creditNote.invoice_id}?type=invoice`}
                              className="text-primary hover:underline font-mono text-sm"
                            >
                              {creditNote.invoice?.invoice_number ??
                                'Voir facture'}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDate(creditNote.issue_date)}
                        </TableCell>
                        <TableCell>
                          <CreditNoteStatusBadge status={creditNote.status} />
                        </TableCell>
                        <TableCell className="text-right font-medium text-destructive">
                          -
                          {formatAmount(
                            Math.abs(
                              (creditNote.total_amount_cents ?? 0) / 100
                            ),
                            creditNote.currency
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" asChild>
                              <Link
                                href={`/factures/${creditNote.id}?type=credit_note`}
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                window.open(
                                  `/api/qonto/credit-notes/${creditNote.id}/pdf`,
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
                              onClick={() =>
                                void handleDownloadCreditNotePdf(creditNote)
                              }
                              title="Télécharger PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manquantes" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Transactions sans facture
                  </CardTitle>
                  <CardDescription>
                    Ces transactions ont été rapprochées mais n'ont pas de pièce
                    jointe dans Qonto. Uploadez les factures manquantes.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void refreshMissing()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rafraîchir
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <MissingInvoicesTable
                transactions={missingInvoices}
                loading={loadingMissing}
                onUpload={handleOpenUpload}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error state */}
      {errorInvoices && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p>{errorInvoices}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state for missing invoices */}
      {errorMissing && activeTab === 'manquantes' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p>{errorMissing}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal upload facture */}
      <InvoiceUploadModal
        transaction={transactionForUpload}
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onUploadComplete={() => {
          void refreshMissing();
          setShowUploadModal(false);
          setSelectedMissingTx(null);
        }}
      />

      {/* Modal selection commande pour nouvelle facture */}
      <OrderSelectModal
        open={showOrderSelect}
        onOpenChange={setShowOrderSelect}
        onSelectOrder={handleOrderSelected}
      />

      {/* Modal creation facture depuis commande */}
      <InvoiceCreateFromOrderModal
        order={selectedOrder}
        open={showInvoiceModal}
        onOpenChange={open => {
          if (!open) handleInvoiceModalClose();
        }}
        onSuccess={handleInvoiceCreated}
      />

      {/* Modal creation facture de service (sans commande) */}
      <InvoiceCreateServiceModal
        open={showServiceModal}
        onOpenChange={setShowServiceModal}
        onSuccess={() => {
          void fetchInvoices();
        }}
      />

      {/* Modal selection commande pour nouveau devis */}
      <OrderSelectModal
        open={showQuoteOrderSelect}
        onOpenChange={setShowQuoteOrderSelect}
        onSelectOrder={handleQuoteOrderSelected}
      />

      {/* Modal creation devis depuis commande */}
      <QuoteCreateFromOrderModal
        order={selectedQuoteOrder}
        open={showQuoteCreate}
        onOpenChange={setShowQuoteCreate}
        onSuccess={handleQuoteCreated}
      />

      {/* Modal creation devis de service (sans commande) */}
      <QuoteCreateServiceModal
        open={showQuoteServiceModal}
        onOpenChange={setShowQuoteServiceModal}
        onSuccess={() => {
          void fetchQuotes();
        }}
      />

      {/* Dialog confirmation suppression devis */}
      <AlertDialog
        open={!!quoteToDelete}
        onOpenChange={open => !open && setQuoteToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce devis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous allez supprimer le devis{' '}
              <strong>{quoteToDelete?.quote_number}</strong>. Cette action est
              irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingQuote}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuote}
              disabled={deletingQuote}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingQuote ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
