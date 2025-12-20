'use client';

/**
 * Page Stockage & Facturation - Back-Office Core
 *
 * Vue globale du stockage entrepot avec suivi m3 et facturation
 *
 * @module StockagePage
 * @since 2025-12-20
 */

import { useState, useMemo } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
} from '@verone/ui';
import {
  Package,
  Loader2,
  Box,
  Warehouse,
  Users,
  ChevronRight,
  TrendingUp,
  History,
  Calculator,
  Filter,
  Building2,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';

import {
  useGlobalStorageTotals,
  useGlobalStorageOverview,
  useAffiliateStorageDetail,
  useUpdateAllocationBillable,
  useStorageWeightedAverage,
  useStorageEventsHistory,
  formatVolumeM3,
  getSourceLabel,
  getSourceColor,
  type GlobalStorageOverviewItem,
} from './hooks/use-storage-billing';

type OwnerTypeFilter = 'all' | 'enseigne' | 'organisation';

export default function StockagePage() {
  const [selectedOwner, setSelectedOwner] =
    useState<GlobalStorageOverviewItem | null>(null);
  const [ownerTypeFilter, setOwnerTypeFilter] =
    useState<OwnerTypeFilter>('all');
  const [showBillableOnly, setShowBillableOnly] = useState(false);

  const { data: totals, isLoading: totalsLoading } = useGlobalStorageTotals();
  const { data: overview, isLoading: overviewLoading } =
    useGlobalStorageOverview();

  const isLoading = totalsLoading || overviewLoading;

  // Filter overview data
  const filteredOverview = useMemo(() => {
    if (!overview) return [];

    return overview.filter(item => {
      // Owner type filter
      if (ownerTypeFilter !== 'all' && item.owner_type !== ownerTypeFilter) {
        return false;
      }

      // Billable only filter
      if (showBillableOnly && item.billable_volume_m3 <= 0) {
        return false;
      }

      return true;
    });
  }, [overview, ownerTypeFilter, showBillableOnly]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Stockage & Facturation
          </h1>
          <p className="text-gray-500 mt-1">
            Vue globale du stockage entrepot avec suivi m3 et facturation
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <KPICard
          icon={Box}
          label="Volume total"
          value={formatVolumeM3(totals?.total_volume_m3 || 0)}
          color="blue"
          isLoading={totalsLoading}
        />
        <KPICard
          icon={TrendingUp}
          label="Volume facturable"
          value={formatVolumeM3(totals?.billable_volume_m3 || 0)}
          color="green"
          isLoading={totalsLoading}
        />
        <KPICard
          icon={Package}
          label="Unites stockees"
          value={`${totals?.total_units || 0}`}
          color="purple"
          isLoading={totalsLoading}
        />
        <KPICard
          icon={Users}
          label="Owners actifs"
          value={`${totals?.active_owners || 0}`}
          color="orange"
          isLoading={totalsLoading}
        />
        <KPICard
          icon={Building2}
          label="Produits"
          value={`${totals?.products_count || 0}`}
          color="gray"
          isLoading={totalsLoading}
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filtres:</span>
          </div>

          {/* Owner Type Filter */}
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

          {/* Billable Only Toggle */}
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

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredOverview.length === 0 && (
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
      )}

      {/* Overview Table */}
      {!isLoading && filteredOverview.length > 0 && (
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
                <tr
                  key={`${item.owner_type}-${item.owner_id}`}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">
                      {item.owner_name || '-'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        item.owner_type === 'enseigne'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {item.owner_type === 'enseigne'
                        ? 'Enseigne'
                        : 'Organisation'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {item.total_units}
                  </td>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOwner(item)}
                    >
                      Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Dialog */}
      <OwnerStorageDetail
        owner={selectedOwner}
        onClose={() => setSelectedOwner(null)}
      />
    </div>
  );
}

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
  color: 'blue' | 'green' | 'purple' | 'orange' | 'gray';
  isLoading?: boolean;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    gray: 'bg-gray-50 text-gray-600',
  };

  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
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

function OwnerStorageDetail({
  owner,
  onClose,
}: {
  owner: GlobalStorageOverviewItem | null;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<
    'allocations' | 'billing' | 'history'
  >('allocations');

  const { data: detailData, isLoading: detailLoading } =
    useAffiliateStorageDetail(owner?.owner_type || 'enseigne', owner?.owner_id);

  const { data: weightedAverage, isLoading: avgLoading } =
    useStorageWeightedAverage(
      owner?.owner_type || null,
      owner?.owner_id || null
    );

  const { data: eventsHistory, isLoading: historyLoading } =
    useStorageEventsHistory(owner?.owner_type || null, owner?.owner_id || null);

  const updateBillable = useUpdateAllocationBillable();

  const handleToggleBillable = async (
    allocationId: string,
    currentValue: boolean
  ) => {
    try {
      await updateBillable.mutateAsync({
        allocationId,
        billable: !currentValue,
      });
    } catch {
      alert('Erreur lors de la mise a jour');
    }
  };

  // Get current month name
  const currentMonthName = new Date().toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <Dialog open={!!owner} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-blue-600" />
            Stockage - {owner?.owner_name}
            <Badge
              variant={
                owner?.owner_type === 'enseigne' ? 'default' : 'secondary'
              }
              className="ml-2"
            >
              {owner?.owner_type === 'enseigne' ? 'Enseigne' : 'Organisation'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Summary Header */}
        {!detailLoading && detailData && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
            <div>
              <p className="text-sm text-gray-500">Unites</p>
              <p className="text-xl font-bold">
                {detailData.summary.total_units}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Volume total</p>
              <p className="text-xl font-bold">
                {formatVolumeM3(detailData.summary.total_volume_m3)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Facturable</p>
              <p className="text-xl font-bold text-green-600">
                {formatVolumeM3(detailData.summary.billable_volume_m3)}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={v => setActiveTab(v as typeof activeTab)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="allocations"
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Produits
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Facturation
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Historique
            </TabsTrigger>
          </TabsList>

          {/* Allocations Tab */}
          <TabsContent value="allocations" className="mt-4">
            {detailLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
            )}

            {!detailLoading &&
              detailData &&
              detailData.allocations.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                          Produit
                        </th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">
                          Qty
                        </th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">
                          Volume
                        </th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">
                          Facturable
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {detailData.allocations.map(allocation => (
                        <tr key={allocation.allocation_id}>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">
                                {allocation.product_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {allocation.product_sku}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {allocation.stock_quantity}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatVolumeM3(allocation.total_volume_m3)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              <Switch
                                checked={allocation.billable_in_storage}
                                onCheckedChange={() =>
                                  handleToggleBillable(
                                    allocation.allocation_id,
                                    allocation.billable_in_storage
                                  )
                                }
                                disabled={updateBillable.isPending}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            {!detailLoading && detailData?.allocations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Aucun produit en stockage
              </div>
            )}
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="mt-4">
            {avgLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
            )}

            {!avgLoading && weightedAverage && (
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Moyenne ponderee - {currentMonthName}
                  </h3>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <p className="text-sm text-gray-600 mb-1">
                        Moyenne m3 (total)
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {formatVolumeM3(weightedAverage.average_m3)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        sur {weightedAverage.days_in_period} jours
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <p className="text-sm text-gray-600 mb-1">
                        Moyenne m3 (facturable)
                      </p>
                      <p className="text-3xl font-bold text-green-600">
                        {formatVolumeM3(weightedAverage.billable_average_m3)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        base de facturation
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-white rounded border border-blue-200">
                    <p className="text-sm text-gray-600">
                      <strong>Formule:</strong> Σ(volume × duree en jours) /
                      jours du mois
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Cette moyenne ponderee reflete l&apos;utilisation reelle
                      du stockage sur la periode, tenant compte des variations
                      de stock.
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> Le tarif de facturation (EUR/m3/mois)
                    sera configure dans une version ulterieure.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4">
            {historyLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
            )}

            {!historyLoading && eventsHistory && eventsHistory.length > 0 && (
              <div className="border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                        Date
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                        Produit
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                        Action
                      </th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">
                        Qty
                      </th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">
                        Volume
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {eventsHistory.map(event => {
                      const sourceColor = getSourceColor(event.source);
                      return (
                        <tr key={event.id} className="text-sm">
                          <td className="px-4 py-2 text-gray-500">
                            {new Date(event.happened_at).toLocaleDateString(
                              'fr-FR',
                              {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <div>
                              <p className="font-medium">
                                {event.product_name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {event.product_sku}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <Badge
                              variant="outline"
                              className={`
                                ${sourceColor === 'green' ? 'border-green-300 text-green-700' : ''}
                                ${sourceColor === 'blue' ? 'border-blue-300 text-blue-700' : ''}
                                ${sourceColor === 'red' ? 'border-red-300 text-red-700' : ''}
                                ${sourceColor === 'amber' ? 'border-amber-300 text-amber-700' : ''}
                                ${sourceColor === 'gray' ? 'border-gray-300 text-gray-700' : ''}
                              `}
                            >
                              {getSourceLabel(event.source)}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <span className="flex items-center justify-end gap-1">
                              {event.qty_change > 0 && (
                                <ArrowUp className="h-3 w-3 text-green-500" />
                              )}
                              {event.qty_change < 0 && (
                                <ArrowDown className="h-3 w-3 text-red-500" />
                              )}
                              {event.qty_change === 0 && (
                                <Minus className="h-3 w-3 text-gray-400" />
                              )}
                              <span
                                className={
                                  event.qty_change > 0
                                    ? 'text-green-600'
                                    : event.qty_change < 0
                                      ? 'text-red-600'
                                      : 'text-gray-500'
                                }
                              >
                                {event.qty_change > 0 ? '+' : ''}
                                {event.qty_change}
                              </span>
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right text-gray-500">
                            {event.volume_m3_change > 0 ? '+' : ''}
                            {formatVolumeM3(event.volume_m3_change)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!historyLoading &&
              (!eventsHistory || eventsHistory.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  Aucun historique disponible
                </div>
              )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
