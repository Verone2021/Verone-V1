'use client';

import { useState, useMemo, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { QuickSourcingModal, useSourcingProducts } from '@verone/products';
import { ButtonV2 } from '@verone/ui';
import { colors, spacing } from '@verone/ui/design-system';
import { debounce } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import { Plus } from 'lucide-react';

import { SourcingFilters } from './SourcingFilters';
import { SourcingKpiCards } from './SourcingKpiCards';
import { SourcingProductList } from './SourcingProductList';

export default function SourcingPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourcingTypeFilter, setSourcingTypeFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState<string | null>(null);
  const [isQuickSourcingModalOpen, setIsQuickSourcingModalOpen] =
    useState(false);
  const [completedThisMonth, setCompletedThisMonth] = useState(0);

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearchTerm(value);
      }, 300),
    []
  );

  const {
    products: sourcingProducts,
    loading,
    error,
    validateSourcing,
    archiveSourcingProduct,
    deleteSourcingProduct,
    refetch,
  } = useSourcingProducts({
    search: debouncedSearchTerm ?? undefined,
    product_status: statusFilter === 'all' ? undefined : statusFilter,
    sourcing_type:
      sourcingTypeFilter === 'all'
        ? undefined
        : (sourcingTypeFilter as 'interne' | 'client'),
    supplier_id: supplierFilter ?? undefined,
  });

  useEffect(() => {
    const fetchCompletedCount = async () => {
      try {
        const supabase = createClient();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59
        );
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('creation_mode', 'complete')
          .eq('product_status', 'active')
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString());
        setCompletedThisMonth(count ?? 0);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        console.error(
          '[Sourcing] Erreur chargement produits complétés:',
          message
        );
      }
    };
    void fetchCompletedCount().catch(error => {
      console.error('[Sourcing] fetchCompletedCount failed:', error);
    });
  }, []);

  const stats = {
    totalDrafts:
      sourcingProducts?.filter(p => p.product_status === 'draft').length ?? 0,
    pendingValidation:
      sourcingProducts?.filter(
        p => p.product_status === 'preorder' || p.requires_sample
      ).length ?? 0,
    samplesOrdered:
      sourcingProducts?.filter(
        p => p.requires_sample && p.product_status === 'preorder'
      ).length ?? 0,
    completedThisMonth,
  };

  const handleValidate = (id: string) => {
    void validateSourcing(id).catch(error => {
      console.error('[Sourcing] handleValidateSourcing failed:', error);
    });
  };

  const handleArchive = (id: string) => {
    void archiveSourcingProduct(id).catch(error => {
      console.error('[Sourcing] handleArchiveProduct failed:', error);
    });
  };

  const handleDelete = (id: string) => {
    void deleteSourcingProduct(id).catch(error => {
      console.error('[Sourcing] handleDeleteProduct failed:', error);
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div
        className="flex justify-between items-start"
        style={{ marginBottom: spacing[6] }}
      >
        <div>
          <h1
            className="text-3xl font-semibold"
            style={{ color: colors.text.DEFAULT }}
          >
            Sourcing
          </h1>
          <p className="mt-2" style={{ color: colors.text.subtle }}>
            Gestion des produits à sourcer et validation catalogue
          </p>
        </div>
        <ButtonV2
          variant="primary"
          icon={Plus}
          onClick={() => setIsQuickSourcingModalOpen(true)}
        >
          Nouveau Sourcing
        </ButtonV2>
      </div>

      <SourcingKpiCards stats={stats} loading={loading} />

      <SourcingFilters
        searchTerm={searchTerm}
        onSearchChange={value => {
          setSearchTerm(value);
          debouncedSearch(value);
        }}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sourcingTypeFilter={sourcingTypeFilter}
        onSourcingTypeChange={setSourcingTypeFilter}
        supplierFilter={supplierFilter}
        onSupplierChange={setSupplierFilter}
      />

      <SourcingProductList
        products={sourcingProducts}
        loading={loading}
        error={error}
        onView={id => router.push(`/produits/sourcing/produits/${id}`)}
        onViewSupplier={supplierId =>
          router.push(`/organisations/${supplierId}`)
        }
        onEdit={id => router.push(`/produits/sourcing/produits/${id}`)}
        onValidate={handleValidate}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />

      <QuickSourcingModal
        open={isQuickSourcingModalOpen}
        onClose={() => setIsQuickSourcingModalOpen(false)}
        onSuccess={() => {
          void refetch().catch(error => {
            console.error('[Sourcing] refetch failed:', error);
          });
          setIsQuickSourcingModalOpen(false);
        }}
      />
    </div>
  );
}
