'use client';

import { useCollectionsPage } from './hooks';

import { BulkActionsBar } from './components/BulkActionsBar';
import { CollectionModals } from './components/CollectionModals';
import { CollectionsFilters } from './components/CollectionsFilters';
import { CollectionsGrid } from './components/CollectionsGrid';
import { CollectionsHeader } from './components/CollectionsHeader';
import { CollectionsKPIs } from './components/CollectionsKPIs';
import { CollectionsTabs } from './components/CollectionsTabs';

export default function CollectionsPage() {
  const {
    filters,
    setFilters,
    selectedCollections,
    editingCollection,
    showEditModal,
    setShowEditModal,
    managingProductsCollection,
    showProductsModal,
    setShowProductsModal,
    activeTab,
    setActiveTab,
    archivedCollections,
    archivedLoading,
    filteredCollections,
    loading,
    error,
    stats,
    toggleCollectionSelection,
    handleBulkStatusToggle,
    handleEditCollection,
    handleManageProducts,
    handleCreateCollection,
    handleDeleteCollection,
    handleSaveCollection,
    handleArchiveCollection,
    handleAddProductsToCollection,
    navigateToCollection,
  } = useCollectionsPage();

  return (
    <div className="space-y-6">
      <CollectionsHeader onCreateCollection={handleCreateCollection} />

      <CollectionsKPIs
        stats={stats}
        loading={loading}
        archivedLoading={archivedLoading}
      />

      <CollectionsTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeCount={filteredCollections.length}
        archivedCount={archivedCollections.length}
      />

      <CollectionsFilters filters={filters} onFiltersChange={setFilters} />

      <BulkActionsBar
        selectedCount={selectedCollections.length}
        onBulkStatusToggle={handleBulkStatusToggle}
        onClearSelection={() => {
          // TODO: Implémenter suppression en lot
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr px-6">
        <CollectionsGrid
          collections={
            activeTab === 'active' ? filteredCollections : archivedCollections
          }
          isLoading={
            (activeTab === 'active' && loading) ||
            (activeTab === 'archived' && archivedLoading)
          }
          error={error}
          isArchived={activeTab === 'archived'}
          selectedCollections={selectedCollections}
          onSelect={toggleCollectionSelection}
          onManageProducts={handleManageProducts}
          onEdit={handleEditCollection}
          onArchive={handleArchiveCollection}
          onDelete={handleDeleteCollection}
          onNavigate={navigateToCollection}
        />
      </div>

      <CollectionModals
        showEditModal={showEditModal}
        onCloseEditModal={() => setShowEditModal(false)}
        onSaveCollection={handleSaveCollection}
        editingCollection={editingCollection}
        showProductsModal={showProductsModal}
        managingProductsCollection={managingProductsCollection}
        onCloseProductsModal={() => setShowProductsModal(false)}
        onAddProducts={handleAddProductsToCollection}
      />
    </div>
  );
}
