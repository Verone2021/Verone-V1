'use client';

import { useState, useCallback, useRef } from 'react';

import { useRouter } from 'next/navigation';

import {
  useEnseigne,
  useEnseignes,
  useEnseigneStats,
  useEnseigneMapData,
  type EnseigneLogoUploadRef,
} from '@verone/organisations';
import { createClient } from '@verone/utils/supabase/client';

import {
  useEnseigneContactsBO,
  useCreateContactBO,
} from '../../../../canaux-vente/linkme/hooks/use-organisation-contacts-bo';

import { useEnseigneProductsChannels } from './use-enseigne-products-channels';

export function useEnseigneDetail(enseigneId: string) {
  const router = useRouter();
  const supabase = createClient();

  // Filtre annee pour KPIs
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Hooks donnees
  const {
    enseigne,
    loading,
    error,
    refetch: refetchEnseigne,
  } = useEnseigne(enseigneId);
  const {
    updateEnseigne,
    deleteEnseigne,
    linkOrganisationToEnseigne,
    unlinkOrganisationFromEnseigne,
  } = useEnseignes();
  const {
    stats,
    loading: statsLoading,
    refetch: refetchStats,
  } = useEnseigneStats(enseigneId, selectedYear);
  const { data: mapData, loading: mapLoading } = useEnseigneMapData(enseigneId);

  // Produits + canaux de vente (extraits dans hook dédié)
  const { enseigneProducts, productsLoading, enseigneChannels } =
    useEnseigneProductsChannels(enseigneId);

  // Tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Contacts enseigne
  const { data: contactsData, isLoading: contactsLoading } =
    useEnseigneContactsBO(enseigneId);
  const createContactMutation = useCreateContactBO();
  const [showCreateContact, setShowCreateContact] = useState(false);
  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    isBillingContact: false,
    isPrimaryContact: false,
    isTechnicalContact: false,
  });

  const handleCreateEnseigneContact = () => {
    if (!newContact.firstName || !newContact.lastName || !newContact.email)
      return;
    void createContactMutation
      .mutateAsync({
        enseigneId,
        firstName: newContact.firstName,
        lastName: newContact.lastName,
        email: newContact.email,
        phone: newContact.phone || undefined,
        title: newContact.title || undefined,
        isBillingContact: newContact.isBillingContact,
        isPrimaryContact: newContact.isPrimaryContact,
        isTechnicalContact: newContact.isTechnicalContact,
      })
      .then(() => {
        setShowCreateContact(false);
        setNewContact({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          title: '',
          isBillingContact: false,
          isPrimaryContact: false,
          isTechnicalContact: false,
        });
      })
      .catch((err: unknown) => {
        console.error('[EnseigneDetail] Create contact failed:', err);
      });
  };

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isOrganisationModalOpen, setIsOrganisationModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const logoUploadRef = useRef<EnseigneLogoUploadRef>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo_url: '',
    is_active: true,
    payment_delay_days: 0,
  });

  // Refresh tout
  const handleRefresh = useCallback(() => {
    void refetchEnseigne().catch(error => {
      console.error('[EnseigneDetail] Refetch enseigne failed:', error);
    });
    void refetchStats().catch(error => {
      console.error('[EnseigneDetail] Refetch stats failed:', error);
    });
  }, [refetchEnseigne, refetchStats]);

  // Ouvrir modal édition
  const handleOpenEditModal = () => {
    if (enseigne) {
      setFormData({
        name: enseigne.name,
        description: enseigne.description ?? '',
        logo_url: enseigne.logo_url ?? '',
        is_active: enseigne.is_active,
        payment_delay_days:
          ((enseigne as unknown as Record<string, unknown>)
            .payment_delay_days as number) ?? 0,
      });
      setIsEditModalOpen(true);
    }
  };

  // Soumettre édition
  const handleSubmitEdit = async () => {
    if (!enseigne || !formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      // 1. Upload/suppression logo si en attente
      if (logoUploadRef.current?.hasPendingFile()) {
        const success = await logoUploadRef.current.uploadPendingFile();
        if (!success) return;
      }

      // 2. Sauver les autres champs du formulaire
      const {
        logo_url: _logo_url,
        payment_delay_days,
        ...updateData
      } = formData;
      await updateEnseigne({
        id: enseigne.id,
        ...updateData,
      });

      // 3. Sauver payment_delay_days separement (trigger propage aux succursales)
      await supabase
        .from('enseignes')
        .update({ payment_delay_days } as Record<string, unknown>)
        .eq('id', enseigne.id);

      setIsEditModalOpen(false);
      handleRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Supprimer enseigne
  const handleDelete = async () => {
    if (!enseigne) return;

    setIsSubmitting(true);
    try {
      const success = await deleteEnseigne(enseigne.id);
      if (success) {
        router.push('/contacts-organisations/enseignes');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sauvegarder organisations depuis le modal deux colonnes
  const handleSaveOrganisations = async (
    organisationIds: string[],
    parentId: string | null
  ): Promise<boolean> => {
    if (!enseigne) return false;

    try {
      const currentIds = new Set(enseigne.organisations?.map(o => o.id) ?? []);
      const newIds = new Set(organisationIds);
      const toAdd = organisationIds.filter(id => !currentIds.has(id));
      const toRemove = [...currentIds].filter(id => !newIds.has(id));

      for (const orgId of toAdd) {
        const isParent = orgId === parentId;
        await linkOrganisationToEnseigne(orgId, enseigne.id, isParent);
      }

      for (const orgId of toRemove) {
        await unlinkOrganisationFromEnseigne(orgId);
      }

      const currentParent = enseigne.organisations?.find(
        o => o.is_enseigne_parent
      );
      if (currentParent?.id !== parentId) {
        if (currentParent && newIds.has(currentParent.id)) {
          await supabase
            .from('organisations')
            .update({ is_enseigne_parent: false })
            .eq('id', currentParent.id);
        }
        if (parentId && newIds.has(parentId)) {
          await supabase
            .from('organisations')
            .update({ is_enseigne_parent: true })
            .eq('id', parentId);
        }
      }

      handleRefresh();
      return true;
    } catch (err) {
      console.error('Erreur sauvegarde organisations:', err);
      return false;
    }
  };

  // Retirer une organisation depuis le tableau
  const handleRemoveOrganisation = async (organisationId: string) => {
    await unlinkOrganisationFromEnseigne(organisationId);
    handleRefresh();
  };

  return {
    // Data
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
    // Year filter
    selectedYear,
    setSelectedYear,
    // Tab
    activeTab,
    setActiveTab,
    // Contact creation
    showCreateContact,
    setShowCreateContact,
    newContact,
    setNewContact,
    createContactMutation,
    handleCreateEnseigneContact,
    // Modal states
    isEditModalOpen,
    setIsEditModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isOrganisationModalOpen,
    setIsOrganisationModalOpen,
    isSubmitting,
    // Logo ref
    logoUploadRef,
    // Form
    formData,
    setFormData,
    // Handlers
    handleRefresh,
    handleOpenEditModal,
    handleSubmitEdit,
    handleDelete,
    handleSaveOrganisations,
    handleRemoveOrganisation,
  };
}
