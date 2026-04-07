'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import type { Collection } from '@verone/collections';
import { useCollections } from '@verone/collections';
import type { CreateCollectionInput } from '@verone/common';
import { useToast } from '@verone/common';
import type { SelectedProduct } from '@verone/products';

import type { LocalCollectionFilters } from './types';

export function useCollectionsPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [filters, setFilters] = useState<LocalCollectionFilters>({
    search: '',
    status: 'all',
    visibility: 'all',
  });
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [managingProductsCollection, setManagingProductsCollection] =
    useState<Collection | null>(null);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [archivedCollections, setArchivedCollections] = useState<Collection[]>(
    []
  );
  const [archivedLoading, setArchivedLoading] = useState(false);

  const {
    collections,
    loading,
    error,
    refetch,
    loadArchivedCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    toggleCollectionStatus,
    archiveCollection,
    unarchiveCollection,
    addProductsToCollection,
  } = useCollections({
    search: filters.search ?? undefined,
    status: filters.status,
    visibility: filters.visibility,
  });

  const loadArchivedCollectionsData = useCallback(async () => {
    setArchivedLoading(true);
    try {
      const result = await loadArchivedCollections();
      setArchivedCollections(result);
    } catch (error) {
      console.error('Erreur chargement collections archivées:', error);
    } finally {
      setArchivedLoading(false);
    }
  }, [loadArchivedCollections]);

  useEffect(() => {
    if (activeTab === 'archived') {
      void loadArchivedCollectionsData().catch(error => {
        console.error(
          '[Collections] loadArchivedCollectionsData failed:',
          error
        );
      });
    }
  }, [activeTab, loadArchivedCollectionsData]);

  const filteredCollections = collections;

  const toggleCollectionSelection = useCallback((collectionId: string) => {
    setSelectedCollections(prev =>
      prev.includes(collectionId)
        ? prev.filter(id => id !== collectionId)
        : [...prev, collectionId]
    );
  }, []);

  const handleBulkStatusToggle = useCallback(async () => {
    let successCount = 0;
    for (const collectionId of selectedCollections) {
      const success = await toggleCollectionStatus(collectionId);
      if (success) successCount++;
    }
    setSelectedCollections([]);
    toast({
      title: 'Statut mis à jour',
      description: `${successCount} collection(s) modifiée(s) avec succès`,
    });
  }, [selectedCollections, toggleCollectionStatus, toast]);

  const handleEditCollection = useCallback((collection: Collection) => {
    setEditingCollection(collection);
    setShowEditModal(true);
  }, []);

  const handleManageProducts = useCallback((collection: Collection) => {
    setManagingProductsCollection(collection);
    setShowProductsModal(true);
  }, []);

  const handleCreateCollection = useCallback(() => {
    setEditingCollection(null);
    setShowEditModal(true);
  }, []);

  const handleDeleteCollection = useCallback(
    async (collectionId: string) => {
      if (
        !confirm(
          'Êtes-vous sûr de vouloir supprimer définitivement cette collection ?'
        )
      )
        return;

      const result = await deleteCollection(collectionId);
      if (result) {
        toast({
          title: 'Collection supprimée',
          description: 'La collection a été supprimée définitivement',
        });
        if (activeTab === 'archived') {
          await loadArchivedCollectionsData();
        }
      }
    },
    [deleteCollection, toast, activeTab, loadArchivedCollectionsData]
  );

  const handleSaveCollection = useCallback(
    async (data: CreateCollectionInput) => {
      if (editingCollection) {
        const result = await updateCollection({
          id: editingCollection.id,
          ...data,
        });
        if (result) {
          toast({
            title: 'Collection modifiée',
            description: 'La collection a été modifiée avec succès',
          });
          setShowEditModal(false);
          setEditingCollection(null);
          return true;
        }
      } else {
        const result = await createCollection(data);
        if (result) {
          toast({
            title: 'Collection créée',
            description: 'La nouvelle collection a été créée avec succès',
          });
          setShowEditModal(false);
          return true;
        }
      }
      return false;
    },
    [editingCollection, createCollection, updateCollection, toast]
  );

  const handleArchiveCollection = useCallback(
    async (collection: Collection) => {
      try {
        if (collection.archived_at) {
          await unarchiveCollection(collection.id);
          toast({
            title: 'Collection restaurée',
            description: 'La collection a été restaurée avec succès',
          });
          await loadArchivedCollectionsData();
        } else {
          await archiveCollection(collection.id);
          toast({
            title: 'Collection archivée',
            description: 'La collection a été archivée avec succès',
          });
          await loadArchivedCollectionsData();
        }
      } catch (error) {
        console.error('Erreur archivage collection:', error);
        toast({
          title: 'Erreur',
          description: "Une erreur est survenue lors de l'archivage",
          variant: 'destructive',
        });
      }
    },
    [archiveCollection, unarchiveCollection, toast, loadArchivedCollectionsData]
  );

  const handleAddProductsToCollection = useCallback(
    async (products: SelectedProduct[]) => {
      if (!managingProductsCollection) {
        toast({
          title: 'Erreur',
          description: 'Aucune collection sélectionnée',
          variant: 'destructive',
        });
        return;
      }

      try {
        const productIds = products.map(p => p.id);

        const success = await addProductsToCollection(
          managingProductsCollection.id,
          productIds
        );

        if (success) {
          toast({
            title: 'Produits ajoutés',
            description: `${products.length} produit(s) ajouté(s) à "${managingProductsCollection.name}"`,
          });
          await refetch();
        } else {
          toast({
            title: 'Erreur',
            description: "Erreur lors de l'ajout des produits",
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('[VÉRONE:ERROR]', {
          component: 'CollectionsListPage',
          action: 'addProductsToCollection',
          error: error instanceof Error ? error.message : 'Unknown error',
          context: {
            collectionId: managingProductsCollection.id,
            productCount: products.length,
          },
          timestamp: new Date().toISOString(),
        });
        toast({
          title: 'Erreur',
          description: "Erreur lors de l'ajout des produits",
          variant: 'destructive',
        });
      } finally {
        setShowProductsModal(false);
      }
    },
    [managingProductsCollection, addProductsToCollection, refetch, toast]
  );

  const navigateToCollection = useCallback(
    (collectionId: string) => {
      router.push(`/produits/catalogue/collections/${collectionId}`);
    },
    [router]
  );

  const stats = useMemo(
    () => ({
      total: collections.length,
      active: collections.filter(c => c.is_active).length,
      archived: archivedCollections.length,
    }),
    [collections, archivedCollections]
  );

  return {
    filters,
    setFilters,
    selectedCollections,
    editingCollection,
    showEditModal,
    setShowEditModal,
    managingProductsCollection,
    showProductsModal,
    setShowProductsModal,
    activeTab,
    setActiveTab,
    archivedCollections,
    archivedLoading,
    collections,
    filteredCollections,
    loading,
    error,
    stats,
    toggleCollectionSelection,
    handleBulkStatusToggle,
    handleEditCollection,
    handleManageProducts,
    handleCreateCollection,
    handleDeleteCollection,
    handleSaveCollection,
    handleArchiveCollection,
    handleAddProductsToCollection,
    navigateToCollection,
  };
}
