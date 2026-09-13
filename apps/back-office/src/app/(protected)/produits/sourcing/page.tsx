'use client';

import { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  QuickSourcingModal,
  SourcingReasonDialog,
  useSourcingProducts,
  useSourcingSegmentCounts,
} from '@verone/products';
import {
  isSourcingStage,
  type SourcingListSegment,
} from '@verone/products/utils';
import { ButtonV2, ConfirmDialog } from '@verone/ui';
import { colors } from '@verone/ui/design-system';
import { debounce } from '@verone/utils';
import { Chrome, Plus } from 'lucide-react';

import { SourcingReportButton } from '@/components/business/sourcing-report/SourcingReportButton';

import { SourcingFilters } from './SourcingFilters';
import { SourcingKanbanView } from './SourcingKanbanView';
import { SourcingProductList } from './SourcingProductList';
import { SourcingSegmentTabs } from './SourcingSegmentTabs';
import type { SourcingViewMode } from './SourcingViewToggle';
import { SourcingViewToggle } from './SourcingViewToggle';

export default function SourcingPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [segment, setSegment] = useState<SourcingListSegment>('in_progress');
  const [sourcingTypeFilter, setSourcingTypeFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<SourcingViewMode>('list');
  const [isQuickSourcingModalOpen, setIsQuickSourcingModalOpen] =
    useState(false);
  // Retrait avec motif obligatoire et validation confirmée (journal écrit par la base)
  const [withdrawTargetId, setWithdrawTargetId] = useState<string | null>(null);
  const [validateTargetId, setValidateTargetId] = useState<string | null>(null);

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearchTerm(value);
      }, 300),
    []
  );

  const isInProgress = segment === 'in_progress';

  // Tous les filtres sont appliqués par la base (plus de filtrage dans le navigateur)
  const {
    products,
    loading,
    error,
    validateSourcing,
    archiveSourcingProduct,
    unarchiveSourcingProduct,
    deleteSourcingProduct,
    refetch,
  } = useSourcingProducts({
    search: debouncedSearchTerm || undefined,
    sourcing_type:
      sourcingTypeFilter === 'client' || sourcingTypeFilter === 'interne'
        ? sourcingTypeFilter
        : undefined,
    supplier_id: supplierFilter ?? undefined,
    segment,
    stage:
      isInProgress && isSourcingStage(stageFilter) ? stageFilter : undefined,
    priority: priorityFilter === 'all' ? undefined : priorityFilter,
  });

  const {
    counts,
    loading: countsLoading,
    refetch: refetchCounts,
  } = useSourcingSegmentCounts();

  const sortedProducts = useMemo(() => {
    const sorted = [...products];
    sorted.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'name':
          return dir * a.name.localeCompare(b.name);
        case 'cost_price':
          return dir * ((a.cost_price ?? 0) - (b.cost_price ?? 0));
        case 'supplier':
          return (
            dir *
            (
              a.supplier?.trade_name ??
              a.supplier?.legal_name ??
              ''
            ).localeCompare(
              b.supplier?.trade_name ?? b.supplier?.legal_name ?? ''
            )
          );
        case 'created_at':
        default:
          return (
            dir *
            (new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime())
          );
      }
    });
    return sorted;
  }, [products, sortBy, sortDir]);

  // Après une action réussie, les nombres par segment changent aussi
  const afterAction = async (ok: boolean) => {
    if (ok) await refetchCounts();
    return ok;
  };

  const openProduct = (id: string) => {
    router.push(
      segment === 'validated'
        ? `/produits/catalogue/${id}`
        : `/produits/sourcing/produits/${id}`
    );
  };

  const handleRestore = (id: string) => {
    void unarchiveSourcingProduct(id)
      .then(afterAction)
      .catch(error => {
        console.error('[Sourcing] handleRestoreProduct failed:', error);
      });
  };

  const handleDelete = (id: string) => {
    void deleteSourcingProduct(id)
      .then(afterAction)
      .catch(error => {
        console.error('[Sourcing] handleDeleteProduct failed:', error);
      });
  };

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-semibold md:text-3xl"
            style={{ color: colors.text.DEFAULT }}
          >
            Sourcing
          </h1>
          <p className="mt-2" style={{ color: colors.text.subtle }}>
            Produits à sourcer, de la recherche à la validation au catalogue
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SourcingReportButton />
          <ButtonV2
            variant="secondary"
            icon={Chrome}
            onClick={() => router.push('/produits/sourcing/plugin')}
          >
            Plugin navigateur
          </ButtonV2>
          {isInProgress && (
            <SourcingViewToggle view={viewMode} onViewChange={setViewMode} />
          )}
          <ButtonV2
            variant="primary"
            icon={Plus}
            onClick={() => setIsQuickSourcingModalOpen(true)}
          >
            Nouveau sourcing
          </ButtonV2>
        </div>
      </div>

      <SourcingSegmentTabs
        value={segment}
        counts={counts}
        countsLoading={countsLoading}
        onChange={setSegment}
      />

      <SourcingFilters
        searchTerm={searchTerm}
        onSearchChange={value => {
          setSearchTerm(value);
          debouncedSearch(value);
        }}
        sourcingTypeFilter={sourcingTypeFilter}
        onSourcingTypeChange={setSourcingTypeFilter}
        supplierFilter={supplierFilter}
        onSupplierChange={setSupplierFilter}
        showStageFilter={isInProgress}
        stageFilter={stageFilter}
        onStageChange={setStageFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
      />

      {isInProgress && viewMode === 'kanban' && !loading && !error ? (
        <SourcingKanbanView products={sortedProducts} onView={openProduct} />
      ) : (
        <SourcingProductList
          products={sortedProducts}
          segment={segment}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={col => {
            if (sortBy === col) {
              setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
            } else {
              setSortBy(col);
              setSortDir('desc');
            }
          }}
          loading={loading}
          error={error}
          onView={openProduct}
          onViewSupplier={supplierId =>
            router.push(`/contacts-organisations/suppliers/${supplierId}`)
          }
          onEdit={openProduct}
          onValidate={setValidateTargetId}
          onArchive={setWithdrawTargetId}
          onRestore={handleRestore}
          onDelete={handleDelete}
        />
      )}

      <SourcingReasonDialog
        open={withdrawTargetId !== null}
        title="Retirer ce produit"
        description="Le produit quitte la liste active. Le motif est gardé dans le journal ; le produit pourra être restauré."
        confirmLabel="Retirer"
        onClose={() => setWithdrawTargetId(null)}
        onConfirm={reason =>
          withdrawTargetId
            ? archiveSourcingProduct(withdrawTargetId, reason).then(afterAction)
            : Promise.resolve(false)
        }
      />

      <ConfirmDialog
        open={validateTargetId !== null}
        onOpenChange={open => {
          if (!open) setValidateTargetId(null);
        }}
        title="Valider au catalogue"
        description="Le produit quitte le sourcing et rejoint le catalogue en brouillon, non publié. Le stock n'est pas modifié."
        confirmText="Valider au catalogue"
        onConfirm={async () => {
          if (validateTargetId) {
            await afterAction(await validateSourcing(validateTargetId));
          }
        }}
      />

      <QuickSourcingModal
        open={isQuickSourcingModalOpen}
        onClose={() => setIsQuickSourcingModalOpen(false)}
        onSuccess={() => {
          void Promise.all([refetch(), refetchCounts()]).catch(error => {
            console.error('[Sourcing] refetch failed:', error);
          });
          setIsQuickSourcingModalOpen(false);
        }}
      />
    </div>
  );
}
