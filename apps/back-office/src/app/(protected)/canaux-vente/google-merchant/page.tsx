'use client';

import { useState, useMemo } from 'react';

import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { useGoogleMerchantProducts } from '@verone/channels';
import { cn } from '@verone/utils';
import { useQueryClient } from '@tanstack/react-query';

import { AddProductsTab } from './add-products-tab';
import { GmFiltersBar } from './_components/gm-filters';
import { GmHeader } from './_components/gm-header';
import { GmProductsTable } from './_components/gm-products-table';
import { GmStatsCards } from './_components/gm-stats-cards';
import { DEFAULT_GM_FILTERS } from './_components/types';
import type { GoogleMerchantFilters } from './_components/types';

export default function GoogleMerchantPage() {
  const [activeTab, setActiveTab] = useState<'synced' | 'add'>('synced');
  const [isSyncing, setIsSyncing] = useState(false);
  const [filters, setFilters] =
    useState<GoogleMerchantFilters>(DEFAULT_GM_FILTERS);
  const queryClient = useQueryClient();
  const { data: products, isLoading } = useGoogleMerchantProducts();

  async function handleSyncStatuses() {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/google-merchant/poll-statuses', {
        method: 'POST',
      });
      const data = (await res.json()) as {
        error?: string;
        updated?: number;
        total?: number;
      };
      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors de la synchronisation');
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: ['google-merchant-products'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['google-merchant-stats'],
      });
      toast.success(
        `${data.updated ?? 0} produits mis a jour sur ${data.total ?? 0} synchronises`
      );
    } catch (err) {
      console.error('[GoogleMerchant] Sync failed:', err);
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
        result = result.filter(p => p.google_status === filters.status);
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
          cmp = a.revenue_ht - b.revenue_ht;
          break;
        case 'status':
          cmp = (a.google_status ?? '').localeCompare(b.google_status ?? '');
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
      <GmHeader
        isSyncing={isSyncing}
        onSyncStatuses={() => {
          void handleSyncStatuses().catch((err: unknown) => {
            console.error('[GoogleMerchant] Sync error:', err);
          });
        }}
      />

      <GmStatsCards />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-blue-900">
            Source : produits publies sur le site internet
          </p>
          <p className="text-blue-700 mt-1">
            Seuls les produits actifs sur veronecollections.fr sont
            selectionnables. Google Merchant redirige vers la fiche produit du
            site.
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
          <GmFiltersBar
            filters={filters}
            onFiltersChange={setFilters}
            resultCount={filtered.length}
          />
          <GmProductsTable products={filtered} loading={isLoading} />
        </div>
      ) : (
        <AddProductsTab />
      )}
    </div>
  );
}
