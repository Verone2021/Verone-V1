'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

import { useToast } from '@verone/common';
import type { SelectedProduct } from '@verone/products';
import { useVariantGroups } from '@verone/products';
import { useVariantGroup, useProductVariantEditing } from '@verone/products';
import type {
  VariantProduct,
  VariantType,
  UpdateVariantGroupData,
} from '@verone/types';

export function useVariantGroupPage(groupId: string) {
  const { toast } = useToast();
  const { variantGroup, loading, error } = useVariantGroup(groupId);
  const {
    removeProductFromGroup,
    updateVariantGroup,
    createProductInGroup,
    updateProductInGroup: _updateProductInGroup,
    addProductsToGroup,
    refetch,
  } = useVariantGroups();
  const { updateProductVariantAttribute: _updateProductVariantAttribute } =
    useProductVariantEditing();

  // États modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddProductsModal, setShowAddProductsModal] = useState(false);
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] =
    useState<VariantProduct | null>(null);

  // États édition inline nom
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // États édition inline type
  const [editingType, setEditingType] = useState(false);
  const [editedType, setEditedType] = useState<VariantType>('color');
  const [savingType, setSavingType] = useState(false);

  // Ref pour tracker l'affichage du toast après refetch
  const pendingToastRef = useRef(false);

  useEffect(() => {
    if (pendingToastRef.current && variantGroup && !loading) {
      pendingToastRef.current = false;
      toast({
        title: 'Produit mis à jour',
        description: 'Les modifications ont été enregistrées avec succès',
      });
    }
  }, [variantGroup, loading, toast]);

  // IDs exclus pour le sélecteur
  const excludeProductIds = useMemo(
    () => variantGroup?.products?.map(p => p.id) ?? [],
    [variantGroup?.products]
  );

  // --- Handlers modals ---

  const handleEditGroup = useCallback(() => setShowEditModal(true), []);
  const handleAddProducts = useCallback(
    () => setShowAddProductsModal(true),
    []
  );
  const handleCreateProduct = useCallback(
    () => setShowCreateProductModal(true),
    []
  );

  const handleModalSubmit = useCallback(() => {
    setShowEditModal(false);
    setShowAddProductsModal(false);
    window.location.reload();
  }, []);

  const handleEditGroupSubmit = useCallback(
    async (id: string, data: UpdateVariantGroupData) => {
      await updateVariantGroup(id, data);
    },
    [updateVariantGroup]
  );

  // --- Handlers produits ---

  const handleCreateProductSubmit = useCallback(
    async (variantValue: string) => {
      if (!variantGroup) return false;
      return await createProductInGroup(
        groupId,
        variantValue,
        variantGroup.variant_type ?? 'color'
      );
    },
    [groupId, variantGroup, createProductInGroup]
  );

  const handleRemoveProduct = useCallback(
    async (productId: string, productName: string) => {
      if (
        !confirm(
          `Êtes-vous sûr de vouloir retirer "${productName}" de ce groupe ?`
        )
      )
        return;

      const result = await removeProductFromGroup(productId);
      if (result) {
        toast({
          title: 'Produit retiré',
          description: `"${productName}" a été retiré du groupe`,
        });
        window.location.reload();
      }
    },
    [removeProductFromGroup, toast]
  );

  const handleProductsSelect = useCallback(
    async (products: SelectedProduct[]) => {
      if (!variantGroup || products.length === 0) {
        toast({
          title: 'Aucun produit sélectionné',
          description: 'Veuillez sélectionner au moins un produit',
          variant: 'destructive',
        });
        return;
      }

      try {
        const productIds = products.map(p => p.id);
        const success = await addProductsToGroup({
          variant_group_id: variantGroup.id,
          product_ids: productIds,
        });

        if (success) {
          toast({
            title: 'Produits ajoutés',
            description: `${products.length} produit(s) ajouté(s) au groupe "${variantGroup.name}"`,
          });
          await refetch();
          setShowAddProductsModal(false);
        }
      } catch (err) {
        console.error('Erreur ajout produits au groupe:', err);
        toast({
          title: 'Erreur',
          description: "Erreur lors de l'ajout des produits",
          variant: 'destructive',
        });
      }
    },
    [variantGroup, addProductsToGroup, refetch, toast]
  );

  // --- Édition inline nom ---

  const handleStartEditName = useCallback(() => {
    setEditedName(variantGroup?.name ?? '');
    setEditingName(true);
  }, [variantGroup?.name]);

  const handleSaveName = useCallback(async () => {
    if (!editedName.trim() || editedName === variantGroup?.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    const success = await updateVariantGroup(groupId, {
      name: editedName.trim(),
    });
    if (success) window.location.reload();
    setSavingName(false);
  }, [editedName, groupId, variantGroup?.name, updateVariantGroup]);

  const handleCancelEditName = useCallback(() => {
    setEditingName(false);
    setEditedName('');
  }, []);

  // --- Édition inline type ---

  const handleStartEditType = useCallback(() => {
    setEditedType(variantGroup?.variant_type ?? 'color');
    setEditingType(true);
  }, [variantGroup?.variant_type]);

  const handleSaveType = useCallback(
    async (newType: VariantType) => {
      if (newType === variantGroup?.variant_type) {
        setEditingType(false);
        return;
      }
      setSavingType(true);
      const success = await updateVariantGroup(groupId, {
        variant_type: newType,
      });
      if (success) window.location.reload();
      setSavingType(false);
    },
    [groupId, variantGroup?.variant_type, updateVariantGroup]
  );

  const handleCancelEditType = useCallback(() => setEditingType(false), []);

  // --- Édition produit ---

  const handleEditProduct = useCallback((product: VariantProduct) => {
    setSelectedProductForEdit(product);
    setShowEditProductModal(true);
  }, []);

  const handleCloseEditProductModal = useCallback(() => {
    setShowEditProductModal(false);
    setSelectedProductForEdit(null);
  }, []);

  const handleProductUpdated = useCallback(async () => {
    pendingToastRef.current = true;
    await refetch();
  }, [refetch]);

  return {
    // Data
    variantGroup,
    loading,
    error,
    excludeProductIds,
    // Modal states
    showEditModal,
    showAddProductsModal,
    showCreateProductModal,
    showEditProductModal,
    selectedProductForEdit,
    // Inline edit name states
    editingName,
    editedName,
    savingName,
    setEditedName,
    // Inline edit type states
    editingType,
    editedType,
    savingType,
    setEditedType,
    // Modal handlers
    handleEditGroup,
    handleAddProducts,
    handleCreateProduct,
    handleModalSubmit,
    handleEditGroupSubmit,
    setShowEditModal,
    setShowAddProductsModal,
    setShowCreateProductModal,
    // Product handlers
    handleCreateProductSubmit,
    handleRemoveProduct,
    handleProductsSelect,
    handleEditProduct,
    handleCloseEditProductModal,
    handleProductUpdated,
    // Inline edit handlers
    handleStartEditName,
    handleSaveName,
    handleCancelEditName,
    handleStartEditType,
    handleSaveType,
    handleCancelEditType,
  };
}
