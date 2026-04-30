'use client';

import type { VariantGroup, UpdateVariantGroupData } from '@verone/types';

import { VariantAddProductModal } from '@verone/products';
import { VariantGroupEditModal } from '@verone/products';
import { VariantGroupCreationWizard } from '@verone/products';
import { useVariantProducts } from '@verone/products/hooks';

interface VariantesModalsProps {
  showEditModal: boolean;
  setShowEditModal: (v: boolean) => void;
  editingGroup: VariantGroup | null;
  setEditingGroup: (v: VariantGroup | null) => void;
  showAddProductsModal: boolean;
  setShowAddProductsModal: (v: boolean) => void;
  selectedGroupForProducts: VariantGroup | null;
  setSelectedGroupForProducts: (v: VariantGroup | null) => void;
  refetch: () => Promise<void>;
  updateVariantGroup: (
    id: string,
    data: UpdateVariantGroupData
  ) => Promise<boolean>;
}

export function VariantesModals({
  showEditModal,
  setShowEditModal,
  editingGroup,
  setEditingGroup,
  showAddProductsModal,
  setShowAddProductsModal,
  selectedGroupForProducts,
  setSelectedGroupForProducts,
  refetch,
  updateVariantGroup,
}: VariantesModalsProps) {
  const { addProductToVariantGroup } = useVariantProducts();

  return (
    <>
      {showEditModal && !editingGroup && (
        <VariantGroupCreationWizard
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={groupId => {
            console.warn('Groupe créé:', groupId);
            void refetch().catch(error => {
              console.error('[Variants] Refetch after creation failed:', error);
            });
            setShowEditModal(false);
          }}
        />
      )}

      {showEditModal && editingGroup && (
        <VariantGroupEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingGroup(null);
          }}
          onSubmit={async (groupId, data) => {
            await updateVariantGroup(groupId, data);
            void refetch().catch(error => {
              console.error('[Variants] Refetch after update failed:', error);
            });
            setShowEditModal(false);
            setEditingGroup(null);
          }}
          group={editingGroup}
        />
      )}

      {showAddProductsModal && selectedGroupForProducts && (
        <VariantAddProductModal
          isOpen={showAddProductsModal}
          onClose={() => {
            setShowAddProductsModal(false);
            setSelectedGroupForProducts(null);
          }}
          group={selectedGroupForProducts}
          onSubmit={async data => {
            const ok = await addProductToVariantGroup(
              data.product_id,
              data.variant_group_id
            );
            if (ok) {
              await refetch();
            }
          }}
        />
      )}
    </>
  );
}
