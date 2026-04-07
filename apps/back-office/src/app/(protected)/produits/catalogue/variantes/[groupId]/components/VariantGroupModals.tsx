'use client';

import type { SelectedProduct } from '@verone/products';
import {
  CreateProductInGroupModal,
  EditProductVariantModal,
  VariantGroupEditModal,
  UniversalProductSelectorV2,
} from '@verone/products';

import type {
  VariantGroup,
  VariantProduct,
  UpdateVariantGroupData,
} from '@verone/types';

interface VariantGroupModalsProps {
  variantGroup: VariantGroup;
  showEditModal: boolean;
  showAddProductsModal: boolean;
  showCreateProductModal: boolean;
  showEditProductModal: boolean;
  selectedProductForEdit: VariantProduct | null;
  excludeProductIds: string[];
  onCloseEditModal: () => void;
  onCloseAddProductsModal: () => void;
  onCloseCreateProductModal: () => void;
  onCloseEditProductModal: () => void;
  onEditGroupSubmit: (
    groupId: string,
    data: UpdateVariantGroupData
  ) => Promise<void>;
  onProductsSelect: (products: SelectedProduct[]) => Promise<void>;
  onCreateProductSubmit: (variantValue: string) => Promise<boolean>;
  onProductCreated: () => void;
  onProductUpdated: () => void;
}

export function VariantGroupModals({
  variantGroup,
  showEditModal,
  showAddProductsModal,
  showCreateProductModal,
  showEditProductModal,
  selectedProductForEdit,
  excludeProductIds,
  onCloseEditModal,
  onCloseAddProductsModal,
  onCloseCreateProductModal,
  onCloseEditProductModal,
  onEditGroupSubmit,
  onProductsSelect,
  onCreateProductSubmit,
  onProductCreated,
  onProductUpdated,
}: VariantGroupModalsProps) {
  return (
    <>
      {showEditModal && (
        <VariantGroupEditModal
          isOpen={showEditModal}
          onClose={onCloseEditModal}
          onSubmit={onEditGroupSubmit}
          group={variantGroup}
        />
      )}

      {showAddProductsModal && (
        <UniversalProductSelectorV2
          open={showAddProductsModal}
          onClose={onCloseAddProductsModal}
          onSelect={onProductsSelect}
          mode="multi"
          context="variants"
          title={`Ajouter des produits au groupe "${variantGroup.name}"`}
          description="Sélectionnez les produits à ajouter comme variantes de ce groupe"
          excludeProductIds={excludeProductIds}
          showImages
          showQuantity={false}
          showPricing={false}
        />
      )}

      {showCreateProductModal && (
        <CreateProductInGroupModal
          isOpen={showCreateProductModal}
          onClose={onCloseCreateProductModal}
          variantGroup={variantGroup}
          onProductCreated={onProductCreated}
          onCreateProduct={onCreateProductSubmit}
        />
      )}

      {showEditProductModal && selectedProductForEdit && (
        <EditProductVariantModal
          isOpen={showEditProductModal}
          onClose={onCloseEditProductModal}
          product={selectedProductForEdit}
          variantGroup={variantGroup}
          onSuccess={() => {
            void Promise.resolve(onProductUpdated()).catch(error => {
              console.error('[VariantGroup] Product update failed:', error);
            });
          }}
        />
      )}
    </>
  );
}
