'use client';

/**
 * OwnerStorageDetail dialog
 *
 * @module stockage-owner-dialog
 * @since 2025-12-20
 */

import { useState } from 'react';

import {
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@verone/ui';
import { Calculator, History, Package, Warehouse } from 'lucide-react';

import {
  formatVolumeM3,
  type GlobalStorageOverviewItem,
} from './hooks/use-storage-billing';
import { AllocationsTab, BillingTab, HistoryTab } from './stockage-detail';
import { useOwnerDetailMutations } from './use-owner-detail-mutations';
import { useOwnerStorageDetailData } from './use-owner-storage-detail-data';

function OwnerDetailHeader({
  owner,
}: {
  owner: GlobalStorageOverviewItem | null;
}) {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Warehouse className="h-5 w-5 text-blue-600" />
        Stockage - {owner?.owner_name}
        <Badge
          variant={owner?.owner_type === 'enseigne' ? 'default' : 'secondary'}
          className="ml-2"
        >
          {owner?.owner_type === 'enseigne' ? 'Enseigne' : 'Organisation'}
        </Badge>
      </DialogTitle>
    </DialogHeader>
  );
}

function OwnerSummaryHeader({
  detailData,
  detailLoading,
}: {
  detailData: ReturnType<typeof useOwnerStorageDetailData>['detailData'];
  detailLoading: boolean;
}) {
  if (detailLoading || !detailData) return null;
  return (
    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
      <div>
        <p className="text-sm text-gray-500">Unites</p>
        <p className="text-xl font-bold">{detailData.summary.total_units}</p>
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
  );
}

export function OwnerStorageDetail({
  owner,
  onClose,
}: {
  owner: GlobalStorageOverviewItem | null;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<
    'allocations' | 'billing' | 'history'
  >('allocations');

  const detailHook = useOwnerStorageDetailData(owner);
  const mutations = useOwnerDetailMutations();

  return (
    <Dialog open={!!owner} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <OwnerDetailHeader owner={owner} />
        <OwnerSummaryHeader
          detailData={detailHook.detailData}
          detailLoading={detailHook.detailLoading}
        />
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
          <TabsContent value="allocations" className="mt-4">
            <AllocationsTab
              detailData={detailHook.detailData}
              detailLoading={detailHook.detailLoading}
              onToggleBillable={mutations.handleToggleBillable}
              onUpdateQuantity={mutations.handleUpdateQuantity}
              onUpdateStartDate={mutations.handleUpdateStartDate}
              isPending={mutations.isPending}
            />
          </TabsContent>
          <TabsContent value="billing" className="mt-4">
            <BillingTab
              avgLoading={detailHook.avgLoading}
              weightedAverage={detailHook.weightedAverage}
              currentMonthName={detailHook.currentMonthName}
            />
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <HistoryTab
              historyLoading={detailHook.historyLoading}
              eventsHistory={detailHook.eventsHistory}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
