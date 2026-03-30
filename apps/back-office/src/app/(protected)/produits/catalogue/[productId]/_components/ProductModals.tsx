'use client';

import { CategoryHierarchySelector } from '@verone/categories';
import {
  ProductCharacteristicsModal,
  ProductDescriptionsModal,
  ProductPhotosModal,
} from '@verone/products';
import {
  ButtonUnified,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Tag } from 'lucide-react';

import type { Product, ProductRow } from './types';

interface ProductModalsProps {
  product: Product;
  showPhotosModal: boolean;
  showCharacteristicsModal: boolean;
  showDescriptionsModal: boolean;
  isCategorizeModalOpen: boolean;
  onClosePhotos: () => void;
  onCloseCharacteristics: () => void;
  onCloseDescriptions: () => void;
  onCloseCategorize: () => void;
  onProductUpdate: (data: Partial<ProductRow>) => Promise<void>;
  onImagesUpdated: () => void;
}

export function ProductModals({
  product,
  showPhotosModal,
  showCharacteristicsModal,
  showDescriptionsModal,
  isCategorizeModalOpen,
  onClosePhotos,
  onCloseCharacteristics,
  onCloseDescriptions,
  onCloseCategorize,
  onProductUpdate,
  onImagesUpdated,
}: ProductModalsProps) {
  return (
    <>
      <ProductPhotosModal
        isOpen={showPhotosModal}
        onClose={onClosePhotos}
        productId={product.id}
        productName={product.name}
        productType="product"
        maxImages={20}
        onImagesUpdated={onImagesUpdated}
      />

      <ProductCharacteristicsModal
        isOpen={showCharacteristicsModal}
        onClose={onCloseCharacteristics}
        productId={product.id}
        productName={product.name}
        initialData={{
          variant_attributes:
            (product.variant_attributes as Record<string, unknown>) ??
            undefined,
          dimensions:
            (product.dimensions as Record<string, unknown>) ?? undefined,
          weight: product.weight ?? undefined,
        }}
        onUpdate={data => {
          void onProductUpdate(data as Partial<ProductRow>).catch(err => {
            console.error(
              '[ProductDetail] Characteristics update failed:',
              err
            );
          });
        }}
      />

      <ProductDescriptionsModal
        isOpen={showDescriptionsModal}
        onClose={onCloseDescriptions}
        productId={product.id}
        productName={product.name}
        initialData={{
          description: product.description ?? undefined,
          technical_description: product.technical_description ?? undefined,
          selling_points: (product.selling_points ?? undefined) as
            | string[]
            | undefined,
        }}
        onUpdate={data => {
          void onProductUpdate(data as Partial<ProductRow>).catch(err => {
            console.error('[ProductDetail] Descriptions update failed:', err);
          });
        }}
      />

      <Dialog open={isCategorizeModalOpen} onOpenChange={onCloseCategorize}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Tag className="h-4 w-4 mr-2" />
              Modifier la catégorisation
            </DialogTitle>
            <DialogDescription>
              Sélectionnez une nouvelle sous-catégorie pour ce produit. La
              famille et la catégorie seront automatiquement mises à jour.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <CategoryHierarchySelector
              value={product.subcategory_id ?? ''}
              onChange={(subcategoryId, hierarchyInfo) => {
                if (subcategoryId && hierarchyInfo) {
                  void onProductUpdate({
                    subcategory_id: subcategoryId,
                  }).catch(err => {
                    console.error(
                      '[ProductDetail] Subcategory update failed:',
                      err
                    );
                  });
                  onCloseCategorize();
                }
              }}
              placeholder="Sélectionner une sous-catégorie"
              className="w-full"
            />
          </div>

          <DialogFooter>
            <ButtonUnified variant="outline" onClick={onCloseCategorize}>
              Annuler
            </ButtonUnified>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
