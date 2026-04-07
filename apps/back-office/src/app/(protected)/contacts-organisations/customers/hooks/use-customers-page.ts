'use client';

import { useState, useMemo, useEffect } from 'react';

import { useSearchParams } from 'next/navigation';

import { useLocalStorage } from '@verone/hooks';
import {
  useOrganisations,
  useActiveEnseignes,
  type Organisation,
} from '@verone/organisations';
import { createClient } from '@verone/utils/supabase/client';

export function useCustomersPage() {
  const searchParams = useSearchParams();
  const urlType = searchParams.get('type') as
    | 'professional'
    | 'individual'
    | null;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<
    'active' | 'archived' | 'preferred' | 'incomplete'
  >('active');
  const [archivedCustomers, setArchivedCustomers] = useState<Organisation[]>(
    []
  );
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Organisation | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list'>(
    'customers-view-mode',
    'grid'
  );
  const [deleteModalCustomer, setDeleteModalCustomer] =
    useState<Organisation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [enseigneFilter, setEnseigneFilter] = useState<string | null>(null);
  const { enseignes } = useActiveEnseignes();
  const itemsPerPage = 12; // 3 lignes × 4 colonnes

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };

  const typeInfo = useMemo(() => {
    if (urlType === 'professional') {
      return {
        title: 'Clients Professionnels',
        description: 'Gestion des clients professionnels B2B',
        badgeText: 'Professionnels uniquement',
      };
    } else if (urlType === 'individual') {
      return {
        title: 'Clients Particuliers',
        description: 'Gestion des clients particuliers B2C',
        badgeText: 'Particuliers uniquement',
      };
    } else {
      return {
        title: 'Clients',
        description: 'Gestion de tous les clients',
        badgeText: null,
      };
    }
  }, [urlType]);

  const filters = useMemo(
    () => ({
      is_active: true,
      search: searchQuery ?? undefined,
      customer_type: urlType ?? undefined,
    }),
    [searchQuery, urlType]
  );

  const {
    organisations: customers,
    loading,
    archiveOrganisation,
    unarchiveOrganisation,
    hardDeleteOrganisation,
    refetch,
  } = useOrganisations(filters);

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    let result = customers.filter(customer => customer.type === 'customer');

    // Filtrer par enseigne si un filtre est actif
    if (enseigneFilter) {
      result = result.filter(
        customer => customer.enseigne_id === enseigneFilter
      );
    }

    return result;
  }, [customers, enseigneFilter]);

  // Calcul des organisations incomplètes (critères: adresse, ownership_type, SIREN franchise)
  const incompleteCustomers = useMemo(() => {
    return filteredCustomers.filter(c => {
      const missingAddress =
        !c.billing_address_line1 || !c.billing_postal_code || !c.billing_city;
      const missingOwnershipType = !c.ownership_type;
      const franchiseMissingSiren =
        c.ownership_type === 'franchise' && !c.siren;

      return missingAddress || missingOwnershipType || franchiseMissingSiren;
    });
  }, [filteredCustomers]);

  const stats = useMemo(() => {
    const total = filteredCustomers.length;
    const active = filteredCustomers.filter(c => c.is_active).length;
    const favorites = filteredCustomers.filter(
      c => c.preferred_supplier === true
    ).length;
    const incomplete = incompleteCustomers.length;

    return { total, active, favorites, incomplete };
  }, [filteredCustomers, incompleteCustomers]);

  const handleCreateCustomer = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleCustomerSuccess = () => {
    void refetch().catch(error => {
      console.error('[Customers] Refetch failed:', error);
    });
    handleCloseModal();
  };

  const loadArchivedCustomersData = async () => {
    setArchivedLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('organisations')
        .select('*') // TODO: specify columns
        .eq('type', 'customer')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false })
        .returns<Organisation[]>();

      if (error) throw error;
      setArchivedCustomers(data ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Customers] Erreur chargement clients archivés:', message);
    } finally {
      setArchivedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'archived') {
      void loadArchivedCustomersData().catch(error => {
        console.error('[Customers] Load archived data failed:', error);
      });
    }
  }, [activeTab]);

  const handleArchive = async (customer: Organisation) => {
    if (!customer.archived_at) {
      const success = await archiveOrganisation(customer.id);
      if (success) {
        void refetch().catch(error => {
          console.error('[Customers] Refetch after archive failed:', error);
        });
        if (activeTab === 'archived') {
          await loadArchivedCustomersData();
        }
      }
    } else {
      const success = await unarchiveOrganisation(customer.id);
      if (success) {
        void refetch().catch(error => {
          console.error('[Customers] Refetch after unarchive failed:', error);
        });
        await loadArchivedCustomersData();
      }
    }
  };

  const handleDelete = (customer: Organisation) => {
    setDeleteModalCustomer(customer);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalCustomer) return;

    setIsDeleting(true);
    try {
      const success = await hardDeleteOrganisation(deleteModalCustomer.id);
      if (success) {
        await loadArchivedCustomersData();
        setDeleteModalCustomer(null); // Fermer le modal
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrage selon l'onglet actif
  const displayedCustomers = useMemo(() => {
    if (activeTab === 'active') {
      return filteredCustomers;
    } else if (activeTab === 'archived') {
      return archivedCustomers;
    } else if (activeTab === 'preferred') {
      return filteredCustomers.filter(c => c.preferred_supplier === true);
    } else if (activeTab === 'incomplete') {
      return incompleteCustomers;
    }
    return filteredCustomers;
  }, [activeTab, filteredCustomers, archivedCustomers, incompleteCustomers]);

  // Pagination
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return displayedCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [displayedCustomers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(displayedCustomers.length / itemsPerPage);

  // Reset page quand recherche, tab ou filtre enseigne change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, enseigneFilter]);

  const isLoading =
    activeTab === 'active' ||
    activeTab === 'preferred' ||
    activeTab === 'incomplete'
      ? loading
      : archivedLoading;

  return {
    // State
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    archivedCustomers,
    isModalOpen,
    selectedCustomer,
    currentPage,
    setCurrentPage,
    viewMode,
    deleteModalCustomer,
    setDeleteModalCustomer,
    isDeleting,
    enseigneFilter,
    setEnseigneFilter,
    enseignes,
    itemsPerPage,
    // Derived
    typeInfo,
    urlType,
    filteredCustomers,
    incompleteCustomers,
    stats,
    displayedCustomers,
    paginatedCustomers,
    totalPages,
    isLoading,
    // Handlers
    handleViewModeChange,
    handleCreateCustomer,
    handleCloseModal,
    handleCustomerSuccess,
    loadArchivedCustomersData,
    handleArchive,
    handleDelete,
    handleConfirmDelete,
    refetch,
  };
}
