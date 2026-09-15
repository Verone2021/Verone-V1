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
export {
  useProductEvaluation,
  PRODUCT_EVALUATION_QUERY_KEY,
} from './use-product-evaluation';
export type {
  ProductEvaluationRow,
  SaveEvaluationInput,
} from './use-product-evaluation';

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
    archiveSourcingProduct,
    unarchiveSourcingProduct,
    deleteSourcingProduct,
  } = useSourcingMutations({ refetch: fetchSourcingProducts });

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
    createSourcingProduct,
    updateSourcingProduct,
    archiveSourcingProduct,
    unarchiveSourcingProduct,
    deleteSourcingProduct,
  };
}
