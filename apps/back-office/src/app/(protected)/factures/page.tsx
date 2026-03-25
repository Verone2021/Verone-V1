'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { OrderDetailModal } from '@verone/orders/components/modals';
import { useSalesOrders } from '@verone/orders/hooks';
import type { SalesOrder } from '@verone/orders/hooks';
import { OrganisationQuickViewModal } from '@verone/organisations';

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
  QuoteFormModal,
  RapprochementFromOrderModal,
  type TransactionForUpload,
  type IOrderForInvoice,
  type IOrderForDocument,
  type OrderForLink,
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
} from '@verone/ui';
import {
  KpiCard,
  KpiGrid,
  DataTableToolbar,
  SyncButton,
} from '@verone/ui-business';
import { featureFlags } from '@verone/utils/feature-flags';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  Eye,
  AlertCircle,
  Lock,
  Clock,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  Briefcase,
  ChevronDown,
  ShoppingCart,
  FileEdit,
  FileX,
  Loader2,
  Link2,
} from 'lucide-react';

import type {
  TabType,
  Invoice,
  QontoQuote,
  CreditNote,
  ApiResponse,
  InvoicesResponse,
  QontoQuotesResponse,
  CreditNotesResponse,
  ConsolidateReport,
} from './components/types';
import { VALID_TABS } from './components/types';
import { FacturesTab } from './components/FacturesTab';
import { DevisTab } from './components/DevisTab';
import { AvoirsTab } from './components/AvoirsTab';
import { MissingInvoicesTable } from './components/MissingInvoicesTable';

// =====================================================================
// PAGE COMPONENT
// =====================================================================

