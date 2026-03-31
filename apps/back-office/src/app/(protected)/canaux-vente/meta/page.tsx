'use client';

import { useState, useMemo } from 'react';

import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { useMetaCommerceProducts } from '@verone/channels';
import { cn } from '@verone/utils';
import { useQueryClient } from '@tanstack/react-query';

import { AddProductsTab } from './add-products-tab';
import { MetaFiltersBar } from './_components/meta-filters';
import { MetaHeader } from './_components/meta-header';
import { MetaProductsTable } from './_components/meta-products-table';
import { MetaStatsCards } from './_components/meta-stats-cards';
import { DEFAULT_META_FILTERS } from './_components/types';
import type { MetaFilters } from './_components/types';

export default function MetaCommercePage() {
  const [activeTab, setActiveTab] = useState<'synced' | 'add'>('synced');
  const [isSyncing, setIsSyncing] = useState(false);
  const [filters, setFilters] = useState<MetaFilters>(DEFAULT_META_FILTERS);
  const queryClient = useQueryClient();
  const { data: products, isLoading } = useMetaCommerceProducts();

  async function handleSyncStatuses() {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/meta-commerce/sync-statuses', {
        method: 'POST',
      });
      const data = (await res.json()) as {
        error?: string;
        updated?: number;
        meta_products_found?: number;
      };
      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors de la synchronisation');
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: ['meta-commerce-products'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['meta-commerce-stats'],
      });
      toast.success(
        `${data.updated ?? 0} produits mis a jour sur ${data.meta_products_found ?? 0} trouves sur Meta`
      );
    } catch (err) {
      console.error('[MetaCommerce] Sync failed:', err);
      toast.error('Erreur de connexion');
    } finally {
      setIsSyncing(false);
    }
  }

  const filtered = useMemo(() => {
    if (!products) return [];
    let result = [...products];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        p =>
          p.product_name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    if (filters.status !== 'all') {
      if (filters.status === 'error') {
        result = result.filter(p => p.sync_status === 'error');
      } else {
        result = result.filter(p => p.meta_status === filters.status);
      }
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (filters.sortBy) {
        case 'name':
          cmp = a.product_name.localeCompare(b.product_name);
          break;
        case 'sku':
          cmp = a.sku.localeCompare(b.sku);
          break;
        case 'price':
          cmp =
            (a.custom_price_ht ?? a.cost_price * 2.5) -
            (b.custom_price_ht ?? b.cost_price * 2.5);
          break;
        case 'status':
          cmp = (a.meta_status ?? '').localeCompare(b.meta_status ?? '');
          break;
        case 'synced_at':
          cmp =
            new Date(b.synced_at).getTime() - new Date(a.synced_at).getTime();
          break;
      }
      return filters.sortOrder === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [products, filters]);

  return (
    <div className="space-y-6">
      <MetaHeader
        isSyncing={isSyncing}
        onSyncStatuses={() => {
          void handleSyncStatuses().catch((err: unknown) => {
            console.error('[MetaCommerce] Sync error:', err);
          });
        }}
      />

      <MetaStatsCards />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-blue-900">
            Synchronisation automatique via Feed XML
          </p>
          <p className="text-blue-700 mt-1">
            Meta recupere le feed (veronecollections.fr/api/feeds/products.xml)
            toutes les heures. Les statuts se mettent a jour 24-48h apres
            publication.
          </p>
        </div>
      </div>

      <div className="border-b">
        <div className="flex gap-4">
          <button
            type="button"
            className={cn(
              'pb-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'synced'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab('synced')}
          >
            Produits synchronises ({products?.length ?? 0})
          </button>
          <button
            type="button"
            className={cn(
              'pb-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'add'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab('add')}
          >
            Ajouter des produits
          </button>
        </div>
      </div>

      {activeTab === 'synced' ? (
        <div className="space-y-4">
          <MetaFiltersBar
            filters={filters}
            onFiltersChange={setFilters}
            resultCount={filtered.length}
          />
          <MetaProductsTable products={filtered} loading={isLoading} />
        </div>
      ) : (
        <AddProductsTab />
      )}
    </div>
  );
}
