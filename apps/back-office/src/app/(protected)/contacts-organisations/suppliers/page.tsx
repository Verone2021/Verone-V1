'use client';

import {
  ConfirmDeleteOrganisationModal,
  SupplierFormModal,
} from '@verone/organisations';

import { useSuppliersPage } from './hooks/useSuppliersPage';
import { SuppliersEmptyState } from './components/SuppliersEmptyState';
import { SuppliersFilters } from './components/SuppliersFilters';
import { SuppliersGridView } from './components/SuppliersGridView';
import { SuppliersHeader } from './components/SuppliersHeader';
import { SuppliersListView } from './components/SuppliersListView';
import { SuppliersPagination } from './components/SuppliersPagination';
import { SuppliersStats } from './components/SuppliersStats';

export default function SuppliersPage() {
  const {
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    archivedSuppliers,
    isModalOpen,
    selectedSupplier,
    deleteModalSupplier,
    setDeleteModalSupplier,
    isDeleting,
    currentPage,
    setCurrentPage,
    viewMode,
    handleViewModeChange,
    suppliers,
    isLoading,
    displayedSuppliers,
    paginatedSuppliers,
    totalPages,
    stats,
    handleCreateSupplier,
    handleCloseModal,
    handleSupplierSuccess,
    handleArchive,
    handleDelete,
    handleConfirmDelete,
    loadArchivedSuppliersData,
    refetch,
  } = useSuppliersPage();

  const handleFavoriteRefresh = () => {
    void refetch().catch(error => {
      console.error('[Suppliers] Refetch after favorite toggle failed:', error);
    });
    void loadArchivedSuppliersData().catch(error => {
      console.error(
        '[Suppliers] Load archived after favorite toggle failed:',
        error
      );
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <SuppliersHeader onCreateSupplier={handleCreateSupplier} />

      <SuppliersStats stats={stats} />

      <SuppliersFilters
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        suppliers={suppliers}
        archivedSuppliers={archivedSuppliers}
      />

      {viewMode === 'grid' ? (
        <SuppliersGridView
          suppliers={paginatedSuppliers}
          isLoading={isLoading}
          activeTab={activeTab}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onFavoriteRefresh={handleFavoriteRefresh}
        />
      ) : (
        <SuppliersListView
          suppliers={paginatedSuppliers}
          isLoading={isLoading}
          activeTab={activeTab}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onFavoriteRefresh={handleFavoriteRefresh}
        />
      )}

      {totalPages > 1 && !isLoading && paginatedSuppliers.length > 0 && (
        <SuppliersPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {displayedSuppliers.length === 0 && !isLoading && (
        <SuppliersEmptyState
          activeTab={activeTab}
          searchQuery={searchQuery}
          onCreateSupplier={handleCreateSupplier}
        />
      )}

      <SupplierFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        supplier={selectedSupplier ?? undefined}
        onSuccess={handleSupplierSuccess}
      />

      <ConfirmDeleteOrganisationModal
        open={!!deleteModalSupplier}
        onOpenChange={open => !open && setDeleteModalSupplier(null)}
        organisation={deleteModalSupplier}
        organisationType="supplier"
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
