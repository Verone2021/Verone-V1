'use client';

import type { Collection } from '@verone/collections';
import type { CreateCollectionInput } from '@verone/common';
import { CollectionCreationWizard } from '@verone/common';
import type { SelectedProduct } from '@verone/products';
import { UniversalProductSelectorV2 } from '@verone/products';

interface CollectionModalsProps {
  showEditModal: boolean;
  onCloseEditModal: () => void;
  onSaveCollection: (data: CreateCollectionInput) => Promise<boolean>;
  editingCollection: Collection | null;
  showProductsModal: boolean;
  managingProductsCollection: Collection | null;
  onCloseProductsModal: () => void;
  onAddProducts: (products: SelectedProduct[]) => Promise<void>;
}

export function CollectionModals({
  showEditModal,
  onCloseEditModal,
  onSaveCollection,
  editingCollection,
  showProductsModal,
  managingProductsCollection,
  onCloseProductsModal,
  onAddProducts,
}: CollectionModalsProps) {
  return (
    <>
      <CollectionCreationWizard
        isOpen={showEditModal}
        onClose={onCloseEditModal}
        onSubmit={onSaveCollection}
        editingCollection={
          editingCollection as unknown as Parameters<
            typeof CollectionCreationWizard
          >[0]['editingCollection']
        }
      />

      {managingProductsCollection && (
        <UniversalProductSelectorV2
          open={showProductsModal}
          onClose={onCloseProductsModal}
          onSelect={async (products: SelectedProduct[]) => {
            await onAddProducts(products);
          }}
          mode="multi"
          context="collections"
          selectedProducts={[]}
          showQuantity={false}
          showImages
        />
      )}
    </>
  );
}
