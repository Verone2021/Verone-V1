'use client';

import { KPICardUnified } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Plus, Palette, Package, Layers, Tags } from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';

import { VariantGroupCard } from './VariantGroupCard';
import { VariantesSkeleton } from './VariantesSkeleton';
import { VariantesFilters } from './VariantesFilters';
import { VariantesModals } from './VariantesModals';
import { VariantSuggestionsSection } from './VariantSuggestionsSection';
import { useVariantesPage } from './use-variantes-page';

export default function VariantesPage() {
  const {
    filters,
    setFilters,
    selectedGroups,
    toggleGroupSelection,
    editingGroup,
    setEditingGroup,
    showEditModal,
    setShowEditModal,
    showAddProductsModal,
    setShowAddProductsModal,
    selectedGroupForProducts,
    setSelectedGroupForProducts,
    activeTab,
    setActiveTab,
    archivedVariantGroups,
    archivedLoading,
    variantGroups,
    loading,
    error,
    refetch,
    updateVariantGroup,
    handleEditGroup,
    handleCreateGroup,
    handleDeleteGroup,
    handleArchiveGroup,
    handleAddProducts,
    handleRemoveProduct,
    filteredVariantGroups,
    stats,
  } = useVariantesPage();

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        title="Gestion des Variantes"
        description="Organisation des variantes de produits (couleurs, tailles, matériaux)"
        icon={Palette}
        action={
          <ButtonV2 variant="primary" icon={Plus} onClick={handleCreateGroup}>
            Nouveau groupe
          </ButtonV2>
        }
      />

      <div className="p-6 space-y-4">
        {/* Suggestions automatiques de regroupements */}
        <VariantSuggestionsSection />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICardUnified
            variant="elegant"
            title="Groupes totaux"
            value={loading ? '...' : stats.total}
            icon={Layers}
          />
          <KPICardUnified
            variant="elegant"
            title="Produits totaux"
            value={loading ? '...' : stats.totalProducts}
            icon={Package}
          />
          <KPICardUnified
            variant="elegant"
            title="Types différents"
            value={loading ? '...' : stats.types}
            icon={Tags}
          />
        </div>

        {/* Onglets */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'active'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Variantes Actives ({variantGroups.length})
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'archived'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Variantes Archivées ({archivedVariantGroups.length})
          </button>
        </div>

        <VariantesFilters filters={filters} setFilters={setFilters} />

        {/* Actions groupées */}
        {selectedGroups.length > 0 && (
          <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-md">
            <span className="text-sm text-gray-700">
              {selectedGroups.length} groupe
              {selectedGroups.length !== 1 ? 's' : ''} sélectionné
              {selectedGroups.length !== 1 ? 's' : ''}
            </span>
            <ButtonV2
              variant="destructive"
              size="sm"
              onClick={() => {
                for (const groupId of selectedGroups) {
                  void handleDeleteGroup(groupId).catch((err: unknown) => {
                    console.error('[VariantesPage] Bulk delete failed:', err);
                  });
                }
              }}
            >
              Supprimer
            </ButtonV2>
          </div>
        )}

        {/* Grille des groupes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          {activeTab === 'active' ? (
            loading ? (
              <VariantesSkeleton />
            ) : error ? (
              <div className="col-span-full p-8 text-center text-red-500 bg-white rounded-lg border border-red-200">
                Erreur lors du chargement des groupes: {error}
              </div>
            ) : filteredVariantGroups.length > 0 ? (
              filteredVariantGroups.map(group => (
                <VariantGroupCard
                  key={group.id}
                  group={group}
                  isArchived={false}
                  isSelected={selectedGroups.includes(group.id)}
                  onToggleSelect={toggleGroupSelection}
                  onEdit={handleEditGroup}
                  onDelete={handleDeleteGroup}
                  onArchive={handleArchiveGroup}
                  onAddProducts={handleAddProducts}
                  onRemoveProduct={handleRemoveProduct}
                />
              ))
            ) : (
              <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
                Aucun groupe de variantes trouvé pour les critères sélectionnés
              </div>
            )
          ) : archivedLoading ? (
            <VariantesSkeleton />
          ) : archivedVariantGroups.length > 0 ? (
            archivedVariantGroups.map(group => (
              <VariantGroupCard
                key={group.id}
                group={group}
                isArchived
                isSelected={selectedGroups.includes(group.id)}
                onToggleSelect={toggleGroupSelection}
                onEdit={handleEditGroup}
                onDelete={handleDeleteGroup}
                onArchive={handleArchiveGroup}
                onAddProducts={handleAddProducts}
                onRemoveProduct={handleRemoveProduct}
              />
            ))
          ) : (
            <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
              Aucun groupe de variantes archivé
            </div>
          )}
        </div>

        <VariantesModals
          showEditModal={showEditModal}
          setShowEditModal={setShowEditModal}
          editingGroup={editingGroup}
          setEditingGroup={setEditingGroup}
          showAddProductsModal={showAddProductsModal}
          setShowAddProductsModal={setShowAddProductsModal}
          selectedGroupForProducts={selectedGroupForProducts}
          setSelectedGroupForProducts={setSelectedGroupForProducts}
          refetch={refetch}
          updateVariantGroup={updateVariantGroup}
        />
      </div>
    </div>
  );
}
