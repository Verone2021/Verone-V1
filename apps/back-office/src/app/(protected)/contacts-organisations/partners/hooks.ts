'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';

import { useLocalStorage } from '@verone/hooks';
import { useOrganisations, type Organisation } from '@verone/organisations';
import { createClient } from '@verone/utils/supabase/client';

export function usePartnersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<
    'active' | 'archived' | 'preferred'
  >('active');
  const [archivedPartners, setArchivedPartners] = useState<Organisation[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<
    Organisation | null | undefined
  >(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list'>(
    'partners-view-mode',
    'grid'
  );
  const [deleteModalPartner, setDeleteModalPartner] =
    useState<Organisation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 12;

  const filters = useMemo(
    () => ({
      type: 'supplier' as const,
      is_service_provider: true,
      is_active: true,
      search: searchQuery ?? undefined,
    }),
    [searchQuery]
  );

  const {
    organisations: partners,
    loading,
    error: _error,
    toggleOrganisationStatus: _toggleOrganisationStatus,
    archiveOrganisation,
    unarchiveOrganisation,
    hardDeleteOrganisation,
    refetch,
  } = useOrganisations(filters);

  const loadArchivedPartnersData = useCallback(async () => {
    setArchivedLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('organisations')
        .select('*') // TODO: specify columns
        .eq('type', 'partner')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false })
        .returns<Organisation[]>();

      if (error) throw error;
      setArchivedPartners(data ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(
        '[Partners] Erreur chargement partenaires archivés:',
        message
      );
    } finally {
      setArchivedLoading(false);
    }
  }, []);

  const handleArchive = async (partner: Organisation) => {
    if (!partner.archived_at) {
      const success = await archiveOrganisation(partner.id);
      if (success) {
        void refetch().catch(err => {
          console.error('[Partners] Refetch after archive failed:', err);
        });
        if (activeTab === 'archived') await loadArchivedPartnersData();
      }
    } else {
      const success = await unarchiveOrganisation(partner.id);
      if (success) {
        void refetch().catch(err => {
          console.error('[Partners] Refetch after unarchive failed:', err);
        });
        await loadArchivedPartnersData();
      }
    }
  };

  const handleDelete = (partner: Organisation) => {
    setDeleteModalPartner(partner);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalPartner) return;
    setIsDeleting(true);
    try {
      const success = await hardDeleteOrganisation(deleteModalPartner.id);
      if (success) {
        await loadArchivedPartnersData();
        setDeleteModalPartner(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreatePartner = () => {
    setSelectedPartner(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPartner(null);
  };

  const handlePartnerSuccess = () => {
    void refetch().catch(err => {
      console.error('[Partners] Refetch failed:', err);
    });
    handleCloseModal();
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };

  // Centralized callback for FavoriteToggleButton (used 4x in views)
  const onFavoriteToggle = useCallback(() => {
    void refetch().catch(err => {
      console.error('[Partners] Refetch after favorite toggle failed:', err);
    });
    void loadArchivedPartnersData().catch(err => {
      console.error(
        '[Partners] Load archived after favorite toggle failed:',
        err
      );
    });
  }, [refetch, loadArchivedPartnersData]);

  useEffect(() => {
    if (activeTab === 'archived') {
      void loadArchivedPartnersData().catch(err => {
        console.error('[Partners] Load archived data failed:', err);
      });
    }
  }, [activeTab, loadArchivedPartnersData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  const displayedPartners = useMemo(() => {
    if (activeTab === 'active') return partners;
    if (activeTab === 'archived') return archivedPartners;
    if (activeTab === 'preferred')
      return partners.filter(p => p.preferred_supplier === true);
    return partners;
  }, [activeTab, partners, archivedPartners]);

  const paginatedPartners = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return displayedPartners.slice(startIndex, startIndex + itemsPerPage);
  }, [displayedPartners, currentPage]);

  const totalPages = Math.ceil(displayedPartners.length / itemsPerPage);

  const stats = useMemo(
    () => ({
      total: partners.length,
      active: partners.filter(p => p.is_active).length,
      archived: archivedPartners.length,
      favorites: partners.filter(p => p.preferred_supplier === true).length,
    }),
    [partners, archivedPartners]
  );

  const isLoading =
    activeTab === 'active' || activeTab === 'preferred'
      ? loading
      : archivedLoading;

  return {
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
    loading,
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
  };
}
