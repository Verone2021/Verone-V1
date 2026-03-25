'use client';

import { use } from 'react';

import { useRouter } from 'next/navigation';

import { Card, CardContent, Skeleton } from '@verone/ui';
import { ArrowLeft } from 'lucide-react';

import { SelectionPageHeader } from './selection-header';
import { SelectionItems } from './selection-items';
import { AddProductModal, ViewEditDeleteModals } from './selection-modals';
import { useSelectionDetail } from './use-selection-detail';

function SelectionLoadingSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-64 col-span-2" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

function SelectionErrorCard({ onBack }: { onBack: () => void }) {
  return (
    <div className="container mx-auto py-6">
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">
            Erreur lors du chargement de la sélection.
          </p>
          <button
            onClick={onBack}
            className="inline-flex items-center justify-center mt-4 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

type PageState = ReturnType<typeof useSelectionDetail>;

function SelectionPageItems({ state, id }: { state: PageState; id: string }) {
  const {
    selection,
    divergentItems,
    isSyncingAll,
    syncingItemIds,
    isProductsOpen,
    setIsProductsOpen,
    productTab,
    setProductTab,
    productSearchQuery,
    setProductSearchQuery,
    toggleVisibility,
    removeProduct,
    handleSyncAll,
    handleSyncItem,
    handleOpenViewModal,
    handleOpenEditModal,
    setDeleteItemId,
    setIsAddModalOpen,
  } = state;
  return (
    <SelectionItems
      selectionId={id}
      items={selection!.items ?? []}
      productTab={productTab}
      productSearchQuery={productSearchQuery}
      isProductsOpen={isProductsOpen}
      divergentItemsCount={divergentItems.length}
      isSyncingAll={isSyncingAll}
      syncingItemIds={syncingItemIds}
      toggleVisibilityPending={toggleVisibility.isPending}
      removeProductPending={removeProduct.isPending}
      onProductsOpenChange={setIsProductsOpen}
      onProductTabChange={setProductTab}
      onProductSearchChange={setProductSearchQuery}
      onAddProduct={() => setIsAddModalOpen(true)}
      onSyncAll={() => {
        void handleSyncAll().catch((e: unknown) => {
          console.error('[Selections] syncAll failed:', e);
        });
      }}
      onSyncItem={item => {
        void handleSyncItem(item).catch((e: unknown) => {
          console.error('[Selections] syncItem failed:', e);
        });
      }}
      onToggleVisibility={item => {
        void toggleVisibility
          .mutateAsync({
            itemId: item.id,
            isHidden: !item.is_hidden_by_staff,
            selectionId: id,
          })
          .catch((e: unknown) => {
            console.error('[Selections] toggleVisibility failed:', e);
          });
      }}
      onOpenViewModal={handleOpenViewModal}
      onOpenEditModal={handleOpenEditModal}
      onDeleteItem={itemId => setDeleteItemId(itemId)}
    />
  );
}

function SelectionAddProductModal({ state }: { state: PageState }) {
  const {
    isAddModalOpen,
    setIsAddModalOpen,
    productSource,
    setProductSource,
    searchQuery,
    setSearchQuery,
    selectedProductId,
    setSelectedProductId,
    newMarginRate,
    setNewMarginRate,
    availableCatalogProducts,
    availableSourcedProducts,
    filteredCatalogProducts,
    filteredSourcedProducts,
    hasSourcedProducts,
    addProduct,
    handleAddProduct,
  } = state;
  return (
    <AddProductModal
      open={isAddModalOpen}
      onOpenChange={setIsAddModalOpen}
      productSource={productSource}
      searchQuery={searchQuery}
      selectedProductId={selectedProductId}
      newMarginRate={newMarginRate}
      availableCatalogProducts={availableCatalogProducts}
      availableSourcedProducts={availableSourcedProducts}
      filteredCatalogProducts={filteredCatalogProducts}
      filteredSourcedProducts={filteredSourcedProducts}
      hasSourcedProducts={hasSourcedProducts}
      isAdding={addProduct.isPending}
      onProductSourceChange={source => {
        setProductSource(source);
        setSelectedProductId(null);
        setSearchQuery('');
      }}
      onSearchChange={setSearchQuery}
      onSelectProduct={(productId, margin) => {
        setSelectedProductId(productId);
        setNewMarginRate(margin);
      }}
      onMarginChange={setNewMarginRate}
      onAdd={handleAddProduct}
    />
  );
}

function SelectionViewEditModals({ state }: { state: PageState }) {
  const {
    isViewModalOpen,
    setIsViewModalOpen,
    viewItem,
    isEditModalOpen,
    setIsEditModalOpen,
    editItem,
    deleteItemId,
    updateItem,
    removeProduct,
    handleSaveFromDetail,
    handleRemoveProduct,
    setDeleteItemId,
  } = state;
  return (
    <ViewEditDeleteModals
      isViewModalOpen={isViewModalOpen}
      onViewModalOpenChange={setIsViewModalOpen}
      viewItem={viewItem}
      isEditModalOpen={isEditModalOpen}
      onEditModalOpenChange={setIsEditModalOpen}
      editItem={editItem}
      isSavingItem={updateItem.isPending}
      deleteItemId={deleteItemId}
      isRemoving={removeProduct.isPending}
      onDeleteOpenChange={() => setDeleteItemId(null)}
      onSaveFromDetail={handleSaveFromDetail}
      onConfirmDelete={async () => {
        if (deleteItemId) await handleRemoveProduct(deleteItemId);
      }}
    />
  );
}

export default function SelectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const state = useSelectionDetail(id);

  if (state.isLoading) return <SelectionLoadingSkeleton />;
  if (state.error || !state.selection)
    return <SelectionErrorCard onBack={() => router.back()} />;

  const {
    selection,
    formData,
    setFormData,
    setIsDirty,
    updateSelection,
    handleSave,
  } = state;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <SelectionPageHeader
        selection={selection}
        formData={formData}
        isDirty={state.isDirty}
        isSaving={updateSelection.isPending}
        onSave={() => {
          void handleSave().catch((e: unknown) => {
            console.error('[Selections] handleSave failed:', e);
          });
        }}
        onFormChange={updates => {
          setFormData(prev => ({ ...prev, ...updates }));
          setIsDirty(true);
        }}
      />
      <SelectionPageItems state={state} id={id} />
      <SelectionAddProductModal state={state} />
      <SelectionViewEditModals state={state} />
    </div>
  );
}
