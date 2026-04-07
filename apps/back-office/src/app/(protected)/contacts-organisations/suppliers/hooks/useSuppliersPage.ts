'use client';

import { useState, useMemo, useEffect } from 'react';

import { useLocalStorage } from '@verone/hooks';
import { useSuppliers, type Organisation } from '@verone/organisations';
import { createClient } from '@verone/utils/supabase/client';

export interface SuppliersPageState {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  activeTab: 'active' | 'archived' | 'preferred';
  setActiveTab: (v: 'active' | 'archived' | 'preferred') => void;
  archivedSuppliers: Organisation[];
  archivedLoading: boolean;
  isModalOpen: boolean;
  setIsModalOpen: (v: boolean) => void;
  selectedSupplier: Organisation | null;
  setSelectedSupplier: (v: Organisation | null) => void;
  deleteModalSupplier: Organisation | null;
  setDeleteModalSupplier: (v: Organisation | null) => void;
  isDeleting: boolean;
  currentPage: number;
  setCurrentPage: (v: number | ((prev: number) => number)) => void;
  viewMode: 'grid' | 'list';
  handleViewModeChange: (mode: 'grid' | 'list') => void;
  suppliers: Organisation[];
  loading: boolean;
  isLoading: boolean;
  displayedSuppliers: Organisation[];
  paginatedSuppliers: Organisation[];
  totalPages: number;
  stats: { total: number; active: number; archived: number; favorites: number };
  handleCreateSupplier: () => void;
  handleCloseModal: () => void;
  handleSupplierSuccess: () => void;
  handleArchive: (supplier: Organisation) => Promise<void>;
  handleDelete: (supplier: Organisation) => void;
  handleConfirmDelete: () => Promise<void>;
  loadArchivedSuppliersData: () => Promise<void>;
  refetch: () => Promise<void>;
}

const ITEMS_PER_PAGE = 12;

export function useSuppliersPage(): SuppliersPageState {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<
    'active' | 'archived' | 'preferred'
  >('active');
  const [archivedSuppliers, setArchivedSuppliers] = useState<Organisation[]>(
    []
  );
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Organisation | null>(
    null
  );
  const [deleteModalSupplier, setDeleteModalSupplier] =
    useState<Organisation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list'>(
    'suppliers-view-mode',
    'grid'
  );

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };

  const filters = useMemo(
    () => ({
      is_active: true,
      is_service_provider: false,
      search: searchQuery ?? undefined,
    }),
    [searchQuery]
  );

  const {
    organisations: suppliers,
    loading,
    archiveOrganisation,
    unarchiveOrganisation,
    hardDeleteOrganisation,
    refetch,
  } = useSuppliers(filters);

  const handleCreateSupplier = () => {
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSupplier(null);
  };

  const handleSupplierSuccess = () => {
    void refetch().catch(error => {
      console.error('[Suppliers] Refetch failed:', error);
    });
    handleCloseModal();
  };

  const loadArchivedSuppliersData = async () => {
    setArchivedLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('organisations')
        .select('*') // TODO: specify columns
        .eq('type', 'supplier')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false })
        .returns<Organisation[]>();

      if (error) throw error;

      let organisationsWithCounts = data ?? [];

      if ((data ?? []).length > 0) {
        const supplierIds = data.map(s => s.id);

        const { data: productCounts } = await supabase
          .from('products')
          .select('supplier_id')
          .in('supplier_id', supplierIds)
          .returns<{ supplier_id: string | null }[]>();

        const countsMap = new Map<string, number>();
        productCounts?.forEach(p => {
          if (!p.supplier_id) return;
          const count = countsMap.get(p.supplier_id) ?? 0;
          countsMap.set(p.supplier_id, count + 1);
        });

        organisationsWithCounts = (data ?? []).map(org => ({
          ...org,
          name: org.trade_name ?? org.legal_name,
          _count: {
            products: countsMap.get(org.id) ?? 0,
          },
        })) as Organisation[];
      } else {
        organisationsWithCounts = (data ?? []).map(org => ({
          ...org,
          name: org.trade_name ?? org.legal_name,
        })) as Organisation[];
      }

      setArchivedSuppliers(organisationsWithCounts);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(
        '[Suppliers] Erreur chargement fournisseurs archivés:',
        message
      );
    } finally {
      setArchivedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'archived') {
      void loadArchivedSuppliersData().catch(error => {
        console.error('[Suppliers] Load archived data failed:', error);
      });
    }
  }, [activeTab]);

  const handleArchive = async (supplier: Organisation) => {
    if (!supplier.archived_at) {
      const success = await archiveOrganisation(supplier.id);
      if (success) {
        void refetch().catch(error => {
          console.error('[Suppliers] Refetch after archive failed:', error);
        });
        if (activeTab === 'archived') {
          await loadArchivedSuppliersData();
        }
      }
    } else {
      const success = await unarchiveOrganisation(supplier.id);
      if (success) {
        void refetch().catch(error => {
          console.error('[Suppliers] Refetch after unarchive failed:', error);
        });
        await loadArchivedSuppliersData();
      }
    }
  };

  const handleDelete = (supplier: Organisation) => {
    setDeleteModalSupplier(supplier);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalSupplier) return;

    setIsDeleting(true);
    try {
      const success = await hardDeleteOrganisation(deleteModalSupplier.id);
      if (success) {
        await loadArchivedSuppliersData();
        setDeleteModalSupplier(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const displayedSuppliers = useMemo(() => {
    if (activeTab === 'active') {
      return suppliers;
    } else if (activeTab === 'archived') {
      return archivedSuppliers;
    } else if (activeTab === 'preferred') {
      return suppliers.filter(s => s.preferred_supplier === true);
    }
    return suppliers;
  }, [activeTab, suppliers, archivedSuppliers]);

  const paginatedSuppliers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return displayedSuppliers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [displayedSuppliers, currentPage]);

  const totalPages = Math.ceil(displayedSuppliers.length / ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter(s => s.is_active).length;
    const archived = archivedSuppliers.length;
    const favorites = suppliers.filter(
      s => s.preferred_supplier === true
    ).length;
    return { total, active, archived, favorites };
  }, [suppliers, archivedSuppliers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  const isLoading =
    activeTab === 'active' || activeTab === 'preferred'
      ? loading
      : archivedLoading;

  return {
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    archivedSuppliers,
    archivedLoading,
    isModalOpen,
    setIsModalOpen,
    selectedSupplier,
    setSelectedSupplier,
    deleteModalSupplier,
    setDeleteModalSupplier,
    isDeleting,
    currentPage,
    setCurrentPage,
    viewMode,
    handleViewModeChange,
    suppliers,
    loading,
    isLoading,
    displayedSuppliers,
    paginatedSuppliers,
    totalPages,
    stats,
    handleCreateSupplier,
    handleCloseModal,
    handleSupplierSuccess,
    handleArchive,
    handleDelete,
    handleConfirmDelete,
    loadArchivedSuppliersData,
    refetch,
  };
}
