'use client';

import { AssignOrganisationsModal } from '@verone/organisations';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@verone/ui';
import { colors } from '@verone/ui/design-system';
import { cn } from '@verone/utils';

import { EnseigneCreateEditModal } from './components/EnseigneCreateEditModal';
import { EnseigneDeleteModal } from './components/EnseigneDeleteModal';
import { EnseigneGridView } from './components/EnseigneGridView';
import { EnseigneListView } from './components/EnseigneListView';
import { EnseignesFilters } from './components/EnseignesFilters';
import { EnseignesHeader } from './components/EnseignesHeader';
import { EnseignesStats } from './components/EnseignesStats';
import { useEnseignesPage } from './hooks/useEnseignesPage';

export default function EnseignesPage() {
  const {
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    currentPage,
    setCurrentPage,
    viewMode,
    setViewMode,
    isCreateModalOpen,
    editingEnseigne,
    deleteConfirmEnseigne,
    setDeleteConfirmEnseigne,
    assignOrgsEnseigne,
    setAssignOrgsEnseigne,
    isSubmitting,
    logoUploadRef,
    formData,
    setFormData,
    stats,
    paginatedEnseignes,
    totalPages,
    isLoading,
    error,
    enseigneWithOrgs,
    refetch,
    linkOrganisationToEnseigne,
    unlinkOrganisationFromEnseigne,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleCloseModal,
    handleSubmit,
    handleArchive,
    handleDelete,
  } = useEnseignesPage();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <EnseignesHeader onCreateClick={handleOpenCreateModal} />

      <EnseignesStats stats={stats} />

      <EnseignesFilters
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        stats={stats}
      />

      {/* Error state */}
      {error && (
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: colors.danger[50],
            color: colors.danger[700],
          }}
        >
          {error}
        </div>
      )}

      {/* Enseignes Grid ou List */}
      {viewMode === 'grid' ? (
        <EnseigneGridView
          enseignes={paginatedEnseignes}
          isLoading={isLoading}
          onEdit={handleOpenEditModal}
          onArchive={enseigne => {
            void handleArchive(enseigne).catch(err => {
              console.error('[Enseignes] Archive action failed:', err);
            });
          }}
          onDelete={setDeleteConfirmEnseigne}
        />
      ) : (
        <EnseigneListView
          enseignes={paginatedEnseignes}
          isLoading={isLoading}
          onEdit={handleOpenEditModal}
          onArchive={enseigne => {
            void handleArchive(enseigne).catch(err => {
              console.error('[Enseignes] Archive action failed:', err);
            });
          }}
          onDelete={setDeleteConfirmEnseigne}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={cn(
                  currentPage === 1 && 'pointer-events-none opacity-50'
                )}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={cn(
                  currentPage === totalPages && 'pointer-events-none opacity-50'
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <EnseigneCreateEditModal
        open={isCreateModalOpen}
        editingEnseigne={editingEnseigne}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
        logoUploadRef={logoUploadRef}
        onClose={handleCloseModal}
        onSubmit={() => {
          void handleSubmit().catch(err => {
            console.error('[Enseignes] Submit failed:', err);
          });
        }}
        onRefetch={() => {
          void refetch().catch(error => {
            console.error('[Enseignes] Refetch after upload failed:', error);
          });
        }}
      />

      <EnseigneDeleteModal
        enseigne={deleteConfirmEnseigne}
        isSubmitting={isSubmitting}
        onClose={() => setDeleteConfirmEnseigne(null)}
        onConfirm={() => {
          void handleDelete().catch(err => {
            console.error('[Enseignes] Delete failed:', err);
          });
        }}
      />

      {/* Assign Organisations Modal */}
      <AssignOrganisationsModal
        open={!!assignOrgsEnseigne}
        onOpenChange={open => {
          if (!open) setAssignOrgsEnseigne(null);
        }}
        enseigne={assignOrgsEnseigne}
        currentOrganisations={enseigneWithOrgs?.organisations ?? []}
        onAssign={async (organisationId, isParent) => {
          if (!assignOrgsEnseigne) return false;
          return await linkOrganisationToEnseigne(
            organisationId,
            assignOrgsEnseigne.id,
            isParent
          );
        }}
        onUnassign={async organisationId => {
          return await unlinkOrganisationFromEnseigne(organisationId);
        }}
        onSuccess={() => {
          void refetch().catch(error => {
            console.error(
              '[Enseignes] Refetch after assign success failed:',
              error
            );
          });
        }}
      />
    </div>
  );
}
