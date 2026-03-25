'use client';

import {
  useLinkMeSelection,
  useEnseigneSourcedProducts,
  useUpdateSelection,
  useAddProductToSelection,
  useRemoveProductFromSelection,
  useUpdateProductMargin,
  useUpdateSelectionItem,
  useToggleSelectionItemVisibility,
} from '../../hooks/use-linkme-selections';
import { useLinkMeCatalogProducts } from '../../hooks/use-linkme-catalog';
import { useSelectionForm } from './use-selection-form';
import { useSelectionModals } from './use-selection-modals';
import { useSelectionSync } from './use-selection-sync';
import { useSelectionProducts } from './use-selection-products';
import { buildSelectionHandlers } from './use-selection-handlers';

export function useSelectionDetail(id: string) {
  const { data: selection, isLoading, error } = useLinkMeSelection(id);
  const { data: catalogProducts } = useLinkMeCatalogProducts();
  const enseigneId =
    selection?.affiliate?.enseigne_id ??
    selection?.affiliate?.organisation?.enseigne_id ??
    null;
  const { data: sourcedProducts } = useEnseigneSourcedProducts(enseigneId);

  const updateSelection = useUpdateSelection();
  const addProduct = useAddProductToSelection();
  const removeProduct = useRemoveProductFromSelection();
  const toggleVisibility = useToggleSelectionItemVisibility();
  const _updateMargin = useUpdateProductMargin();
  const updateItem = useUpdateSelectionItem();

  const formState = useSelectionForm(selection);
  const modalState = useSelectionModals();
  const syncState = useSelectionSync(selection, updateItem);
  const productLists = useSelectionProducts(
    selection,
    catalogProducts,
    sourcedProducts,
    modalState.searchQuery
  );

  const handlers = buildSelectionHandlers(
    selection,
    formState.formData,
    formState.setIsDirty,
    updateSelection,
    addProduct,
    removeProduct,
    updateItem,
    modalState,
    catalogProducts,
    sourcedProducts
  );

  return {
    selection,
    isLoading,
    error,
    catalogProducts,
    sourcedProducts,
    ...productLists,
    divergentItems: syncState.divergentItems,
    ...formState,
    ...modalState,
    syncingItemIds: syncState.syncingItemIds,
    isSyncingAll: syncState.isSyncingAll,
    updateSelection,
    addProduct,
    removeProduct,
    toggleVisibility,
    updateItem,
    handleSyncItem: syncState.handleSyncItem,
    handleSyncAll: syncState.handleSyncAll,
    ...handlers,
  };
}
