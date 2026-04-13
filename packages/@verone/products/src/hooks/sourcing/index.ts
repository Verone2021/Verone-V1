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
  SourcingPriceEntry,
  SourcingCandidateSupplier,
} from './use-sourcing-notebook';

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
    deleteSourcingProduct,
  };
}
