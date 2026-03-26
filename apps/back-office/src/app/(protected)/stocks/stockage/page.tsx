'use client';

/**
 * Page Stockage & Facturation - Back-Office Core
 *
 * Vue globale du stockage entrepot avec suivi m3 et facturation
 *
 * @module StockagePage
 * @since 2025-12-20
 */

import Link from 'next/link';

import { Button, Input, Switch } from '@verone/ui';
import {
  Box,
  Building2,
  ChevronRight,
  Filter,
  Loader2,
  Package,
  Plus,
  Search,
  Settings,
  TrendingUp,
  Users,
  Warehouse,
} from 'lucide-react';

import {
  formatVolumeM3,
  type GlobalStorageOverviewItem,
} from './hooks/use-storage-billing';
import { AddAllocationDialog } from './stockage-dialogs';
import { OwnerStorageDetail } from './stockage-owner-dialog';
import { type OwnerTypeFilter } from './stockage-types';
import { useStockage } from './use-stockage';

type KPIColor = 'blue' | 'green' | 'purple' | 'orange' | 'gray';

const KPI_COLOR_CLASSES: Record<KPIColor, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
  gray: 'bg-gray-50 text-gray-600',
};

function KPICard({
  icon: Icon,
  label,
  value,
  color,
  isLoading,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: KPIColor;
  isLoading?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${KPI_COLOR_CLASSES[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          {isLoading ? (
            <div className="h-7 w-20 bg-gray-100 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-bold">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StockageKPIs({
  totals,
  isLoading,
}: {
  totals: ReturnType<typeof useStockage>['totals'];
  isLoading: boolean;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
      <KPICard
        icon={Box}
        label="Volume total"
        value={formatVolumeM3(totals?.total_volume_m3 ?? 0)}
        color="blue"
        isLoading={isLoading}
      />
      <KPICard
        icon={TrendingUp}
        label="Volume facturable"
        value={formatVolumeM3(totals?.billable_volume_m3 ?? 0)}
        color="green"
        isLoading={isLoading}
      />
      <KPICard
        icon={Package}
        label="Unites stockees"
        value={`${totals?.total_units ?? 0}`}
        color="purple"
        isLoading={isLoading}
      />
      <KPICard
        icon={Users}
        label="Owners actifs"
        value={`${totals?.active_owners ?? 0}`}
        color="orange"
        isLoading={isLoading}
      />
      <KPICard
        icon={Building2}
        label="Produits"
        value={`${totals?.products_count ?? 0}`}
        color="gray"
        isLoading={isLoading}
      />
    </div>
  );
}

function StockageFilters({
  searchTerm,
  setSearchTerm,
  ownerTypeFilter,
  setOwnerTypeFilter,
  showBillableOnly,
  setShowBillableOnly,
}: {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  ownerTypeFilter: OwnerTypeFilter;
  setOwnerTypeFilter: (v: OwnerTypeFilter) => void;
  showBillableOnly: boolean;
  setShowBillableOnly: (v: boolean) => void;
}) {
  return (
    <div className="bg-white rounded-xl border p-4 mb-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un owner..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filtres:</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Type:</span>
          <div className="flex gap-1">
            {(['all', 'enseigne', 'organisation'] as const).map(type => (
              <Button
                key={type}
                variant={ownerTypeFilter === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOwnerTypeFilter(type)}
              >
                {type === 'all'
                  ? 'Tous'
                  : type === 'enseigne'
                    ? 'Enseignes'
                    : 'Organisations'}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Switch
            checked={showBillableOnly}
            onCheckedChange={setShowBillableOnly}
            id="billable-filter"
          />
          <label
            htmlFor="billable-filter"
            className="text-sm text-gray-600 cursor-pointer"
          >
            Facturable uniquement
          </label>
        </div>
      </div>
    </div>
  );
}

function OverviewTableRow({
  item,
  onSelect,
}: {
  item: GlobalStorageOverviewItem;
  onSelect: (item: GlobalStorageOverviewItem) => void;
}) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <p className="font-medium text-gray-900">{item.owner_name ?? '-'}</p>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.owner_type === 'enseigne' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}
        >
          {item.owner_type === 'enseigne' ? 'Enseigne' : 'Organisation'}
        </span>
      </td>
      <td className="px-6 py-4 text-right font-medium">{item.total_units}</td>
      <td className="px-6 py-4 text-right">
        {formatVolumeM3(item.total_volume_m3)}
      </td>
      <td className="px-6 py-4 text-right">
        <span className="text-green-600 font-medium">
          {formatVolumeM3(item.billable_volume_m3)}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        {item.products_count}
        {item.billable_products_count < item.products_count && (
          <span className="text-gray-400 text-sm ml-1">
            ({item.billable_products_count} fact.)
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <Button variant="ghost" size="sm" onClick={() => onSelect(item)}>
          Details
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </td>
    </tr>
  );
}

function EmptyStorageState({
  overview,
}: {
  overview: GlobalStorageOverviewItem[] | undefined;
}) {
  return (
    <div className="bg-white rounded-xl p-12 text-center border">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Warehouse className="h-8 w-8 text-gray-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Aucun stockage
      </h2>
      <p className="text-gray-500">
        {overview && overview.length > 0
          ? 'Aucun owner ne correspond aux filtres'
          : "Aucun owner n'a de produits en stockage"}
      </p>
    </div>
  );
}

function StockageOverviewTable({
  isLoading,
  filteredOverview,
  overview,
  onSelect,
}: {
  isLoading: boolean;
  filteredOverview: GlobalStorageOverviewItem[];
  overview: GlobalStorageOverviewItem[] | undefined;
  onSelect: (item: GlobalStorageOverviewItem) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }
  if (filteredOverview.length === 0) {
    return <EmptyStorageState overview={overview} />;
  }
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
              Owner
            </th>
            <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
              Type
            </th>
            <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">
              Unites
            </th>
            <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">
              Volume total
            </th>
            <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">
              Volume facturable
            </th>
            <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">
              Produits
            </th>
            <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {filteredOverview.map(item => (
            <OverviewTableRow
              key={`${item.owner_type}-${item.owner_id}`}
              item={item}
              onSelect={onSelect}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function StockagePage() {
  const {
    totals,
    totalsLoading,
    overview,
    isLoading,
    filteredOverview,
    refetch,
    selectedOwner,
    setSelectedOwner,
    ownerTypeFilter,
    setOwnerTypeFilter,
    showBillableOnly,
    setShowBillableOnly,
    showAddDialog,
    setShowAddDialog,
    searchTerm,
    setSearchTerm,
  } = useStockage();

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Stockage & Facturation
          </h1>
          <p className="text-gray-500 mt-1">
            Vue globale du stockage entrepot avec suivi m3 et facturation
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/canaux-vente/linkme/stockage?tab=tarifs">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Grille tarifaire
            </Button>
          </Link>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle allocation
          </Button>
        </div>
      </div>
      <StockageKPIs totals={totals} isLoading={totalsLoading} />
      <StockageFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        ownerTypeFilter={ownerTypeFilter}
        setOwnerTypeFilter={setOwnerTypeFilter}
        showBillableOnly={showBillableOnly}
        setShowBillableOnly={setShowBillableOnly}
      />
      <StockageOverviewTable
        isLoading={isLoading}
        filteredOverview={filteredOverview}
        overview={overview}
        onSelect={setSelectedOwner}
      />
      <OwnerStorageDetail
        owner={selectedOwner}
        onClose={() => setSelectedOwner(null)}
      />
      <AddAllocationDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={() => {
          setShowAddDialog(false);
          void refetch().catch(error => {
            console.error('[Stockage] refetch failed:', error);
          });
        }}
      />
    </div>
  );
}
