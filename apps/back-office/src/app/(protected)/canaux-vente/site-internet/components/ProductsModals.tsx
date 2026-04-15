'use client';

import { UniversalProductSelectorV2 } from '@verone/products/components/selectors/UniversalProductSelectorV2';
import { ConfirmDialog } from '@verone/ui';

import { AddVariantGroupModal } from './AddVariantGroupModal';
import { EditSiteInternetProductModal } from './EditSiteInternetProductModal';
import { ProductPreviewModal } from './ProductPreviewModal';
import type { SiteInternetProduct } from '../types';

interface ProductsModalsProps {
  // Confirm remove
  confirmDialogOpen: boolean;
  setConfirmDialogOpen: (v: boolean) => void;
  confirmRemove: () => Promise<void>;
  // Edit modal
  selectedProduct: SiteInternetProduct | null;
  editModalOpen: boolean;
  onCloseEditModal: () => void;
  onEditSuccess: () => void;
  // Preview modal
  previewProduct: SiteInternetProduct | null;
  previewModalOpen: boolean;
  onClosePreviewModal: () => void;
  // Add variant group modal
  addVariantGroupOpen: boolean;
  onCloseVariantGroup: () => void;
  onConfirmVariantGroup: (
    variantGroupId: string,
    customPriceHt: number
  ) => Promise<void>;
  existingProductIds: string[];
  // Add products modal
  addProductsOpen: boolean;
  onCloseAddProducts: () => void;
  onSelectProducts: (selected: Array<{ id: string }>) => Promise<void>;
  excludeProductIds: string[];
}

export function ProductsModals({
  confirmDialogOpen,
  setConfirmDialogOpen,
  confirmRemove,
  selectedProduct,
  editModalOpen,
  onCloseEditModal,
  onEditSuccess,
  previewProduct,
  previewModalOpen,
  onClosePreviewModal,
  addVariantGroupOpen,
  onCloseVariantGroup,
  onConfirmVariantGroup,
  existingProductIds,
  addProductsOpen,
  onCloseAddProducts,
  onSelectProducts,
  excludeProductIds,
}: ProductsModalsProps) {
  return (
    <>
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Retirer ce produit ?"
        description="Etes-vous sur de vouloir retirer ce produit du site internet ? Cette action ne supprimera pas le produit de votre catalogue."
        variant="destructive"
        confirmText="Retirer"
        cancelText="Annuler"
        onConfirm={confirmRemove}
      />
      {selectedProduct && (
        <EditSiteInternetProductModal
          isOpen={editModalOpen}
          onClose={onCloseEditModal}
          product={selectedProduct}
          onSuccess={onEditSuccess}
        />
      )}
      <ProductPreviewModal
        product={previewProduct}
        isOpen={previewModalOpen}
        onClose={onClosePreviewModal}
      />
      <AddVariantGroupModal
        open={addVariantGroupOpen}
        onClose={onCloseVariantGroup}
        onConfirm={onConfirmVariantGroup}
        existingProductIds={existingProductIds}
      />
      <UniversalProductSelectorV2
        open={addProductsOpen}
        onClose={onCloseAddProducts}
        onSelect={onSelectProducts}
        mode="multi"
        title="Ajouter des produits au site internet"
        description="Selectionnez les produits du catalogue a publier sur le site"
        excludeProductIds={excludeProductIds}
        showImages
      />
    </>
  );
}
