'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Skeleton } from '@verone/ui';
import { Plus } from 'lucide-react';

import { AffiliateCreateModal } from './AffiliateCreateModal';
import { AffiliateEditModal } from './AffiliateEditModal';
import { AffiliatesFilters } from './AffiliatesFilters';
import { AffiliatesTable } from './AffiliatesTable';
import { useAffiliates } from './use-affiliates';

/**
 * AffiliatesSection - Gestion des apporteurs/affiliés LinkMe
 *
 * Types d'affiliés valides :
 * - enseigne : Réseau d'enseignes (ex: Pokawa)
 * - client_professionnel : Client B2B
 * - client_particulier : Client B2C
 *
 * Note : Commission et marge sont gérées au niveau produit, pas affilié
 */
export function AffiliatesSection() {
  const {
    organisations,
    enseignes,
    loading,
    filteredAffiliates,
    availableOrganisations,
    availableEnseignes,
    filteredEntities,
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    enseigneFilter,
    setEnseigneFilter,
    organisationFilter,
    setOrganisationFilter,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    selectedAffiliate,
    formData,
    setFormData,
    saving,
    entitySearch,
    setEntitySearch,
    resetForm,
    handleEntitySelect,
    openEditModal,
    handleCreateAffiliate,
    handleUpdateAffiliate,
    handleStatusChange,
    handleDeleteAffiliate,
  } = useAffiliates();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Apporteurs / Affiliés</CardTitle>
              <CardDescription>
                Gestion des enseignes et clients LinkMe
              </CardDescription>
            </div>
            <ButtonV2 onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel Affilié
            </ButtonV2>
          </div>
        </CardHeader>
        <CardContent>
          <AffiliatesFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            enseigneFilter={enseigneFilter}
            onEnseigneFilterChange={setEnseigneFilter}
            organisationFilter={organisationFilter}
            onOrganisationFilterChange={setOrganisationFilter}
            enseignes={enseignes}
            organisations={organisations}
          />
          <AffiliatesTable
            filteredAffiliates={filteredAffiliates}
            searchTerm={searchTerm}
            typeFilter={typeFilter}
            statusFilter={statusFilter}
            onEdit={openEditModal}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteAffiliate}
            onCreateClick={() => setIsCreateModalOpen(true)}
          />
        </CardContent>
      </Card>

      <AffiliateCreateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        formData={formData}
        setFormData={setFormData}
        saving={saving}
        entitySearch={entitySearch}
        setEntitySearch={setEntitySearch}
        filteredEntities={filteredEntities}
        availableOrganisations={availableOrganisations}
        availableEnseignes={availableEnseignes}
        onEntitySelect={handleEntitySelect}
        onCreate={handleCreateAffiliate}
        onCancel={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
      />

      <AffiliateEditModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        selectedAffiliate={selectedAffiliate}
        formData={formData}
        setFormData={setFormData}
        saving={saving}
        onUpdate={handleUpdateAffiliate}
      />
    </>
  );
}
