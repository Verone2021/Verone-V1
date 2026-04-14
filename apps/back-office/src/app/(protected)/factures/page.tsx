'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  KpiCard,
  KpiGrid,
  DataTableToolbar,
  SyncButton,
} from '@verone/ui-business';
import { featureFlags } from '@verone/utils/feature-flags';
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
  FileEdit,
  FileX,
  Loader2,
  Link2,
} from 'lucide-react';

import type { TabType } from './components/types';
import { FacturesTab } from './components/FacturesTab';
import { DevisTab } from './components/DevisTab';
import { AvoirsTab } from './components/AvoirsTab';
import { MissingInvoicesTable } from './components/MissingInvoicesTable';
import { FacturesModals } from './components/FacturesModals';
import { useFacturesPage } from './hooks/use-factures-page';

export default function FacturationPage() {
  const router = useRouter();
  const {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    showUploadModal,
    setShowUploadModal,
    selectedMissingTx,
    transactionForUpload,
    handleOpenUpload,
    invoices,
    loadingInvoices,
    errorInvoices,
    fetchInvoices,
    kpis,
    handleDownloadInvoicePdf,
    qontoQuotes,
    loadingQuotes,
    errorQuotes,
    quoteToDelete,
    setQuoteToDelete,
    deletingQuote,
    handleDeleteQuote,
    handleDownloadQuotePdf,
    fetchQontoQuotes,
    creditNotes,
    loadingCreditNotes,
    errorCreditNotes,
    handleDownloadCreditNotePdf,
    fetchCreditNotes,
    missingInvoices,
    loadingMissing,
    errorMissing,
    refreshMissing,
    missingCount,
    selectedOrderForModal,
    showOrderModal,
    setShowOrderModal,
    setSelectedOrderForModal,
    handleOpenOrderModal,
    selectedOrgId,
    setSelectedOrgId,
    showOrgModal,
    setShowOrgModal,
    showRapprochementModal,
    setShowRapprochementModal,
    rapprochementOrder,
    setRapprochementOrder,
    handleRapprochement,
    isConsolidating,
    handleConsolidate,
    handleSync,
    handleView,
  } = useFacturesPage();

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
            <Button onClick={() => router.push('/factures/nouvelle')}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle facture
            </Button>
          )}
          {activeTab === 'devis' && (
            <Button onClick={() => router.push('/devis/nouveau')}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau devis
            </Button>
          )}
        </div>
      </div>

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

        <TabsContent value="factures" className="mt-4 space-y-4">
          <FacturesTab
            invoices={invoices}
            loading={loadingInvoices}
            statusFilter={statusFilter}
            onView={handleView}
            onDownloadPdf={invoice => {
              handleDownloadInvoicePdf(invoice);
            }}
            onOpenOrder={orderId => {
              handleOpenOrderModal(orderId);
            }}
            onOpenOrg={orgId => {
              setSelectedOrgId(orgId);
              setShowOrgModal(true);
            }}
            onRapprochement={invoice => {
              handleRapprochement(invoice);
            }}
            fetchInvoices={fetchInvoices}
            onDeleteDraft={async invoice => {
              if (
                !confirm(
                  `Supprimer le brouillon ${invoice.number ?? invoice.id} ?`
                )
              )
                return;
              try {
                const response = await fetch(
                  `/api/qonto/invoices/${invoice.id}/delete`,
                  { method: 'DELETE' }
                );
                const data = (await response.json()) as {
                  success?: boolean;
                  error?: string;
                };
                if (!response.ok || !data.success)
                  throw new Error(
                    data.error ?? 'Erreur lors de la suppression'
                  );
                fetchInvoices();
              } catch (error) {
                console.error('[Factures] Delete draft error:', error);
              }
            }}
          />
        </TabsContent>

        <TabsContent value="devis" className="mt-4">
          <DevisTab
            quotes={qontoQuotes}
            loading={loadingQuotes}
            error={errorQuotes}
            onRefresh={() => {
              fetchQontoQuotes();
            }}
            onDownloadPdf={quote => {
              handleDownloadQuotePdf(quote);
            }}
            onDelete={quote => setQuoteToDelete(quote)}
          />
        </TabsContent>

        <TabsContent value="avoirs" className="mt-4">
          <AvoirsTab
            creditNotes={creditNotes}
            loading={loadingCreditNotes}
            error={errorCreditNotes}
            onRefresh={() => fetchCreditNotes()}
            onDownloadPdf={creditNote => {
              handleDownloadCreditNotePdf(creditNote);
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
                    piece jointe dans Qonto.
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

      <FacturesModals
        transactionForUpload={transactionForUpload}
        showUploadModal={showUploadModal}
        setShowUploadModal={setShowUploadModal}
        onUploadComplete={() => {
          void refreshMissing();
          setShowUploadModal(false);
        }}
        quoteToDelete={quoteToDelete}
        setQuoteToDelete={setQuoteToDelete}
        deletingQuote={deletingQuote}
        onDeleteQuote={handleDeleteQuote}
        selectedOrderForModal={selectedOrderForModal}
        showOrderModal={showOrderModal}
        onCloseOrderModal={() => {
          setShowOrderModal(false);
          setSelectedOrderForModal(null);
        }}
        showRapprochementModal={showRapprochementModal}
        setShowRapprochementModal={setShowRapprochementModal}
        rapprochementOrder={rapprochementOrder}
        onRapprochementSuccess={() => {
          setShowRapprochementModal(false);
          setRapprochementOrder(null);
          fetchInvoices();
        }}
        selectedOrgId={selectedOrgId}
        showOrgModal={showOrgModal}
        onOrgModalChange={open => {
          setShowOrgModal(open);
          if (!open) setSelectedOrgId(null);
        }}
        selectedMissingTx={selectedMissingTx}
      />
    </div>
  );
}
