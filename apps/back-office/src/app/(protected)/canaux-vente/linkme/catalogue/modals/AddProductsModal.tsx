'use client';

import {
  UniversalProductSelectorV2,
  type SelectedProduct,
} from '@verone/products/components/selectors/UniversalProductSelectorV2';

interface AddProductsModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (products: SelectedProduct[]) => void;
  excludeProductIds: string[];
}

export function AddProductsModal({
  open,
  onClose,
  onSelect,
  excludeProductIds,
}: AddProductsModalProps) {
  return (
    <UniversalProductSelectorV2
      open={open}
      onClose={onClose}
      onSelect={onSelect}
      mode="multi"
      title="Ajouter des produits au catalogue LinkMe"
      description="Sélectionnez les produits à rendre disponibles pour les affiliés"
      excludeProductIds={excludeProductIds}
      showImages
    />
  );
}
