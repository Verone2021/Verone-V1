'use client';

import { useState, useMemo } from 'react';

import {
  useFinancialDocuments,
  useMissingInvoices,
  type DocumentType,
  type DocumentStatus,
  type TransactionMissingInvoice,
} from '@verone/finance';
import {
  InvoiceUploadModal,
  InvoiceCreateFromOrderModal,
  InvoiceCreateServiceModal,
  OrderSelectModal,
  type TransactionForUpload,
  type IOrderForInvoice,
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
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  RefreshCw,
  Upload,
  AlertTriangle,
  Paperclip,
  Briefcase,
  ChevronDown,
  ShoppingCart,
} from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

type TabType = 'clients' | 'fournisseurs' | 'depenses' | 'manquantes';

const tabToDocumentType: Record<
  Exclude<TabType, 'manquantes'>,
  DocumentType[]
> = {
  clients: ['customer_invoice', 'customer_credit_note'],
  fournisseurs: ['supplier_invoice', 'supplier_credit_note'],
  depenses: ['expense'],
};

// =====================================================================
// COMPOSANT: TABLEAU DE FACTURES
// =====================================================================

function FacturesTable({
  documents,
  loading,
  onView,
}: {
  documents: Array<{
    id: string;
    document_number: string;
    document_type: DocumentType;
    document_date: string;
    due_date: string | null;
    total_ttc: number;
    amount_paid: number;
    status: DocumentStatus;
    partner?: { legal_name: string } | null;
  }>;
  loading: boolean;
  onView: (id: string) => void;
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

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Aucune facture trouvée</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 text-sm font-medium">Document</th>
            <th className="text-left p-3 text-sm font-medium">Partenaire</th>
            <th className="text-left p-3 text-sm font-medium">Date</th>
            <th className="text-left p-3 text-sm font-medium">Echéance</th>
            <th className="text-right p-3 text-sm font-medium">Montant TTC</th>
            <th className="text-right p-3 text-sm font-medium">Payé</th>
            <th className="text-center p-3 text-sm font-medium">Statut</th>
            <th className="text-right p-3 text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map(doc => (
            <tr key={doc.id} className="border-t hover:bg-muted/30">
              <td className="p-3">
                <DocumentBadge
                  documentNumber={doc.document_number}
                  documentType={
                    doc.document_type as
                      | 'customer_invoice'
                      | 'supplier_invoice'
                      | 'expense'
                  }
                />
              </td>
              <td className="p-3">
                {doc.partner ? (
                  <PartnerChipMini
                    name={doc.partner.legal_name}
                    roles={[
                      doc.document_type.includes('customer')
                        ? 'customer'
                        : 'supplier_goods',
                    ]}
                  />
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="p-3 text-sm">
                {new Date(doc.document_date).toLocaleDateString('fr-FR')}
              </td>
              <td className="p-3 text-sm">
                {doc.due_date ? (
                  <span
                    className={
                      new Date(doc.due_date) < new Date() &&
                      doc.status !== 'paid'
                        ? 'text-red-600 font-medium'
                        : ''
                    }
                  >
                    {new Date(doc.due_date).toLocaleDateString('fr-FR')}
                  </span>
                ) : (
                  '-'
                )}
              </td>
              <td className="p-3 text-right">
                <Money amount={doc.total_ttc} size="sm" />
              </td>
              <td className="p-3 text-right">
                <Money amount={doc.amount_paid} size="sm" colorize />
              </td>
              <td className="p-3 text-center">
                <StatusPill status={doc.status} size="sm" />
              </td>
              <td className="p-3 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onView(doc.id)}
                >
                  <Eye className="h-4 w-4" />
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

export default function FacturesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('clients');
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

  // Récupérer les documents financiers (sauf pour l'onglet manquantes)
  const { documents, loading, error, stats, refresh } = useFinancialDocuments({
    document_type:
      activeTab !== 'manquantes' ? tabToDocumentType[activeTab] : undefined,
    status:
      statusFilter !== 'all' ? (statusFilter as DocumentStatus) : undefined,
    search: search || undefined,
  });

  // Récupérer les transactions sans facture
  const {
    transactions: missingInvoices,
    loading: loadingMissing,
    error: errorMissing,
    refresh: refreshMissing,
    count: missingCount,
  } = useMissingInvoices();

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
    refresh();
  };

  // Calculer les KPIs
  const kpis = useMemo(() => {
    if (activeTab === 'manquantes') {
      return {
        totalFacture: 0,
        totalPaye: 0,
        enAttente: missingCount,
        montantEnAttente: missingInvoices.reduce(
          (sum, tx) => sum + Math.abs(tx.amount),
          0
        ),
        enRetard: 0,
        montantEnRetard: 0,
      };
    }

    const filtered = documents.filter(d =>
      tabToDocumentType[activeTab].includes(d.document_type)
    );

    const totalFacture = filtered.reduce((sum, d) => sum + d.total_ttc, 0);
    const totalPaye = filtered.reduce((sum, d) => sum + d.amount_paid, 0);
    const enRetard = filtered.filter(
      d =>
        d.due_date &&
        new Date(d.due_date) < new Date() &&
        d.status !== 'paid' &&
        d.status !== 'cancelled'
    );
    const enAttente = filtered.filter(
      d => d.status !== 'paid' && d.status !== 'cancelled'
    );

    return {
      totalFacture,
      totalPaye,
      enAttente: enAttente.length,
      montantEnAttente: enAttente.reduce(
        (sum, d) => sum + (d.total_ttc - d.amount_paid),
        0
      ),
      enRetard: enRetard.length,
      montantEnRetard: enRetard.reduce(
        (sum, d) => sum + (d.total_ttc - d.amount_paid),
        0
      ),
    };
  }, [documents, activeTab, missingCount, missingInvoices]);

  // Handler pour voir une facture
  const handleView = (id: string) => {
    window.location.href = `/factures/${id}`;
  };

  // Handler sync Qonto
  const handleSync = async () => {
    try {
      const response = await fetch('/api/qonto/sync', {
        method: 'POST',
      });
      const result = await response.json();

      if (!result.success) {
        console.error('[Qonto Sync] Failed:', result.message);
      } else {
        console.log('[Qonto Sync] Success:', result);
      }

      refresh();
    } catch (error) {
      console.error('[Qonto Sync] Error:', error);
      refresh();
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
          <h1 className="text-2xl font-bold">Factures</h1>
          <p className="text-muted-foreground">
            Gestion des factures clients et fournisseurs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SyncButton onSync={handleSync} label="Sync Qonto" showLastSync />
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
        </div>
      </div>

      {/* KPIs */}
      <KpiGrid columns={4}>
        <KpiCard
          title="Total facturé"
          value={kpis.totalFacture}
          valueType="money"
          icon={<FileText className="h-4 w-4" />}
          description={`${documents.length} document(s)`}
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabType)}>
        <TabsList>
          <TabsTrigger value="clients">
            Factures clients
            <Badge variant="secondary" className="ml-2">
              {
                documents.filter(d =>
                  ['customer_invoice', 'customer_credit_note'].includes(
                    d.document_type
                  )
                ).length
              }
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="fournisseurs">
            Factures fournisseurs
            <Badge variant="secondary" className="ml-2">
              {
                documents.filter(d =>
                  ['supplier_invoice', 'supplier_credit_note'].includes(
                    d.document_type
                  )
                ).length
              }
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="depenses">
            Dépenses
            <Badge variant="secondary" className="ml-2">
              {documents.filter(d => d.document_type === 'expense').length}
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

        {/* Toolbar */}
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
                  { value: 'cancelled', label: 'Annulee' },
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
            loading={loading}
            resultCount={documents.length}
            actions={
              <Button variant="outline" size="sm" disabled>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            }
          />
        </div>

        {/* Contenu des tabs */}
        <TabsContent value="clients" className="mt-4">
          <FacturesTable
            documents={documents.filter(d =>
              ['customer_invoice', 'customer_credit_note'].includes(
                d.document_type
              )
            )}
            loading={loading}
            onView={handleView}
          />
        </TabsContent>

        <TabsContent value="fournisseurs" className="mt-4">
          <FacturesTable
            documents={documents.filter(d =>
              ['supplier_invoice', 'supplier_credit_note'].includes(
                d.document_type
              )
            )}
            loading={loading}
            onView={handleView}
          />
        </TabsContent>

        <TabsContent value="depenses" className="mt-4">
          <FacturesTable
            documents={documents.filter(d => d.document_type === 'expense')}
            loading={loading}
            onView={handleView}
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
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
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
          refresh();
        }}
      />
    </div>
  );
}
