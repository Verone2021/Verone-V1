'use client';

import { useState, useMemo } from 'react';

import { useToast } from '@verone/common';

import {
  useLinkMeEnseignes,
  useDeleteEnseigne,
  useToggleEnseigneActive,
  type EnseigneWithStats,
} from '../../hooks/use-linkme-enseignes';
import { CreateEnseigneModal } from './CreateEnseigneModal';
import { EditEnseigneModal } from './EditEnseigneModal';
import { EnseigneDetailModal } from './EnseigneDetailModal';
import { EnseignesHeader } from './EnseignesHeader';
import { EnseignesList } from './EnseignesList';
import { EnseignesStatsCards } from './EnseignesStatsCards';
import { EnseignesTabs } from './EnseignesTabs';
import { OrganisationsList } from './OrganisationsList';
import { useOrganisationsIndependantes } from './use-organisations-independantes';

/**
 * EnseignesSection - Gestion des enseignes & organisations LinkMe
 *
 * 2 onglets :
 * - Enseignes : réseaux de franchises (ex: Pokawa)
 * - Organisations : affiliés de type organisation (entreprises individuelles)
 */
export function EnseignesSection() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'enseignes' | 'organisations'>(
    'enseignes'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEnseigne, setSelectedEnseigne] =
    useState<EnseigneWithStats | null>(null);

  // Hooks queries
  const {
    data: enseignes,
    isLoading,
    refetch: _refetch,
  } = useLinkMeEnseignes();

  // Hooks mutations
  const deleteEnseigne = useDeleteEnseigne();
  const toggleActive = useToggleEnseigneActive();

  // Hook organisations indépendantes (Supabase fetch encapsulé)
  const { organisationsIndependantes, loadingOrgs } =
    useOrganisationsIndependantes();

  // Filtered enseignes
  const filteredEnseignes = useMemo(() => {
    if (!enseignes) return [];

    return enseignes.filter(enseigne => {
      const matchesSearch =
        searchTerm === '' ||
        enseigne.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enseigne.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && enseigne.is_active) ||
        (statusFilter === 'inactive' && !enseigne.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [enseignes, searchTerm, statusFilter]);

  // Filtered organisations indépendantes
  const filteredOrganisations = useMemo(() => {
    return organisationsIndependantes.filter(org => {
      const matchesSearch =
        searchTerm === '' ||
        org.legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.trade_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && org.is_linkme_active) ||
        (statusFilter === 'inactive' && !org.is_linkme_active);

      return matchesSearch && matchesStatus;
    });
  }, [organisationsIndependantes, searchTerm, statusFilter]);

  // Handlers
  const _handleDeleteEnseigne = async (enseigne: EnseigneWithStats) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${enseigne.name}" ?`))
      return;

    try {
      await deleteEnseigne.mutateAsync(enseigne.id);
      toast({
        title: 'Succès',
        description: `Enseigne "${enseigne.name}" supprimée`,
      });
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Erreur lors de la suppression',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (enseigne: EnseigneWithStats) => {
    try {
      await toggleActive.mutateAsync({
        enseigneId: enseigne.id,
        isActive: !enseigne.is_active,
      });
      toast({
        title: 'Succès',
        description: `Enseigne ${enseigne.is_active ? 'désactivée' : 'activée'}`,
      });
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Erreur lors du changement de statut',
        variant: 'destructive',
      });
    }
  };

  const _openEditModal = (enseigne: EnseigneWithStats) => {
    setSelectedEnseigne(enseigne);
    setIsEditModalOpen(true);
  };

  const _openDetailModal = (enseigne: EnseigneWithStats) => {
    setSelectedEnseigne(enseigne);
    setIsDetailModalOpen(true);
  };

  // Logo URL helper
  const getLogoUrl = (logoPath: string | null) => {
    if (!logoPath) return null;
    if (logoPath.startsWith('http')) return logoPath;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/organisation-logos/${logoPath}`;
  };

  // Stats summary
  const stats = useMemo(() => {
    if (!enseignes) return { total: 0, active: 0, inactive: 0, totalOrgs: 0 };
    return {
      total: enseignes.length,
      active: enseignes.filter(e => e.is_active).length,
      inactive: enseignes.filter(e => !e.is_active).length,
      totalOrgs: enseignes.reduce((sum, e) => sum + e.organisations_count, 0),
    };
  }, [enseignes]);

  return (
    <div className="space-y-6">
      <EnseignesHeader
        activeTab={activeTab}
        onNewEnseigne={() => setIsCreateModalOpen(true)}
      />

      <EnseignesTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        enseignes={enseignes}
        organisationsIndependantes={organisationsIndependantes}
      />

      <EnseignesStatsCards
        activeTab={activeTab}
        stats={stats}
        organisationsIndependantes={organisationsIndependantes}
      />

      {activeTab === 'enseignes' && (
        <EnseignesList
          enseignes={filteredEnseignes}
          isLoading={isLoading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          getLogoUrl={getLogoUrl}
          onToggleActive={enseigne => {
            void handleToggleActive(enseigne).catch(error => {
              console.error(
                '[EnseignesSection] handleToggleActive failed:',
                error
              );
            });
          }}
          onOpenCreate={() => setIsCreateModalOpen(true)}
        />
      )}

      {activeTab === 'organisations' && (
        <OrganisationsList
          organisations={filteredOrganisations}
          loadingOrgs={loadingOrgs}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          getLogoUrl={getLogoUrl}
        />
      )}

      <CreateEnseigneModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />

      <EditEnseigneModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        enseigne={selectedEnseigne}
      />

      <EnseigneDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        enseigne={selectedEnseigne}
        getLogoUrl={getLogoUrl}
        onToggleActive={handleToggleActive}
      />

      {/* NOTE: Modal Organisation supprimé - les organisations redirigent vers le CRM */}
    </div>
  );
}
