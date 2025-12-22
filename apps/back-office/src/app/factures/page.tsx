'use client';

import { useState, useMemo } from 'react';

import {
  useFinancialDocuments,
  type DocumentType,
  type DocumentStatus,
} from '@verone/finance';
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
} from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

type TabType = 'clients' | 'fournisseurs' | 'depenses';

const tabToDocumentType: Record<TabType, DocumentType[]> = {
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
// PAGE COMPONENT
// =====================================================================

export default function FacturesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('clients');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Récupérer les documents financiers
  const { documents, loading, error, stats, refresh } = useFinancialDocuments({
    document_type: tabToDocumentType[activeTab],
    status:
      statusFilter !== 'all' ? (statusFilter as DocumentStatus) : undefined,
    search: search || undefined,
  });

  // Calculer les KPIs
  const kpis = useMemo(() => {
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
  }, [documents, activeTab]);

  // Handler pour voir une facture
  const handleView = (id: string) => {
    window.location.href = `/factures/${id}`;
  };

  // Handler sync Qonto
  const handleSync = async () => {
    // TODO: Implémenter la sync Qonto
    await new Promise(resolve => setTimeout(resolve, 2000));
    refresh();
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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle facture
          </Button>
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
                  { value: 'sent', label: 'Envoyée' },
                  { value: 'paid', label: 'Payée' },
                  { value: 'partially_paid', label: 'Paiement partiel' },
                  { value: 'overdue', label: 'En retard' },
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
            onRefresh={refresh}
            loading={loading}
            resultCount={documents.length}
            actions={
              <Button variant="outline" size="sm">
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
    </div>
  );
}
