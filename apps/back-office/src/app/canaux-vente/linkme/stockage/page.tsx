'use client';

/**
 * Page Stockage / Volumetrie - Back-Office LinkMe
 *
 * Vue d'ensemble du stockage entrepot par affilie
 *
 * @module StockagePage
 * @since 2025-12-20
 */

import { useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Switch,
} from '@verone/ui';
import {
  Package,
  Loader2,
  Box,
  Warehouse,
  Users,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

import {
  useStorageOverview,
  useStorageTotals,
  useAffiliateStorageDetail,
  useUpdateAllocationBillable,
  formatVolumeM3,
  type StorageOverviewItem,
} from '../hooks/use-linkme-storage';

export default function StockagePage() {
  const [selectedAffiliate, setSelectedAffiliate] =
    useState<StorageOverviewItem | null>(null);

  const { data: overview, isLoading } = useStorageOverview();
  const { data: totals } = useStorageTotals();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Stockage & Volumetrie
        </h1>
        <p className="text-gray-500 mt-1">
          Vue d&apos;ensemble du stockage entrepot par affilie
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <KPICard
          icon={Box}
          label="Volume total"
          value={formatVolumeM3(totals?.total_volume_m3 || 0)}
          color="blue"
        />
        <KPICard
          icon={TrendingUp}
          label="Volume facturable"
          value={formatVolumeM3(totals?.billable_volume_m3 || 0)}
          color="green"
        />
        <KPICard
          icon={Package}
          label="Unites stockees"
          value={`${totals?.total_units || 0}`}
          color="purple"
        />
        <KPICard
          icon={Users}
          label="Affilies actifs"
          value={`${totals?.affiliates_count || 0}`}
          color="orange"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!overview || overview.length === 0) && (
        <div className="bg-white rounded-xl p-12 text-center border">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Warehouse className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun stockage
          </h2>
          <p className="text-gray-500">
            Aucun affilie n&apos;a de produits en stockage
          </p>
        </div>
      )}

      {/* Overview Table */}
      {!isLoading && overview && overview.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Affilie
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
              {overview.map(item => (
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
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAffiliate(item)}
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
      <AffiliateStorageDetail
        affiliate={selectedAffiliate}
        onClose={() => setSelectedAffiliate(null)}
      />
    </div>
  );
}

function KPICard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function AffiliateStorageDetail({
  affiliate,
  onClose,
}: {
  affiliate: StorageOverviewItem | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useAffiliateStorageDetail(
    affiliate?.owner_type || 'enseigne',
    affiliate?.owner_id
  );
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

  return (
    <Dialog open={!!affiliate} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-blue-600" />
            Stockage - {affiliate?.owner_name}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          </div>
        )}

        {!isLoading && data && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Unites</p>
                <p className="text-xl font-bold">{data.summary.total_units}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Volume total</p>
                <p className="text-xl font-bold">
                  {formatVolumeM3(data.summary.total_volume_m3)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Facturable</p>
                <p className="text-xl font-bold text-green-600">
                  {formatVolumeM3(data.summary.billable_volume_m3)}
                </p>
              </div>
            </div>

            {/* Allocations Table */}
            {data.allocations.length > 0 && (
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
                    {data.allocations.map(allocation => (
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

            {data.allocations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Aucun produit en stockage
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
