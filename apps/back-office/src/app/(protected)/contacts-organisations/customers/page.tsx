'use client';

import {
  ConfirmDeleteOrganisationModal,
  CustomerOrganisationFormModal,
} from '@verone/organisations';

import { useCustomersPage } from './hooks/use-customers-page';
import { CustomerPageHeader } from './components/CustomerPageHeader';
import { CustomerStatsCards } from './components/CustomerStatsCards';
import { CustomerFiltersBar } from './components/CustomerFiltersBar';
import { CustomerGridView } from './components/CustomerGridView';
import { CustomerListView } from './components/CustomerListView';
import { CustomerPagination } from './components/CustomerPagination';
import { CustomerEmptyState } from './components/CustomerEmptyState';

export default function CustomersPage() {
  const {
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    archivedCustomers,
    isModalOpen,
    selectedCustomer,
    currentPage,
    setCurrentPage,
    viewMode,
    deleteModalCustomer,
    setDeleteModalCustomer,
    isDeleting,
    enseigneFilter,
    setEnseigneFilter,
    enseignes,
    typeInfo,
    filteredCustomers,
    incompleteCustomers,
    stats,
    displayedCustomers,
    paginatedCustomers,
    totalPages,
    isLoading,
    handleViewModeChange,
    handleCreateCustomer,
    handleCloseModal,
    handleCustomerSuccess,
    loadArchivedCustomersData,
    handleArchive,
    handleDelete,
    handleConfirmDelete,
    refetch,
  } = useCustomersPage();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <CustomerPageHeader
        typeInfo={typeInfo}
        onCreateCustomer={handleCreateCustomer}
      />

      <CustomerStatsCards
        stats={stats}
        archivedCount={archivedCustomers.length}
      />

      <CustomerFiltersBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        enseigneFilter={enseigneFilter}
        setEnseigneFilter={setEnseigneFilter}
        enseignes={enseignes}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        filteredCustomers={filteredCustomers}
        archivedCount={archivedCustomers.length}
        incompleteCount={incompleteCustomers.length}
      />

      {viewMode === 'grid' ? (
        <CustomerGridView
          isLoading={isLoading}
          paginatedCustomers={paginatedCustomers}
          activeTab={activeTab}
          onArchive={customer => {
            void handleArchive(customer).catch(error => {
              console.error('[Customers] Archive action failed:', error);
            });
          }}
          onDelete={handleDelete}
          onRefetch={() => {
            void refetch().catch(error => {
              console.error('[Customers] Refetch failed:', error);
            });
          }}
          onLoadArchived={() => {
            void loadArchivedCustomersData().catch(error => {
              console.error('[Customers] Load archived failed:', error);
            });
          }}
        />
      ) : (
        <CustomerListView
          isLoading={isLoading}
          paginatedCustomers={paginatedCustomers}
          activeTab={activeTab}
          onArchive={customer => {
            void handleArchive(customer).catch(error => {
              console.error('[Customers] Archive action failed:', error);
            });
          }}
          onDelete={handleDelete}
          onRefetch={() => {
            void refetch().catch(error => {
              console.error('[Customers] Refetch failed:', error);
            });
          }}
          onLoadArchived={() => {
            void loadArchivedCustomersData().catch(error => {
              console.error('[Customers] Load archived failed:', error);
            });
          }}
        />
      )}

      {totalPages > 1 && !isLoading && paginatedCustomers.length > 0 && (
        <CustomerPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {displayedCustomers.length === 0 && !isLoading && (
        <CustomerEmptyState
          searchQuery={searchQuery}
          activeTab={activeTab}
          onCreateCustomer={handleCreateCustomer}
        />
      )}

      <CustomerOrganisationFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleCustomerSuccess}
        organisation={selectedCustomer ?? null}
      />

      <ConfirmDeleteOrganisationModal
        open={!!deleteModalCustomer}
        onOpenChange={open => !open && setDeleteModalCustomer(null)}
        organisation={deleteModalCustomer}
        organisationType="customer"
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
