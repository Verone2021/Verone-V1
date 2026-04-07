'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import {
  useConsultations,
  type ClientConsultation,
} from '@verone/consultations';

// Helper exporté car utilisé aussi dans ConsultationRow (fichier parent)
export function getClientName(consultation: ClientConsultation): string {
  if (consultation.enseigne?.name) {
    return consultation.enseigne.name;
  }
  if (consultation.organisation?.trade_name) {
    return consultation.organisation.trade_name;
  }
  if (consultation.organisation?.legal_name) {
    return consultation.organisation.legal_name;
  }
  return 'Client inconnu';
}

export function useConsultationsPage() {
  const router = useRouter();
  const {
    consultations,
    loading,
    fetchConsultations,
    archiveConsultation,
    unarchiveConsultation,
    deleteConsultation,
  } = useConsultations();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedConsultationId, setSelectedConsultationId] = useState<
    string | null
  >(null);
  const [selectedConsultationTitle, setSelectedConsultationTitle] =
    useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [consultationToDelete, setConsultationToDelete] = useState<
    string | null
  >(null);

  useEffect(() => {
    void fetchConsultations().catch(error => {
      console.error(
        '[ConsultationsPage] useEffect fetchConsultations failed:',
        error
      );
    });
  }, [fetchConsultations]);

  const handleArchive = async (id: string) => {
    const success = await archiveConsultation(id);
    if (success) {
      await fetchConsultations();
    }
  };

  const handleUnarchive = async (id: string) => {
    const success = await unarchiveConsultation(id);
    if (success) {
      await fetchConsultations();
    }
  };

  const handleConfirmDelete = async () => {
    if (!consultationToDelete) return;
    const success = await deleteConsultation(consultationToDelete);
    if (success) {
      await fetchConsultations();
    }
    setDeleteDialogOpen(false);
    setConsultationToDelete(null);
  };

  const handleRequestDelete = (id: string) => {
    setConsultationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleOpenPhotoModal = (
    consultationId: string,
    consultationTitle: string
  ) => {
    setSelectedConsultationId(consultationId);
    setSelectedConsultationTitle(consultationTitle);
    setPhotoModalOpen(true);
  };

  const handleClosePhotoModal = () => {
    setPhotoModalOpen(false);
    setSelectedConsultationId(null);
    setSelectedConsultationTitle('');
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setShowArchived(false);
  };

  const handleNavigateToCreate = () => {
    router.push('/consultations/create');
  };

  const handleNavigateBack = () => {
    router.back();
  };

  const handleNavigateToDetail = (id: string) => {
    router.push(`/consultations/${id}`);
  };

  // Filtrer les consultations
  const filteredConsultations = consultations.filter(consultation => {
    if (!showArchived && consultation.archived_at) {
      return false;
    }

    const matchesSearch =
      getClientName(consultation)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      consultation.descriptif
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      consultation.client_email
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || consultation.status === statusFilter;
    const matchesPriority =
      priorityFilter === 'all' ||
      consultation.priority_level.toString() === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Grouper par statut
  const consultationsByStatus = {
    en_attente: filteredConsultations.filter(c => c.status === 'en_attente'),
    en_cours: filteredConsultations.filter(c => c.status === 'en_cours'),
    terminee: filteredConsultations.filter(c => c.status === 'terminee'),
    annulee: filteredConsultations.filter(c => c.status === 'annulee'),
  };

  return {
    // Data
    consultations,
    filteredConsultations,
    consultationsByStatus,
    loading,
    // Filter state
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    showArchived,
    setShowArchived,
    // Photo modal state
    photoModalOpen,
    selectedConsultationId,
    selectedConsultationTitle,
    // Delete dialog state
    deleteDialogOpen,
    setDeleteDialogOpen,
    // Handlers
    handleArchive,
    handleUnarchive,
    handleConfirmDelete,
    handleRequestDelete,
    handleOpenPhotoModal,
    handleClosePhotoModal,
    handleResetFilters,
    handleNavigateToCreate,
    handleNavigateBack,
    handleNavigateToDetail,
  };
}
