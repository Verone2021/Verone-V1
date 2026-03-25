'use client';

import { toast } from 'sonner';
import { type SourcedProduct } from '../../hooks/use-linkme-selections';
import { type LinkMeCatalogProduct } from '../../hooks/use-linkme-catalog';
import type { ProductFormData, ProductSourceValue } from './selection-types';

type CatalogProduct = LinkMeCatalogProduct;

type SelectionData = { id: string };

type UpdateSelectionMutation = {
  mutateAsync: (args: {
    selectionId: string;
    data: Partial<ProductFormData>;
  }) => Promise<unknown>;
};

type AddProductMutation = {
  mutateAsync: (args: {
    selectionId: string;
    productData: {
      product_id: string;
      margin_rate: number;
      base_price_ht: number;
    };
  }) => Promise<unknown>;
};

type RemoveProductMutation = {
  mutateAsync: (args: {
    selectionId: string;
    itemId: string;
  }) => Promise<unknown>;
};

type UpdateItemMutation = {
  mutateAsync: (args: {
    itemId: string;
    selectionId: string;
    data: { margin_rate?: number; base_price_ht?: number };
  }) => Promise<unknown>;
};

type ModalState = {
  selectedProductId: string | null;
  productSource: ProductSourceValue;
  newMarginRate: number;
  resetAddModal: () => void;
};

export function buildSelectionHandlers(
  selection: SelectionData | null | undefined,
  formData: ProductFormData,
  setIsDirty: (v: boolean) => void,
  updateSelection: UpdateSelectionMutation,
  addProduct: AddProductMutation,
  removeProduct: RemoveProductMutation,
  updateItem: UpdateItemMutation,
  modalState: ModalState,
  catalogProducts: CatalogProduct[] | null | undefined,
  sourcedProducts: SourcedProduct[] | null | undefined
) {
  const handleSave = async () => {
    if (!selection) return;
    await updateSelection.mutateAsync({
      selectionId: selection.id,
      data: formData,
    });
    setIsDirty(false);
  };

  const handleRemoveProduct = async (itemId: string) => {
    if (!selection) return;
    await removeProduct.mutateAsync({ selectionId: selection.id, itemId });
  };

  const handleAddProduct = async () => {
    if (!selection || !modalState.selectedProductId) return;
    const basePriceHt = await resolveBasePrice(
      modalState.productSource,
      modalState.selectedProductId,
      catalogProducts,
      sourcedProducts
    );
    if (basePriceHt === null) return;
    await addProduct.mutateAsync({
      selectionId: selection.id,
      productData: {
        product_id: modalState.selectedProductId,
        margin_rate: modalState.newMarginRate,
        base_price_ht: basePriceHt,
      },
    });
    modalState.resetAddModal();
  };

  const handleSaveFromDetail = async (
    itemId: string,
    updates: { marginRate?: number; customPriceHT?: number }
  ) => {
    if (!selection) return;
    const updateData: { margin_rate?: number; base_price_ht?: number } = {};
    if (updates.marginRate !== undefined)
      updateData.margin_rate = updates.marginRate;
    if (updates.customPriceHT !== undefined)
      updateData.base_price_ht = updates.customPriceHT;
    if (Object.keys(updateData).length > 0) {
      await updateItem.mutateAsync({
        itemId,
        selectionId: selection.id,
        data: updateData,
      });
    }
  };

  return {
    handleSave,
    handleRemoveProduct,
    handleAddProduct,
    handleSaveFromDetail,
  };
}

async function resolveBasePrice(
  productSource: ProductSourceValue,
  selectedProductId: string,
  catalogProducts: CatalogProduct[] | null | undefined,
  sourcedProducts: SourcedProduct[] | null | undefined
): Promise<number | null> {
  if (productSource === 'catalog') {
    const product = catalogProducts?.find(
      p => p.product_id === selectedProductId
    );
    if (!product) return null;
    if (product.product_selling_price_ht == null) {
      toast.error(
        "Ce produit n'a pas de prix LinkMe défini dans le catalogue."
      );
      return null;
    }
    return product.product_selling_price_ht;
  }
  const product = sourcedProducts?.find(p => p.id === selectedProductId);
  if (!product) return null;
  return product.selling_price_ht;
}
