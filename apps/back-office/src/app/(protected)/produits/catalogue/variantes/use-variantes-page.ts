'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';

import type { VariantGroup } from '@verone/types';

import { useToast } from '@verone/common';
import { useVariantGroups } from '@verone/products';

import type { LocalVariantFilters } from './variantes.types';

export function useVariantesPage() {
  const { toast } = useToast();

  const [filters, setFilters] = useState<LocalVariantFilters>({
    search: '',
    status: 'all',
    type: 'all',
    subcategoryId: undefined,
  });
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [editingGroup, setEditingGroup] = useState<VariantGroup | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddProductsModal, setShowAddProductsModal] = useState(false);
  const [selectedGroupForProducts, setSelectedGroupForProducts] =
    useState<VariantGroup | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [archivedVariantGroups, setArchivedVariantGroups] = useState<
    VariantGroup[]
  >([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  // Flag boolean au lieu d'utiliser archivedVariantGroups.length === 0
  // qui rebouclait quand la DB renvoie 0 résultats.
  // Cf. .claude/rules/data-fetching.md — incident 2026-04-27 (244 req/5s).
  const [archivedLoaded, setArchivedLoaded] = useState(false);

  const stableFilters = useMemo(
    () => ({
      search: filters.search ?? undefined,
      variant_type: filters.type === 'all' ? undefined : filters.type,
      is_active:
        filters.status === 'all' ? undefined : filters.status === 'active',
    }),
    [filters.search, filters.type, filters.status]
  );

  const {
    variantGroups,
    loading,
    error,
    refetch,
    createVariantGroup: _createVariantGroup,
    updateVariantGroup,
    deleteVariantGroup,
    removeProductFromGroup,
    archiveVariantGroup,
    unarchiveVariantGroup,
    loadArchivedVariantGroups,
  } = useVariantGroups(stableFilters);

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleEditGroup = useCallback((group: VariantGroup) => {
    setEditingGroup(group);
    setShowEditModal(true);
  }, []);

  const handleCreateGroup = useCallback(() => {
    setEditingGroup(null);
    setShowEditModal(true);
  }, []);

  const handleDeleteGroup = useCallback(
    async (groupId: string) => {
      if (
        !confirm('Êtes-vous sûr de vouloir supprimer ce groupe de variantes ?')
      )
        return;

      const result = await deleteVariantGroup(groupId);
      if (result) {
        toast({
          title: 'Groupe supprimé',
          description: 'Le groupe de variantes a été supprimé avec succès',
        });
      }
    },
    [deleteVariantGroup, toast]
  );

  const handleLoadArchivedGroups = useCallback(async () => {
    setArchivedLoading(true);
    try {
      const archivedGroups = await loadArchivedVariantGroups();
      setArchivedVariantGroups(archivedGroups);
    } finally {
      setArchivedLoaded(true);
      setArchivedLoading(false);
    }
  }, [loadArchivedVariantGroups]);

  const handleArchiveGroup = useCallback(
    async (groupId: string, isArchived: boolean) => {
      const result = isArchived
        ? await unarchiveVariantGroup(groupId)
        : await archiveVariantGroup(groupId);

      if (result) {
        void refetch().catch(error => {
          console.error('[Variants] Refetch after archive failed:', error);
        });
        if (activeTab === 'archived') {
          await handleLoadArchivedGroups();
        }
      }
    },
    [
      archiveVariantGroup,
      unarchiveVariantGroup,
      refetch,
      activeTab,
      handleLoadArchivedGroups,
    ]
  );

  const handleAddProducts = useCallback((group: VariantGroup) => {
    setSelectedGroupForProducts(group);
    setShowAddProductsModal(true);
  }, []);

  const handleRemoveProduct = useCallback(
    async (productId: string, productName: string) => {
      if (
        !confirm(
          `Êtes-vous sûr de vouloir retirer "${productName}" de ce groupe ?`
        )
      )
        return;

      const result = await removeProductFromGroup(productId);
      if (result) {
        toast({
          title: 'Produit retiré',
          description: `"${productName}" a été retiré du groupe`,
        });
        void refetch().catch(error => {
          console.error('[Variants] Refetch after remove failed:', error);
        });
      }
    },
    [removeProductFromGroup, toast, refetch]
  );

  useEffect(() => {
    if (activeTab === 'archived' && !archivedLoaded) {
      void handleLoadArchivedGroups().catch(error => {
        console.error('[Variants] Load archived groups failed:', error);
      });
    }
  }, [activeTab, archivedLoaded, handleLoadArchivedGroups]);

  const filteredVariantGroups = useMemo(() => {
    if (!filters.subcategoryId) return variantGroups;
    return variantGroups.filter(
      group => group.subcategory_id === filters.subcategoryId
    );
  }, [variantGroups, filters.subcategoryId]);

  const stats = useMemo(
    () => ({
      total: filteredVariantGroups.length,
      totalProducts: filteredVariantGroups.reduce(
        (sum, g) => sum + (g.product_count ?? 0),
        0
      ),
      types: new Set(filteredVariantGroups.map(g => g.variant_type)).size,
    }),
    [filteredVariantGroups]
  );

  return {
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
  };
}
