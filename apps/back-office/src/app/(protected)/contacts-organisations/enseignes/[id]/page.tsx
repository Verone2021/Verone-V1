'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import {
  EnseigneDetailHeader,
  EnseigneKPIGrid,
  EnseigneMapSection,
  EnseigneOrganisationsTable,
  OrganisationSelectorModal,
  CustomerOrganisationFormModal,
} from '@verone/organisations';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@verone/ui';
import { cn } from '@verone/utils';
import { ArrowLeft, Building2, MapPin, Package, Phone } from 'lucide-react';

import { EnseigneChannelsBanner } from './components/EnseigneChannelsBanner';
import { EnseigneContactsTab } from './components/EnseigneContactsTab';
import { EnseigneDeleteModal } from './components/EnseigneDeleteModal';
import { EnseigneEditModal } from './components/EnseigneEditModal';
import { EnseigneParentBanner } from './components/EnseigneParentBanner';
import { EnseigneProductsTab } from './components/EnseigneProductsTab';
import { useEnseigneDetail } from './hooks/use-enseigne-detail';

export default function EnseigneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const enseigneId = params.id as string;

  const {
    enseigne,
    loading,
    error,
    stats,
    statsLoading,
    mapData,
    mapLoading,
    contactsData,
    contactsLoading,
    enseigneProducts,
    productsLoading,
    enseigneChannels,
    selectedYear,
    setSelectedYear,
    activeTab,
    setActiveTab,
    showCreateContact,
    setShowCreateContact,
    newContact,
    setNewContact,
    createContactMutation,
    handleCreateEnseigneContact,
    isEditModalOpen,
    setIsEditModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isOrganisationModalOpen,
    setIsOrganisationModalOpen,
    isSubmitting,
    logoUploadRef,
    formData,
    setFormData,
    handleRefresh,
    handleOpenEditModal,
    handleSubmitEdit,
    handleDelete,
    handleSaveOrganisations,
    handleRemoveOrganisation,
  } = useEnseigneDetail(enseigneId);

  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-24 bg-white rounded-lg border" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-white rounded-lg border" />
              ))}
            </div>
            <div className="h-64 bg-white rounded-lg border" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-red-600">
                <p className="text-lg font-medium">Erreur</p>
                <p className="mt-2">{error}</p>
                <Link href="/contacts-organisations/enseignes">
                  <ButtonV2 variant="ghost" className="mt-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour aux enseignes
                  </ButtonV2>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Not found state
  if (!enseigne) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-gray-500">
                <p className="text-lg font-medium">Enseigne non trouvée</p>
                <p className="mt-2">
                  L'enseigne demandée n'existe pas ou a été supprimée.
                </p>
                <Link href="/contacts-organisations/enseignes">
                  <ButtonV2 variant="ghost" className="mt-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour aux enseignes
                  </ButtonV2>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <EnseigneDetailHeader
        enseigne={enseigne}
        onEdit={handleOpenEditModal}
        onManageOrganisations={() => setIsOrganisationModalOpen(true)}
      />

      {/* Contenu principal */}
      <div className="container mx-auto px-6 pt-4 space-y-4">
        {/* Section Canaux de Vente */}
        <EnseigneChannelsBanner channels={enseigneChannels} />

        {/* Hook jaune - Organisation Mère */}
        <EnseigneParentBanner parentOrganisation={stats?.parentOrganisation} />

        {/* Filtre annee + KPIs */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-600">Indicateurs</h2>
          <div className="flex items-center gap-2">
            {[null, 2024, 2025, 2026].map(y => (
              <button
                key={y ?? 'all'}
                onClick={() => setSelectedYear(y)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                  selectedYear === y
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {y ?? 'Toutes'}
              </button>
            ))}
          </div>
        </div>
        <EnseigneKPIGrid stats={stats} loading={statsLoading} />

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            variant="underline"
            className="w-full justify-start border-b"
          >
            <TabsTrigger value="overview" variant="underline">
              <Building2 className="h-4 w-4 mr-2" />
              Vue d&apos;ensemble
            </TabsTrigger>
            <TabsTrigger value="contacts" variant="underline">
              <Phone className="h-4 w-4 mr-2" />
              Contacts ({contactsData?.contacts.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="geography" variant="underline">
              <MapPin className="h-4 w-4 mr-2" />
              Geographie
            </TabsTrigger>
            <TabsTrigger value="products" variant="underline">
              <Package className="h-4 w-4 mr-2" />
              Produits sources ({enseigneProducts.length})
            </TabsTrigger>
          </TabsList>

          {/* Onglet Vue d'ensemble */}
          <TabsContent value="overview" className="mt-4">
            <EnseigneOrganisationsTable
              organisations={stats?.organisationsWithRevenue ?? []}
              parentOrganisation={stats?.parentOrganisation ?? null}
              onCreateOrganisation={() => setIsCreateOrgModalOpen(true)}
              onAddOrganisations={() => setIsOrganisationModalOpen(true)}
              onRemoveOrganisation={async orgId => {
                try {
                  await handleRemoveOrganisation(orgId);
                } catch (removeError) {
                  console.error(
                    '[EnseigneDetail] Remove organisation failed:',
                    removeError
                  );
                }
              }}
              loading={statsLoading}
            />
          </TabsContent>

          {/* Onglet Contacts */}
          <TabsContent value="contacts" className="mt-4">
            <EnseigneContactsTab
              enseigneId={params.id as string}
              contactsData={contactsData}
              contactsLoading={contactsLoading}
              showCreateContact={showCreateContact}
              setShowCreateContact={setShowCreateContact}
              newContact={newContact}
              setNewContact={setNewContact}
              createContactMutation={createContactMutation}
              handleCreateEnseigneContact={handleCreateEnseigneContact}
            />
          </TabsContent>

          {/* Onglet Geographie - contenu rendu hors container, voir ci-dessous */}
          <TabsContent value="geography" className="mt-0" />

          {/* Onglet Produits sources */}
          <TabsContent value="products" className="mt-4">
            <EnseigneProductsTab
              enseigneName={enseigne.name}
              products={enseigneProducts}
              loading={productsLoading}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Onglet Geographie - HORS container pour pleine largeur */}
      {activeTab === 'geography' && (
        <div className="px-6 pb-6">
          <EnseigneMapSection
            organisations={mapData?.organisations ?? []}
            totalOrganisations={mapData?.totalOrganisations ?? 0}
            propresCount={mapData?.propresCount ?? 0}
            franchisesCount={mapData?.franchisesCount ?? 0}
            withCoordinatesCount={mapData?.withCoordinatesCount ?? 0}
            loading={mapLoading}
            enseigneName={enseigne.name}
            onViewOrganisation={orgId =>
              router.push(`/contacts-organisations/organisations/${orgId}`)
            }
          />
        </div>
      )}

      {/* Modal Creation Organisation (formulaire unifie) */}
      <CustomerOrganisationFormModal
        isOpen={isCreateOrgModalOpen}
        onClose={() => setIsCreateOrgModalOpen(false)}
        enseigneId={enseigneId}
        sourceType="manual"
        onSuccess={() => {
          setIsCreateOrgModalOpen(false);
          handleRefresh();
        }}
      />

      {/* Modal Gestion Organisations (deux colonnes) */}
      <OrganisationSelectorModal
        open={isOrganisationModalOpen}
        onOpenChange={setIsOrganisationModalOpen}
        enseigne={enseigne}
        currentOrganisations={enseigne.organisations ?? []}
        onSave={handleSaveOrganisations}
        onSuccess={handleRefresh}
      />

      {/* Modal Édition */}
      <EnseigneEditModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        enseigne={enseigne}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
        logoUploadRef={logoUploadRef}
        handleRefresh={handleRefresh}
        handleSubmitEdit={() => {
          void handleSubmitEdit().catch(submitError => {
            console.error('[EnseigneDetail] Submit edit failed:', submitError);
          });
        }}
      />

      {/* Modal Suppression */}
      <EnseigneDeleteModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        enseigneName={enseigne.name}
        isSubmitting={isSubmitting}
        handleDelete={() => {
          void handleDelete().catch(deleteError => {
            console.error('[EnseigneDetail] Delete failed:', deleteError);
          });
        }}
      />
    </div>
  );
}
