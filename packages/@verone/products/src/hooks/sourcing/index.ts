'use client';

export type { SourcingProduct, SourcingFilters } from './types';
export { useSourcingFetch } from './use-sourcing-fetch';
export { useSourcingMutations } from './use-sourcing-mutations';
export { useSourcingSampleOrder } from './use-sourcing-sample-order';
export { useSourcingCreateUpdate } from './use-sourcing-create-update';
export { useSourcingNotebook } from './use-sourcing-notebook';
export type {
  SourcingUrl,
  SourcingCommunication,
  SourcingJournalEntryType,
  NewSourcingJournalEntry,
  SourcingPriceEntry,
  SourcingCandidateSupplier,
  SourcingPhoto,
} from './use-sourcing-notebook';
export { useSupplierSearch } from './use-supplier-search';
export { useSourcingLifecycle } from './use-sourcing-lifecycle';
export type { SourcingLifecycleInput } from './use-sourcing-lifecycle';
export { useSampleState, SAMPLE_STATE_QUERY_KEY } from './use-sample-state';
export {
  useSourcingSegmentCounts,
  SOURCING_SEGMENT_COUNTS_QUERY_KEY,
} from './use-sourcing-segment-counts';

import type { SourcingFilters } from './types';
import { useSourcingFetch } from './use-sourcing-fetch';
import { useSourcingMutations } from './use-sourcing-mutations';
import { useSourcingSampleOrder } from './use-sourcing-sample-order';
import { useSourcingCreateUpdate } from './use-sourcing-create-update';

export function useSourcingProducts(filters?: SourcingFilters) {
  const { products, loading, error, fetchSourcingProducts } =
    useSourcingFetch(filters);

  const {
    validateSourcing,
    approveSample,
    rejectSample,
    archiveSourcingProduct,
    unarchiveSourcingProduct,
    deleteSourcingProduct,
  } = useSourcingMutations({ products, refetch: fetchSourcingProducts });

  const { orderSample } = useSourcingSampleOrder({
    refetch: fetchSourcingProducts,
  });

  const { createSourcingProduct, updateSourcingProduct } =
    useSourcingCreateUpdate({ refetch: fetchSourcingProducts });

  return {
    products,
    loading,
    error,
    refetch: fetchSourcingProducts,
    validateSourcing,
    orderSample,
    approveSample,
    rejectSample,
    createSourcingProduct,
    updateSourcingProduct,
    archiveSourcingProduct,
    unarchiveSourcingProduct,
    deleteSourcingProduct,
  };
}
