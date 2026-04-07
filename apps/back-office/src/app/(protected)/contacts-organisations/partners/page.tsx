'use client';

import {
  ConfirmDeleteOrganisationModal,
  PartnerFormModal,
} from '@verone/organisations';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@verone/ui';

import { usePartnersPage } from './hooks';
import { PartnersHeader } from './components/PartnersHeader';
import { PartnersStats } from './components/PartnersStats';
import { PartnersFilters } from './components/PartnersFilters';
import { PartnersGridView } from './components/PartnersGridView';
import { PartnersListView } from './components/PartnersListView';
import { PartnersEmptyState } from './components/PartnersEmptyState';

export default function PartnersPage() {
  const {
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    archivedPartners,
    isModalOpen,
    selectedPartner,
    currentPage,
    setCurrentPage,
    viewMode,
    deleteModalPartner,
    setDeleteModalPartner,
    isDeleting,
    partners,
    isLoading,
    displayedPartners,
    paginatedPartners,
    totalPages,
    stats,
    handleArchive,
    handleDelete,
    handleConfirmDelete,
    handleCreatePartner,
    handleCloseModal,
    handlePartnerSuccess,
    handleViewModeChange,
    onFavoriteToggle,
  } = usePartnersPage();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PartnersHeader onCreatePartner={handleCreatePartner} />

      <PartnersStats stats={stats} />

      <PartnersFilters
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        partners={partners}
        archivedCount={archivedPartners.length}
      />

      {viewMode === 'grid' ? (
        <PartnersGridView
          paginatedPartners={paginatedPartners}
          isLoading={isLoading}
          activeTab={activeTab}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onFavoriteToggle={onFavoriteToggle}
        />
      ) : (
        <PartnersListView
          paginatedPartners={paginatedPartners}
          isLoading={isLoading}
          activeTab={activeTab}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onFavoriteToggle={onFavoriteToggle}
        />
      )}

      {totalPages > 1 && !isLoading && paginatedPartners.length > 0 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={
                  currentPage === 1
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) pageNum = i + 1;
              else if (currentPage <= 4) pageNum = i + 1;
              else if (currentPage >= totalPages - 3)
                pageNum = totalPages - 6 + i;
              else pageNum = currentPage - 3 + i;
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => setCurrentPage(pageNum)}
                    isActive={currentPage === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={
                  currentPage === totalPages
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {displayedPartners.length === 0 && !isLoading && (
        <PartnersEmptyState
          searchQuery={searchQuery}
          activeTab={activeTab}
          onCreatePartner={handleCreatePartner}
        />
      )}

      <PartnerFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        partner={selectedPartner ?? undefined}
        onSuccess={handlePartnerSuccess}
      />

      <ConfirmDeleteOrganisationModal
        open={!!deleteModalPartner}
        onOpenChange={open => !open && setDeleteModalPartner(null)}
        organisation={deleteModalPartner}
        organisationType="partner"
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
