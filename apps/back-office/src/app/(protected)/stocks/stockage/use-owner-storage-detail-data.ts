'use client';

/**
 * Data hooks for OwnerStorageDetail dialog
 *
 * @module use-owner-storage-detail-data
 * @since 2025-12-20
 */

import {
  useAffiliateStorageDetail,
  useStorageEventsHistory,
  useStorageWeightedAverage,
  type GlobalStorageOverviewItem,
} from './hooks/use-storage-billing';

export interface OwnerStorageDetailData {
  detailData: ReturnType<typeof useAffiliateStorageDetail>['data'];
  detailLoading: boolean;
  weightedAverage: ReturnType<typeof useStorageWeightedAverage>['data'];
  avgLoading: boolean;
  eventsHistory: ReturnType<typeof useStorageEventsHistory>['data'];
  historyLoading: boolean;
  currentMonthName: string;
}

export function useOwnerStorageDetailData(
  owner: GlobalStorageOverviewItem | null
): OwnerStorageDetailData {
  const { data: detailData, isLoading: detailLoading } =
    useAffiliateStorageDetail(owner?.owner_type ?? 'enseigne', owner?.owner_id);
  const { data: weightedAverage, isLoading: avgLoading } =
    useStorageWeightedAverage(
      owner?.owner_type ?? null,
      owner?.owner_id ?? null
    );
  const { data: eventsHistory, isLoading: historyLoading } =
    useStorageEventsHistory(owner?.owner_type ?? null, owner?.owner_id ?? null);

  const currentMonthName = new Date().toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  return {
    detailData,
    detailLoading,
    weightedAverage,
    avgLoading,
    eventsHistory,
    historyLoading,
    currentMonthName,
  };
}
