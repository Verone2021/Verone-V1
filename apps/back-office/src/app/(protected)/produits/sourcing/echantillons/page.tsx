'use client';

/**
 * Page: Échantillons (Sourcing)
 * Description: Gestion complète échantillons internes et clients
 *
 * Features:
 * - Tabs: Actifs | Archivés
 * - Archive/Réactive/Réinsertion échantillons
 * - Badges client (B2B/B2C) + sample_type
 * - Actions conditionnelles selon statut PO
 * - Modal création échantillon client
 */

import { useRouter } from 'next/navigation';

import type { CustomerSample } from '@verone/customers';
import { Button } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import {
  AlertTriangle,
  Archive,
  Building,
  Package,
  Plus,
  RefreshCw,
  Search,
  User,
} from 'lucide-react';

import { SampleFormDialog } from './echantillons-form';
import {
  ActiveSamplesTab,
  ArchivedSamplesTab,
  DeleteConfirmDialog,
} from './echantillons-table';
import { useEchantillons } from './use-echantillons';

// ---------------------------------------------------------------------------
// Loading / Error states
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4" />
        <p className="text-gray-600">Chargement des échantillons...</p>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="max-w-md border-red-300">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Erreur de chargement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{message}</p>
          <Button
            onClick={onRetry}
            className="bg-black hover:bg-gray-800 text-white"
          >
            Réessayer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SamplesTabsSection
// ---------------------------------------------------------------------------

interface SamplesTabsSectionProps {
  activeTab: 'active' | 'archived';
  onTabChange: (tab: 'active' | 'archived') => void;
  samples: CustomerSample[];
  statsActive: number;
  statsArchived: number;
  onArchive: (id: string) => void;
  onReactivate: (id: string) => void;
  onReinsert: (id: string) => void;
  onDelete: (id: string) => void;
}

function SamplesTabsSection({
  activeTab,
  onTabChange,
  samples,
  statsActive,
  statsArchived,
  onArchive,
  onReactivate,
  onReinsert,
  onDelete,
}: SamplesTabsSectionProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={v => onTabChange(v as 'active' | 'archived')}
    >
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="active">Actifs ({statsActive})</TabsTrigger>
        <TabsTrigger value="archived">Archivés ({statsArchived})</TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="mt-6">
        <ActiveSamplesTab samples={samples} onArchive={onArchive} />
      </TabsContent>

      <TabsContent value="archived" className="mt-6">
        <ArchivedSamplesTab
          samples={samples}
          onReactivate={onReactivate}
          onReinsert={onReinsert}
          onDelete={onDelete}
        />
      </TabsContent>
    </Tabs>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SourcingEchantillonsPage() {
  const router = useRouter();
  const ctx = useEchantillons();

  if (ctx.loading) return <LoadingState />;
  if (ctx.error)
    return <ErrorState message={ctx.error} onRetry={ctx.handleRefresh} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        onBack={() => router.push('/produits/sourcing')}
        onNew={() => ctx.setShowSampleForm(true)}
      />
      <div className="container mx-auto px-4 py-8">
        <StatsCards stats={ctx.stats} />
        <FiltersBar
          filters={ctx.filters}
          onSearchChange={ctx.setSearchTerm}
          onStatusChange={ctx.setStatusFilter}
          onTypeChange={ctx.setTypeFilter}
          onRefresh={ctx.handleRefresh}
        />
        <SamplesTabsSection
          activeTab={ctx.activeTab}
          onTabChange={ctx.setActiveTab}
          samples={ctx.filteredSamples}
          statsActive={ctx.stats.active}
          statsArchived={ctx.stats.archived}
          onArchive={id => {
            void ctx.handleArchive(id).catch(err => {
              console.error('[EchantillonsPage] Archive failed:', err);
            });
          }}
          onReactivate={id => {
            void ctx.handleReactivate(id).catch(err => {
              console.error('[EchantillonsPage] Reactivate failed:', err);
            });
          }}
          onReinsert={id => {
            void ctx.handleReinsert(id).catch(err => {
              console.error('[EchantillonsPage] Reinsert failed:', err);
            });
          }}
          onDelete={ctx.handleDeleteClick}
        />
      </div>
      <PageDialogs ctx={ctx} />
    </div>
  );
}

