'use client';

import { use } from 'react';

import { useRouter } from 'next/navigation';

import { ButtonV2 } from '@verone/ui';
import { ChevronLeft, Package, Plus } from 'lucide-react';

import { VariantProductCard } from './components/VariantProductCard';
import { VariantGroupHeader } from './components/VariantGroupHeader';
import { VariantGroupInfoCard } from './components/VariantGroupInfoCard';
import { VariantGroupStatsCards } from './components/VariantGroupStatsCards';
import { VariantGroupModals } from './components/VariantGroupModals';
import { useVariantGroupPage } from './hooks';

interface VariantGroupDetailPageProps {
  params: Promise<{
    groupId: string;
  }>;
}

export default function VariantGroupDetailPage({
  params,
}: VariantGroupDetailPageProps) {
  const router = useRouter();
  const { groupId } = use(params);

  const {
    variantGroup,
    loading,
    error,
    excludeProductIds,
    showEditModal,
    showAddProductsModal,
    showCreateProductModal,
    showEditProductModal,
    selectedProductForEdit,
    editingName,
    editedName,
    savingName,
    setEditedName,
    editingType,
    editedType,
    savingType,
    setEditedType,
    handleEditGroup,
    handleAddProducts,
    handleCreateProduct,
    handleModalSubmit,
    handleEditGroupSubmit,
    setShowEditModal,
    setShowAddProductsModal,
    setShowCreateProductModal,
    handleCreateProductSubmit,
    handleRemoveProduct,
    handleProductsSelect,
    handleEditProduct,
    handleCloseEditProductModal,
    handleProductUpdated,
    handleStartEditName,
    handleSaveName,
    handleCancelEditName,
    handleStartEditType,
    handleSaveType,
    handleCancelEditType,
  } = useVariantGroupPage(groupId);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !variantGroup) {
    return (
      <div className="container mx-auto px-4 py-6">
        <ButtonV2
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Retour
        </ButtonV2>
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Groupe de variantes introuvable
          </h2>
          <p className="text-gray-600">
            {error ?? "Ce groupe n'existe pas ou a été supprimé."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <VariantGroupHeader
        variantGroupName={variantGroup.name}
        variantType={variantGroup.variant_type}
        editingName={editingName}
        editedName={editedName}
        savingName={savingName}
        onEditGroup={handleEditGroup}
        onCreateProduct={handleCreateProduct}
        onAddProducts={handleAddProducts}
        onStartEditName={handleStartEditName}
        onSaveName={handleSaveName}
        onCancelEditName={handleCancelEditName}
        onEditedNameChange={setEditedName}
        router={router}
      />

      <VariantGroupStatsCards
        productCount={variantGroup.product_count ?? 0}
        variantType={variantGroup.variant_type}
        createdAt={variantGroup.created_at}
        updatedAt={variantGroup.updated_at}
      />

      <VariantGroupInfoCard
        variantGroup={variantGroup}
        editingType={editingType}
        editedType={editedType}
        savingType={savingType}
        onStartEditType={handleStartEditType}
        onSaveType={handleSaveType}
        onCancelEditType={handleCancelEditType}
        onEditedTypeChange={setEditedType}
      />

      {/* Liste des produits */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Produits du groupe ({variantGroup.products?.length ?? 0})
        </h2>

        {variantGroup.products && variantGroup.products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 auto-rows-fr">
            {variantGroup.products.map(product => (
              <VariantProductCard
                key={product.id}
                product={product}
                variantType={variantGroup.variant_type ?? ''}
                hasCommonSupplier={variantGroup.has_common_supplier ?? false}
                groupDimensions={
                  variantGroup.dimensions_length
                    ? {
                        length: variantGroup.dimensions_length,
                        width: variantGroup.dimensions_width ?? null,
                        height: variantGroup.dimensions_height ?? null,
                        unit: variantGroup.dimensions_unit ?? 'cm',
                      }
                    : null
                }
                onRemove={(id, name) => {
                  void handleRemoveProduct(id, name).catch(err => {
                    console.error('[VariantGroup] Remove product failed:', err);
                  });
                }}
                onEdit={handleEditProduct}
                router={router}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun produit
            </h3>
            <p className="text-gray-600 mb-4">
              Ce groupe ne contient pas encore de produits.
            </p>
            <ButtonV2
              onClick={handleAddProducts}
              className="bg-black text-white hover:bg-gray-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter des produits
            </ButtonV2>
          </div>
        )}
      </div>

      <VariantGroupModals
        variantGroup={variantGroup}
        showEditModal={showEditModal}
        showAddProductsModal={showAddProductsModal}
        showCreateProductModal={showCreateProductModal}
        showEditProductModal={showEditProductModal}
        selectedProductForEdit={selectedProductForEdit}
        excludeProductIds={excludeProductIds}
        onCloseEditModal={() => setShowEditModal(false)}
        onCloseAddProductsModal={() => setShowAddProductsModal(false)}
        onCloseCreateProductModal={() => setShowCreateProductModal(false)}
        onCloseEditProductModal={handleCloseEditProductModal}
        onEditGroupSubmit={handleEditGroupSubmit}
        onProductsSelect={handleProductsSelect}
        onCreateProductSubmit={handleCreateProductSubmit}
        onProductCreated={handleModalSubmit}
        onProductUpdated={() => {
          void handleProductUpdated().catch(err => {
            console.error('[VariantGroup] Product update failed:', err);
          });
        }}
      />
    </div>
  );
}
