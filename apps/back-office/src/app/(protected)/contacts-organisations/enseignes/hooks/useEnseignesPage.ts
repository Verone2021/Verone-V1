'use client';

import { useState, useMemo, useEffect, useRef } from 'react';

import {
  useEnseignes,
  useEnseigne,
  type EnseigneLogoUploadRef,
  type Enseigne,
  type CreateEnseigneData,
} from '@verone/organisations';
import { createClient } from '@verone/utils/supabase/client';

/** Convertir un logo_url (path Storage ou URL complète) en URL affichable */
export function getEnseigneLogoUrl(
  logoUrl: string | null | undefined
): string | null {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('http')) return logoUrl;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/organisation-logos/${logoUrl}`;
}

export type FormData = CreateEnseigneData & { payment_delay_days: number };

export function useEnseignesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'archived' | 'all'>(
    'active'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const itemsPerPage = 12;

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEnseigne, setEditingEnseigne] = useState<Enseigne | null>(null);
  const [deleteConfirmEnseigne, setDeleteConfirmEnseigne] =
    useState<Enseigne | null>(null);
  const [assignOrgsEnseigne, setAssignOrgsEnseigne] = useState<Enseigne | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const logoUploadRef = useRef<EnseigneLogoUploadRef>(null);

  // Archived enseignes state
  const [archivedEnseignes, setArchivedEnseignes] = useState<Enseigne[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    logo_url: '',
    is_active: true,
    payment_delay_days: 0,
  });

  // Filtres selon l'onglet - actives seulement pour l'onglet actif
  const filters = useMemo(() => {
    const base: { is_active?: boolean; search?: string } = {};

    if (activeTab === 'active') {
      base.is_active = true;
    }
    // 'archived' et 'all' gérés séparément

    if (searchQuery) {
      base.search = searchQuery;
    }

    return base;
  }, [activeTab, searchQuery]);

  const {
    enseignes,
    loading,
    error,
    refetch,
    createEnseigne,
    updateEnseigne,
    deleteEnseigne,
    toggleEnseigneStatus,
    linkOrganisationToEnseigne,
    unlinkOrganisationFromEnseigne,
  } = useEnseignes(filters);

  // Hook pour récupérer les organisations de l'enseigne sélectionnée (pour le modal d'attribution)
  const { enseigne: enseigneWithOrgs } = useEnseigne(
    assignOrgsEnseigne?.id ?? ''
  );

  // Charger les enseignes archivées
  const loadArchivedEnseignes = async () => {
    setArchivedLoading(true);
    try {
      const supabase = createClient();

      type EnseigneWithOrgs = {
        id: string;
        name: string;
        description: string | null;
        logo_url: string | null;
        is_active: boolean;
        created_at: string;
        updated_at: string;
        enseigne_organisations: Array<{
          organisation_id: string;
        }> | null;
      };

      const { data, error } = await supabase
        .from('enseignes')
        .select(
          `
          *,
          enseigne_organisations!enseigne_organisations_enseigne_id_fkey(
            organisation_id
          )
        `
        )
        .eq('is_active', false)
        .order('updated_at', { ascending: false })
        .returns<EnseigneWithOrgs[]>();

      if (error) throw error;

      // Transformer les données pour avoir member_count
      const transformedData = (data ?? []).map(e => ({
        ...e,
        member_count: e.enseigne_organisations?.length ?? 0,
        created_by: null, // Ajout du champ requis par Enseigne
      }));

      setArchivedEnseignes(transformedData as Enseigne[]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(
        '[Enseignes] Erreur chargement enseignes archivées:',
        message
      );
    } finally {
      setArchivedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'archived') {
      void loadArchivedEnseignes().catch(error => {
        console.error('[Enseignes] Load archived data failed:', error);
      });
    }
  }, [activeTab]);

  // Stats - combiner actives et archivées
  const stats = useMemo(() => {
    const activeCount = enseignes.filter(e => e.is_active).length;
    const archivedCount = archivedEnseignes.length;
    const totalMembers =
      enseignes.reduce((sum, e) => sum + e.member_count, 0) +
      archivedEnseignes.reduce((sum, e) => sum + e.member_count, 0);

    return {
      total: activeCount + archivedCount,
      active: activeCount,
      archived: archivedCount,
      totalMembers,
    };
  }, [enseignes, archivedEnseignes]);

  // Enseignes à afficher selon l'onglet
  const displayedEnseignes = useMemo(() => {
    if (activeTab === 'active') {
      return enseignes.filter(e => e.is_active);
    } else if (activeTab === 'archived') {
      // Filtrer par recherche si nécessaire
      if (searchQuery) {
        return archivedEnseignes.filter(e =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return archivedEnseignes;
    } else {
      // 'all' - combiner actives et archivées
      const all = [...enseignes, ...archivedEnseignes];
      if (searchQuery) {
        return all.filter(e =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return all;
    }
  }, [activeTab, enseignes, archivedEnseignes, searchQuery]);

  // Pagination
  const paginatedEnseignes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return displayedEnseignes.slice(startIndex, startIndex + itemsPerPage);
  }, [displayedEnseignes, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(displayedEnseignes.length / itemsPerPage);

  // Reset page quand recherche ou tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  // Handlers
  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      description: '',
      logo_url: '',
      is_active: true,
      payment_delay_days: 0,
    });
    setEditingEnseigne(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (enseigne: Enseigne) => {
    setFormData({
      name: enseigne.name,
      description: enseigne.description ?? '',
      logo_url: enseigne.logo_url ?? '',
      is_active: enseigne.is_active,
      payment_delay_days:
        ((enseigne as unknown as Record<string, unknown>)
          .payment_delay_days as number) ?? 0,
    });
    setEditingEnseigne(enseigne);
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingEnseigne(null);
    setFormData({
      name: '',
      description: '',
      logo_url: '',
      is_active: true,
      payment_delay_days: 0,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    const supabase = createClient();

    setIsSubmitting(true);
    try {
      if (editingEnseigne) {
        // 1. Upload/suppression logo si en attente
        if (logoUploadRef.current?.hasPendingFile()) {
          const success = await logoUploadRef.current.uploadPendingFile();
          if (!success) return;
        }

        // 2. Sauver les autres champs
        const {
          logo_url: _logo_url,
          payment_delay_days,
          ...updateData
        } = formData;
        await updateEnseigne({
          id: editingEnseigne.id,
          ...updateData,
        });
        // 3. Sauver payment_delay_days (trigger propage aux succursales)
        await supabase
          .from('enseignes')
          .update({ payment_delay_days } as Record<string, unknown>)
          .eq('id', editingEnseigne.id);
      } else {
        // En mode création, pas de logo_url (sera ajouté après)
        const {
          logo_url: _logo_url2,
          payment_delay_days,
          ...createData
        } = formData;
        const newEnseigne = await createEnseigne(createData);
        // Sauver payment_delay_days separement (trigger propage aux succursales)
        if (newEnseigne && payment_delay_days > 0) {
          await supabase
            .from('enseignes')
            .update({ payment_delay_days } as Record<string, unknown>)
            .eq('id', newEnseigne.id);
        }
      }
      handleCloseModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Archiver/Désarchiver une enseigne
  const handleArchive = async (enseigne: Enseigne) => {
    await toggleEnseigneStatus(enseigne.id);
    void refetch().catch(error => {
      console.error('[Enseignes] Refetch after archive failed:', error);
    });
    void loadArchivedEnseignes().catch(error => {
      console.error('[Enseignes] Load archived after archive failed:', error);
    });
  };

  // Supprimer une enseigne (avec dissociation des organisations)
  const handleDelete = async () => {
    if (!deleteConfirmEnseigne) return;

    setIsSubmitting(true);
    try {
      // Les organisations seront automatiquement dissociées par la cascade FK
      await deleteEnseigne(deleteConfirmEnseigne.id);
      setDeleteConfirmEnseigne(null);
      void refetch().catch(error => {
        console.error('[Enseignes] Refetch after delete failed:', error);
      });
      void loadArchivedEnseignes().catch(error => {
        console.error('[Enseignes] Load archived after delete failed:', error);
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = activeTab === 'archived' ? archivedLoading : loading;

  return {
    // State
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    currentPage,
    setCurrentPage,
    viewMode,
    setViewMode,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingEnseigne,
    deleteConfirmEnseigne,
    setDeleteConfirmEnseigne,
    assignOrgsEnseigne,
    setAssignOrgsEnseigne,
    isSubmitting,
    logoUploadRef,
    formData,
    setFormData,
    // Computed
    stats,
    paginatedEnseignes,
    totalPages,
    isLoading,
    error,
    // Hook data
    enseigneWithOrgs,
    refetch,
    linkOrganisationToEnseigne,
    unlinkOrganisationFromEnseigne,
    // Handlers
    handleOpenCreateModal,
    handleOpenEditModal,
    handleCloseModal,
    handleSubmit,
    handleArchive,
    handleDelete,
  };
}