type PageCtx = ReturnType<typeof useEchantillons>;

function PageDialogs({ ctx }: { ctx: PageCtx }) {
  return (
    <>
      <SampleFormDialog
        open={ctx.showSampleForm}
        onOpenChange={ctx.setShowSampleForm}
        selectedCustomer={ctx.selectedCustomer}
        onCustomerChange={ctx.handleCustomerChange}
        selectedProduct={ctx.selectedProduct}
        selectedProductId={ctx.selectedProductId}
        showProductModal={ctx.showProductModal}
        onOpenProductModal={() => ctx.setShowProductModal(true)}
        onProductSelect={ctx.handleProductSelect}
        onCloseProductModal={() => ctx.setShowProductModal(false)}
        quantity={ctx.quantity}
        onQuantityChange={ctx.setQuantity}
        deliveryAddress={ctx.deliveryAddress}
        onDeliveryAddressChange={ctx.setDeliveryAddress}
        notes={ctx.notes}
        onNotesChange={ctx.setNotes}
        submitting={ctx.submitting}
        onSubmit={ctx.handleSubmit}
      />
      <DeleteConfirmDialog
        open={ctx.deleteConfirmOpen}
        onOpenChange={ctx.setDeleteConfirmOpen}
        onConfirm={() => {
          void ctx.handleDeleteConfirm().catch(err => {
            console.error('[EchantillonsPage] Delete confirm failed:', err);
          });
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components (UI-only, no hooks)
// ---------------------------------------------------------------------------

interface PageHeaderProps {
  onBack: () => void;
  onNew: () => void;
}

function PageHeader({ onBack, onNew }: PageHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">Échantillons</h1>
            <p className="text-gray-600 mt-1">
              Gestion échantillons internes et clients
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={onBack}
              className="border-black text-black hover:bg-black hover:text-white"
            >
              Retour Dashboard
            </Button>
            <Button
              onClick={onNew}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Échantillon
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatsCardsProps {
  stats: {
    active: number;
    archived: number;
    internal: number;
    customer: number;
  };
}

function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <Card className="border-black">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Actifs
          </CardTitle>
          <Package className="h-4 w-4 text-black" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-black">{stats.active}</div>
          <p className="text-xs text-gray-600">échantillons actifs</p>
        </CardContent>
      </Card>

      <Card className="border-black">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Archivés
          </CardTitle>
          <Archive className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-black">{stats.archived}</div>
          <p className="text-xs text-gray-600">échantillons archivés</p>
        </CardContent>
      </Card>

      <Card className="border-black">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Internes
          </CardTitle>
          <Building className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-black">{stats.internal}</div>
          <p className="text-xs text-gray-600">catalogue sourcing</p>
        </CardContent>
      </Card>

      <Card className="border-black">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Clients
          </CardTitle>
          <User className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-black">{stats.customer}</div>
          <p className="text-xs text-gray-600">B2B + B2C</p>
        </CardContent>
      </Card>
    </div>
  );
}

interface FiltersBarProps {
  filters: { searchTerm: string; statusFilter: string; typeFilter: string };
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onRefresh: () => void;
}

function FiltersBar({
  filters,
  onSearchChange,
  onStatusChange,
  onTypeChange,
  onRefresh,
}: FiltersBarProps) {
  return (
    <Card className="border-black mb-6">
      <CardHeader>
        <CardTitle className="text-black">Filtres et Recherche</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher..."
              value={filters.searchTerm}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-10 border-black focus:ring-black"
            />
          </div>

          <Select value={filters.statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="border-black">
              <SelectValue placeholder="Statut PO" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="ordered">Commandé</SelectItem>
              <SelectItem value="received">Reçu</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.typeFilter} onValueChange={onTypeChange}>
            <SelectTrigger className="border-black">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="internal">Internes</SelectItem>
              <SelectItem value="customer">Clients</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={onRefresh}
            className="border-black text-black hover:bg-black hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