export default function FacturationPage() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(
    tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'factures'
  );
  // Sync activeTab when URL query param changes (e.g. sidebar click while page is already open)
  useEffect(() => {
    const tab = searchParams.get('tab') as TabType | null;
    if (tab && VALID_TABS.includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

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

  // Etats pour les devis (Qonto API)
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [qontoQuotes, setQontoQuotes] = useState<QontoQuote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [errorQuotes, setErrorQuotes] = useState<string | null>(null);

  // Legacy states (kept for Qonto finalization/PDF features)
  const [showQuoteOrderSelect, setShowQuoteOrderSelect] = useState(false);
  const [showQuoteCreate, setShowQuoteCreate] = useState(false);
  const [showQuoteServiceModal, setShowQuoteServiceModal] = useState(false);
  const [selectedQuoteOrder, setSelectedQuoteOrder] =
    useState<IOrderForDocument | null>(null);
  const [quoteToDelete, setQuoteToDelete] = useState<QontoQuote | null>(null);
  const [deletingQuote, setDeletingQuote] = useState(false);

  // Etat consolidation liaisons
  const [isConsolidating, setIsConsolidating] = useState(false);

  // Etats pour les avoirs
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loadingCreditNotes, setLoadingCreditNotes] = useState(false);
  const [errorCreditNotes, setErrorCreditNotes] = useState<string | null>(null);

  // Etat pour ouverture modale commande en place (depuis lien facture)
  const [selectedOrderForModal, setSelectedOrderForModal] =
    useState<SalesOrder | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Etat pour ouverture modale organisation (depuis nom client cliquable)
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const { fetchOrder } = useSalesOrders();

  const handleOpenOrderModal = useCallback(
    async (orderId: string) => {
      const order = await fetchOrder(orderId);
      if (order) {
        setSelectedOrderForModal(order);
        setShowOrderModal(true);
      }
    },
    [fetchOrder]
  );

  const handleRapprochement = useCallback(
    async (invoice: Invoice) => {
      if (!invoice.sales_order_id) return;
      const order = await fetchOrder(invoice.sales_order_id);
      if (order) {
        const customerName =
          order.organisations?.legal_name ??
          (order.individual_customers
            ? `${order.individual_customers.first_name} ${order.individual_customers.last_name}`
            : null);
        setRapprochementOrder({
          id: order.id,
          order_number: order.order_number,
          customer_name: customerName ?? null,
          customer_name_alt: order.organisations?.trade_name ?? null,
          total_ttc: order.total_ttc,
          created_at: order.created_at,
          order_date: order.order_date ?? null,
          shipped_at: order.shipped_at ?? null,
        });
        setShowRapprochementModal(true);
      }
    },
    [fetchOrder]
  );

  // Etat pour rapprochement depuis facture
  const [showRapprochementModal, setShowRapprochementModal] = useState(false);
  const [rapprochementOrder, setRapprochementOrder] =
    useState<OrderForLink | null>(null);

  // Etats pour les factures (Qonto)
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [errorInvoices, setErrorInvoices] = useState<string | null>(null);

  // Recuperer les transactions sans facture
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
      const data = (await response.json()) as InvoicesResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to fetch invoices');
      }

      setInvoices(data.invoices ?? []);
    } catch (err) {
      setErrorInvoices(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Fetch quotes from Qonto API (source of truth for devis)
  const fetchQontoQuotes = async (): Promise<void> => {
    setLoadingQuotes(true);
    setErrorQuotes(null);

    try {
      const response = await fetch('/api/qonto/quotes');
      const data = (await response.json()) as QontoQuotesResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to fetch quotes');
      }

      setQontoQuotes(data.quotes ?? []);
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
      const data = (await response.json()) as CreditNotesResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to fetch credit notes');
      }

      setCreditNotes(data.credit_notes ?? []);
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
    } else if (activeTab === 'devis' && qontoQuotes.length === 0) {
      void fetchQontoQuotes();
    } else if (activeTab === 'avoirs' && creditNotes.length === 0) {
      void fetchCreditNotes();
    }
  }, [activeTab, invoices.length, qontoQuotes.length, creditNotes.length]);

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

  // Handler pour telecharger le PDF d'une facture
  const handleDownloadInvoicePdf = async (invoice: Invoice): Promise<void> => {
    try {
      const response = await fetch(`/api/qonto/invoices/${invoice.id}/pdf`);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          errorData.error ?? `Erreur ${response.status}: ${response.statusText}`
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
        err instanceof Error ? err.message : 'Erreur de telechargement'
      );
    }
  };

  const handleDownloadQuotePdf = async (quote: QontoQuote): Promise<void> => {
    try {
      const response = await fetch(`/api/qonto/quotes/${quote.id}/pdf`);
      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          errorData.error ?? `Erreur ${response.status}: ${response.statusText}`
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
      console.error('[Quote] Download PDF error:', err);
      toast.error(
        err instanceof Error ? err.message : 'Erreur de telechargement'
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
    void fetchQontoQuotes().catch((err: unknown) => {
      console.error(
        '[Factures] fetchQontoQuotes after handleQuoteCreated failed:',
        err
      );
    });
  };

  // Delete quote via Qonto API
  const handleDeleteQuote = async (): Promise<void> => {
    if (!quoteToDelete) return;

    setDeletingQuote(true);
    try {
      const response = await fetch(`/api/qonto/quotes/${quoteToDelete.id}`, {
        method: 'DELETE',
      });
      const data = (await response.json()) as ApiResponse<unknown>;
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Erreur lors de la suppression');
      }
      toast.success('Devis supprime');
      void fetchQontoQuotes();
    } catch (err) {
      console.error('[Factures] deleteQuote error:', err);
      toast.error(err instanceof Error ? err.message : 'Erreur de suppression');
    } finally {
      setDeletingQuote(false);
      setQuoteToDelete(null);
    }
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
    const isAnnulee = (status: string) =>
      status === 'cancelled' || status === 'canceled';

    const facturesActives = invoices.filter(
      inv => !isAnnulee(inv.status) && inv.status !== 'draft'
    );
    const totalFacture =
      facturesActives.reduce(
        (sum, inv) => sum + (inv.total_amount_cents ?? 0),
        0
      ) / 100;
    const totalPaye =
      invoices
        .filter(inv => inv.status === 'paid' || inv.status === 'partially_paid')
        .reduce(
          (sum, inv) =>
            sum +
            (inv.local_amount_paid != null
              ? inv.local_amount_paid * 100
              : (inv.total_amount_cents ?? 0)),
          0
        ) / 100;
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
        enAttente.reduce((sum, inv) => sum + (inv.total_amount_cents ?? 0), 0) /
        100,
      enRetard: enRetard.length,
      montantEnRetard:
        enRetard.reduce((sum, inv) => sum + (inv.total_amount_cents ?? 0), 0) /
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
      const transactionsResponse = await fetch('/api/qonto/sync', {
        method: 'POST',
      });
      const transactionsResult =
        (await transactionsResponse.json()) as ApiResponse<unknown>;

      if (!transactionsResult.success) {
        console.error(
          '[Qonto Sync Transactions] Failed:',
          transactionsResult.message
        );
      } else {
        console.warn('[Qonto Sync Transactions] Success:', transactionsResult);
      }

      const invoicesResponse = await fetch('/api/qonto/sync-invoices', {
        method: 'POST',
      });
      const invoicesResult =
        (await invoicesResponse.json()) as ApiResponse<unknown>;

      if (!invoicesResult.success) {
        console.error('[Qonto Sync Invoices] Failed:', invoicesResult.message);
      } else {
        console.warn('[Qonto Sync Invoices] Success:', invoicesResult);
      }

      void fetchInvoices();
      void fetchQontoQuotes();
      void fetchCreditNotes();
    } catch (error) {
      console.error('[Qonto Sync] Error:', error);
      void fetchInvoices();
    }
  };

  // Handler consolidation historique liaisons commandes <-> factures Qonto
  const handleConsolidate = () => {
    setIsConsolidating(true);
    void fetch('/api/qonto/invoices/consolidate', { method: 'POST' })
      .then(r => r.json())
      .then((report: ConsolidateReport) => {
        toast.success(
          `${report.synced.toString()} liaisons creees · ${report.skipped_existing.toString()} deja existantes`
        );
        if (report.errors.length > 0) {
          toast.error(
            `${report.errors.length.toString()} erreur(s) lors de la consolidation`
          );
        }
        if (report.synced > 0) {
          void fetchInvoices();
        }
      })
      .catch(() => {
        toast.error('Erreur de consolidation');
      })
      .finally(() => {
        setIsConsolidating(false);
      });
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
                  Ce module sera disponible apres le deploiement Phase 1
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
                    Facturation - Tresorerie - Rapprochement bancaire -
                    Integrations (Qonto)
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleConsolidate}
            disabled={isConsolidating}
          >
            {isConsolidating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Link2 className="h-4 w-4 mr-2" />
            )}
            Consolider liaisons
          </Button>
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
            <Button onClick={() => setShowQuoteForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau devis
            </Button>
          )}
        </div>
      </div>

      {/* KPIs - Only show for factures tab */}
      {activeTab === 'factures' && (
        <KpiGrid columns={4}>
          <KpiCard
            title="Total facture"
            value={kpis.totalFacture}
            valueType="money"
            icon={<FileText className="h-4 w-4" />}
            description={`${kpis.nombreFacturesActives} facture(s) finalisee(s)`}
          />
          <KpiCard
            title="Total paye"
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
              {qontoQuotes.length}
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
              searchPlaceholder="Rechercher par numero, partenaire..."
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
              actions={undefined}
            />
          </div>
        )}

        {/* Contenu des tabs */}
        <TabsContent value="factures" className="mt-4 space-y-4">
          <FacturesTab
            invoices={invoices}
            loading={loadingInvoices}
            statusFilter={statusFilter}
            onView={handleView}
            onDownloadPdf={invoice => {
              void handleDownloadInvoicePdf(invoice).catch(error => {
                console.error(
                  '[Factures] handleDownloadInvoicePdf failed:',
                  error
                );
              });
            }}
            onOpenOrder={orderId => {
              void handleOpenOrderModal(orderId).catch(console.error);
            }}
            onOpenOrg={orgId => {
              setSelectedOrgId(orgId);
              setShowOrgModal(true);
            }}
            onRapprochement={invoice => {
              void handleRapprochement(invoice).catch(console.error);
            }}
            fetchInvoices={() => void fetchInvoices()}
          />
        </TabsContent>

        <TabsContent value="devis" className="mt-4">
          <DevisTab
            quotes={qontoQuotes}
            loading={loadingQuotes}
            error={errorQuotes}
            onRefresh={() => {
              void fetchQontoQuotes().catch((err: unknown) => {
                console.error('[Factures] fetchQontoQuotes failed:', err);
              });
            }}
            onDownloadPdf={quote => {
              void handleDownloadQuotePdf(quote).catch((error: unknown) => {
                console.error(
                  '[Factures] handleDownloadQuotePdf failed:',
                  error
                );
              });
            }}
            onDelete={quote => setQuoteToDelete(quote)}
          />
        </TabsContent>

        <TabsContent value="avoirs" className="mt-4">
          <AvoirsTab
            creditNotes={creditNotes}
            loading={loadingCreditNotes}
            error={errorCreditNotes}
            onRefresh={() => void fetchCreditNotes()}
            onDownloadPdf={creditNote => {
              void handleDownloadCreditNotePdf(creditNote);
            }}
          />
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
                    Ces transactions ont ete rapprochees mais n&apos;ont pas de
                    piece jointe dans Qonto. Uploadez les factures manquantes.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void refreshMissing()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rafraichir
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

      {/* Nouveau formulaire unifie de creation de devis */}
      <QuoteFormModal
        open={showQuoteForm}
        onOpenChange={setShowQuoteForm}
        onSuccess={() => {
          void fetchQontoQuotes().catch((err: unknown) => {
            console.error(
              '[Factures] fetchQontoQuotes after quote create failed:',
              err
            );
          });
        }}
      />

      {/* Legacy modals (kept for backward compatibility with existing Qonto quotes) */}
      <OrderSelectModal
        open={showQuoteOrderSelect}
        onOpenChange={setShowQuoteOrderSelect}
        onSelectOrder={handleQuoteOrderSelected}
      />
      <QuoteCreateFromOrderModal
        order={selectedQuoteOrder}
        open={showQuoteCreate}
        onOpenChange={setShowQuoteCreate}
        onSuccess={handleQuoteCreated}
      />
      <QuoteCreateServiceModal
        open={showQuoteServiceModal}
        onOpenChange={setShowQuoteServiceModal}
        onSuccess={() => {
          void fetchQontoQuotes().catch((err: unknown) => {
            console.error(
              '[Factures] fetchQontoQuotes after legacy quote create failed:',
              err
            );
          });
        }}
      />

      {/* Dialog confirmation suppression devis Qonto */}
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
              onClick={() => {
                void handleDeleteQuote().catch(error => {
                  console.error('[Factures] handleDeleteQuote failed:', error);
                });
              }}
              disabled={deletingQuote}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingQuote ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal detail commande (ouverture en place depuis lien facture) */}
      <OrderDetailModal
        order={selectedOrderForModal}
        open={showOrderModal}
        onClose={() => {
          setShowOrderModal(false);
          setSelectedOrderForModal(null);
        }}
        readOnly
      />

      {/* Modal rapprochement depuis facture */}
      <RapprochementFromOrderModal
        open={showRapprochementModal}
        onOpenChange={setShowRapprochementModal}
        order={rapprochementOrder}
        onSuccess={() => {
          setShowRapprochementModal(false);
          setRapprochementOrder(null);
          void fetchInvoices();
        }}
      />

      {/* Modal quick view organisation (depuis nom client cliquable) */}
      <OrganisationQuickViewModal
        organisationId={selectedOrgId}
        open={showOrgModal}
        onOpenChange={open => {
          setShowOrgModal(open);
          if (!open) setSelectedOrgId(null);
        }}
      />
    </div>
  );
}
