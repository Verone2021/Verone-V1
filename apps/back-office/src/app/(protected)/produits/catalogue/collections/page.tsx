'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { getRoomLabel, type RoomType } from '@verone/types';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { KPICardUnified } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Package,
  Archive,
  ArchiveRestore,
  Layers,
  Eye,
} from 'lucide-react';

import type { Collection } from '@verone/collections';
import {
  useCollections,
} from '@verone/collections';
import type { CreateCollectionInput } from '@verone/common';
import { CollectionCreationWizard } from '@verone/common';
import { useToast } from '@verone/common';
import type { SelectedProduct } from '@verone/products';
import { UniversalProductSelectorV2 } from '@verone/products';

// Interface filtres collections
interface LocalCollectionFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
  visibility: 'all' | 'public' | 'private';
}

// Helper pour formater le style de collection
const formatCollectionStyle = (style?: string): string => {
  if (!style) return '';
  const styleMap: Record<string, string> = {
    minimaliste: 'Minimaliste',
    contemporain: 'Contemporain',
    moderne: 'Moderne',
    scandinave: 'Scandinave',
    industriel: 'Industriel',
    classique: 'Classique',
    boheme: 'Bohème',
    art_deco: 'Art Déco',
  };
  return styleMap[style] || style;
};

// Helper pour formater la catégorie de pièce
const _formatRoomCategory = (roomCategory?: string): string => {
  if (!roomCategory) return '';
  const roomMap: Record<string, string> = {
    chambre: 'Chambre',
    wc_salle_bain: 'Salle de bain',
    salon: 'Salon',
    cuisine: 'Cuisine',
    bureau: 'Bureau',
    salle_a_manger: 'Salle à manger',
    entree: 'Entrée',
    plusieurs_pieces: 'Plusieurs pièces',
    exterieur_balcon: 'Balcon',
    exterieur_jardin: 'Jardin',
  };
  return roomMap[roomCategory] || roomCategory;
};

export default function CollectionsPage() {
  const { toast } = useToast();
  const router = useRouter();

  // États pour la gestion des filtres et de l'interface
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

  // Hook pour récupérer les collections réelles depuis Supabase
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
    search: filters.search || undefined,
    status: filters.status,
    visibility: filters.visibility,
  });

  // Fonction pour charger les collections archivées
  const loadArchivedCollectionsData = async () => {
    setArchivedLoading(true);
    try {
      const result = await loadArchivedCollections();
      setArchivedCollections(result);
    } catch (error) {
      console.error('Erreur chargement collections archivées:', error);
    } finally {
      setArchivedLoading(false);
    }
  };

  // Charger les collections archivées quand on change d'onglet
  useEffect(() => {
    if (activeTab === 'archived') {
      loadArchivedCollectionsData();
    }
  }, [activeTab]);

  // Pas besoin de filtrage manuel, le hook s'en charge
  const filteredCollections = collections;

  // Fonctions utilitaires
  const toggleCollectionSelection = (collectionId: string) => {
    setSelectedCollections(prev =>
      prev.includes(collectionId)
        ? prev.filter(id => id !== collectionId)
        : [...prev, collectionId]
    );
  };

  const handleBulkStatusToggle = async () => {
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
  };

  const _formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(priceInCents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

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
        // Recharger les collections archivées
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
        // Mode édition
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
        // Mode création
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
          console.log('✅ Collection restaurée:', collection.name);
          toast({
            title: 'Collection restaurée',
            description: 'La collection a été restaurée avec succès',
          });
          // Rafraîchir la liste des archivées après restauration
          await loadArchivedCollectionsData();
        } else {
          await archiveCollection(collection.id);
          console.log('✅ Collection archivée:', collection.name);
          toast({
            title: 'Collection archivée',
            description: 'La collection a été archivée avec succès',
          });
          // Rafraîchir la liste des archivées après archivage
          await loadArchivedCollectionsData();
        }
      } catch (error) {
        console.error('❌ Erreur archivage collection:', error);
        toast({
          title: 'Erreur',
          description: "Une erreur est survenue lors de l'archivage",
          variant: 'destructive',
        });
      }
    },
    [archiveCollection, unarchiveCollection, toast, loadArchivedCollectionsData]
  );

  // Composant Collection Card - Aligné sur le design Variantes
  const renderCollectionCard = (
    collection: Collection,
    isArchived: boolean = false
  ) => {
    const isSelected = selectedCollections.includes(collection.id);

    return (
      <div
        className={cn(
          'bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full',
          isSelected && 'ring-2 ring-black'
        )}
      >
        {/* En-tête avec sélection - HAUTEUR FIXE */}
        <div className="p-4 border-b border-gray-200 flex-none">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleCollectionSelection(collection.id)}
                className="mt-1 h-4 w-4 rounded border-gray-300 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate text-base">
                  {collection.name}
                </h3>
              </div>
            </div>
          </div>

          {/* Badges compacts sur deux lignes */}
          <div className="space-y-1.5">
            {/* Ligne 1: Status, Visibilité, Style, Room Category */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              <Badge
                variant={collection.is_active ? 'secondary' : 'secondary'}
                className="text-[10px] px-1.5 py-0.5 flex-shrink-0"
              >
                {collection.is_active ? 'Actif' : 'Inactif'}
              </Badge>
              <Badge
                variant={
                  collection.visibility === 'public' ? 'outline' : 'secondary'
                }
                className="text-[10px] px-1.5 py-0.5 flex-shrink-0"
              >
                {collection.visibility === 'public' ? 'Public' : 'Privé'}
              </Badge>
              {collection.style && (
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] px-1.5 py-0.5 flex-shrink-0"
                >
                  {formatCollectionStyle(collection.style)}
                </Badge>
              )}
            </div>

            {/* Ligne 2: Suitable Rooms + Theme Tags */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {/* Pièces compatibles (aligné avec products) */}
              {collection.suitable_rooms &&
                collection.suitable_rooms.length > 0 &&
                collection.suitable_rooms.slice(0, 3).map(room => (
                  <Badge
                    key={room}
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200 text-[10px] px-1.5 py-0.5 flex-shrink-0"
                  >
                    {getRoomLabel(room as RoomType)}
                  </Badge>
                ))}
              {collection.suitable_rooms &&
                collection.suitable_rooms.length > 3 && (
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200 text-[10px] px-1.5 py-0.5 flex-shrink-0"
                  >
                    +{collection.suitable_rooms.length - 3}
                  </Badge>
                )}

              {/* Tags personnalisés */}
              {collection.theme_tags &&
                collection.theme_tags.length > 0 &&
                collection.theme_tags.slice(0, 2).map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-gray-50 text-gray-700 border-gray-200 text-[10px] px-1.5 py-0.5 flex-shrink-0"
                  >
                    🏷️ {tag}
                  </Badge>
                ))}
              {collection.theme_tags && collection.theme_tags.length > 2 && (
                <Badge
                  variant="outline"
                  className="bg-gray-50 text-gray-700 border-gray-200 text-[10px] px-1.5 py-0.5 flex-shrink-0"
                >
                  +{collection.theme_tags.length - 2}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Aperçu des produits - HAUTEUR FLEXIBLE */}
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
            <span className="font-medium">
              {collection.product_count} produit
              {collection.product_count !== 1 ? 's' : ''}
            </span>
            <span className="text-[10px] text-gray-400">
              Créé le {formatDate(collection.created_at)}
            </span>
          </div>

          {/* Mini-galerie produits - HAUTEUR RÉDUITE */}
          <div className="mb-2 h-14">
            {collection.products && collection.products.length > 0 ? (
              <div className="flex space-x-1.5 overflow-x-auto h-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {collection.products.slice(0, 5).map((product: any) => (
                  <div
                    key={product.id}
                    className="relative flex-shrink-0 w-14 h-14 rounded bg-gray-100 overflow-hidden"
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
                {collection.product_count > 5 && (
                  <div className="flex-shrink-0 w-14 h-14 rounded bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 font-medium">
                    +{collection.product_count - 5}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-200 rounded">
                Aucun produit
              </div>
            )}
          </div>
        </div>

        {/* Footer avec actions - ULTRA COMPACT */}
        <div className="px-3 pb-2 pt-1.5 border-t border-gray-100 flex-none">
          {!isArchived ? (
            // Collections actives: Produits, Détails, Modifier, Archiver
            <div className="grid grid-cols-4 gap-1">
              <ButtonV2
                size="sm"
                variant="outline"
                onClick={() => handleManageProducts(collection)}
                icon={Package}
                className="w-full"
                title="Gérer produits"
              >
                Produits
              </ButtonV2>
              <ButtonV2
                size="sm"
                variant="outline"
                onClick={() =>
                  router.push(
                    `/produits/catalogue/collections/${collection.id}`
                  )
                }
                icon={ExternalLink}
                className="w-full"
                title="Voir les détails"
              >
                Détails
              </ButtonV2>
              <ButtonV2
                size="sm"
                variant="ghost"
                onClick={() => handleEditCollection(collection)}
                icon={Edit3}
                className="w-full"
                title="Modifier la collection"
              >
                Modifier
              </ButtonV2>
              <ButtonV2
                size="sm"
                variant="ghost"
                onClick={() => handleArchiveCollection(collection)}
                icon={Archive}
                className="w-full"
                title="Archiver"
              />
            </div>
          ) : (
            // Collections archivées: Détails, Restaurer, Supprimer
            <div className="grid grid-cols-3 gap-1">
              <ButtonV2
                size="sm"
                variant="outline"
                onClick={() =>
                  router.push(
                    `/produits/catalogue/collections/${collection.id}`
                  )
                }
                icon={ExternalLink}
                className="w-full"
                title="Voir les détails"
              >
                Détails
              </ButtonV2>
              <ButtonV2
                size="sm"
                variant="secondary"
                onClick={() => handleArchiveCollection(collection)}
                icon={ArchiveRestore}
                className="w-full"
                title="Restaurer"
              >
                Restaurer
              </ButtonV2>
              <ButtonV2
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteCollection(collection.id)}
                icon={Trash2}
                className="w-full"
                title="Supprimer"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Optimisation: Memoization des collections filtrées
  const stats = useMemo(
    () => ({
      total: collections.length,
      active: collections.filter(c => c.is_active).length,
      archived: archivedCollections.length,
    }),
    [collections, archivedCollections]
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-black">Collections</h1>
          <p className="text-gray-600 mt-1">
            Créez et partagez des sélections thématiques de produits
          </p>
        </div>
        <div>
          <ButtonV2
            onClick={handleCreateCollection}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle collection
          </ButtonV2>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 pt-6">
        <KPICardUnified
          variant="elegant"
          title="Collections totales"
          value={loading ? '...' : stats.total}
          icon={Layers}
        />
        <KPICardUnified
          variant="elegant"
          title="Collections actives"
          value={loading ? '...' : stats.active}
          icon={Eye}
        />
        <KPICardUnified
          variant="elegant"
          title="Collections archivées"
          value={archivedLoading ? '...' : stats.archived}
          icon={Archive}
        />
      </div>

      {/* Onglets collections actives/archivées */}
      <div className="flex border-b border-gray-200 px-6">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'active'
              ? 'border-b-2 border-black text-black'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Collections Actives ({collections.length})
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'archived'
              ? 'border-b-2 border-black text-black'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Collections Archivées ({archivedCollections.length})
        </button>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 px-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Rechercher une collection..."
            value={filters.search}
            onChange={e =>
              setFilters(prev => ({ ...prev, search: e.target.value }))
            }
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>

        <div className="flex space-x-2">
          <select
            value={filters.status}
            onChange={e =>
              setFilters(prev => ({ ...prev, status: e.target.value as any }))
            }
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actives</option>
            <option value="inactive">Inactives</option>
          </select>

          <select
            value={filters.visibility}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                visibility: e.target.value as any,
              }))
            }
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">Toutes visibilités</option>
            <option value="public">Publiques</option>
            <option value="private">Privées</option>
          </select>
        </div>
      </div>

      {/* Actions groupées */}
      {selectedCollections.length > 0 && (
        <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-md mx-6">
          <span className="text-sm text-gray-700">
            {selectedCollections.length} collection
            {selectedCollections.length !== 1 ? 's' : ''} sélectionnée
            {selectedCollections.length !== 1 ? 's' : ''}
          </span>
          <ButtonV2 variant="ghost" size="sm" onClick={handleBulkStatusToggle}>
            Changer le statut
          </ButtonV2>
          <ButtonV2
            variant="ghost"
            size="sm"
            onClick={() => {
              // TODO: Implémenter partage en lot
            }}
            className="text-blue-600 hover:text-blue-700"
          >
            Partager
          </ButtonV2>
          <ButtonV2
            variant="ghost"
            size="sm"
            onClick={() => {
              // TODO: Implémenter suppression en lot
            }}
            className="text-red-600 hover:text-red-700"
          >
            Supprimer
          </ButtonV2>
        </div>
      )}

      {/* Grille des collections - hauteur uniforme */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr px-6">
        {(activeTab === 'active' && loading) ||
        (activeTab === 'archived' && archivedLoading) ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 animate-pulse"
            >
              <div className="p-4 border-b border-gray-200">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-20 bg-gray-200 rounded" />
              </div>
            </div>
          ))
        ) : error ? (
          <div className="col-span-full p-8 text-center text-red-500 bg-white rounded-lg border border-red-200">
            Erreur lors du chargement des collections: {error}
          </div>
        ) : (
          (() => {
            const currentCollections =
              activeTab === 'active'
                ? filteredCollections
                : archivedCollections;
            const isArchived = activeTab === 'archived';
            return currentCollections.length > 0 ? (
              currentCollections.map(collection => (
                <div key={collection.id}>
                  {renderCollectionCard(collection, isArchived)}
                </div>
              ))
            ) : (
              <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
                {activeTab === 'active'
                  ? 'Aucune collection trouvée pour les critères sélectionnés'
                  : 'Aucune collection archivée'}
              </div>
            );
          })()
        )}
      </div>

      {/* Modal de création de collection avec wizard complet */}
      <CollectionCreationWizard
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleSaveCollection}
        editingCollection={editingCollection}
      />

      {/* Modal de gestion des produits - V2 Universel */}
      {managingProductsCollection && (
        <UniversalProductSelectorV2
          open={showProductsModal}
          onClose={() => setShowProductsModal(false)}
          onSelect={async (products: SelectedProduct[]) => {
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

                // Refetch collections pour mettre à jour compteurs
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
          }}
          mode="multi"
          context="collections"
          selectedProducts={[]}
          showQuantity={false}
          showImages
        />
      )}
    </div>
  );
}
