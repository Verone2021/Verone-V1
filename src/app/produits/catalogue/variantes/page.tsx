'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Package,
  Palette,
  Ruler,
  Layers,
  TreePine,
  FolderOpen,
  Tags,
  X,
  Archive,
  ArchiveRestore,
} from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { ButtonV2 } from '@/components/ui/button';
import { KPICardUnified } from '@/components/ui/kpi-card-unified';
import { cn } from '@/lib/utils';
import { CategoryFilterCombobox } from '@/shared/modules/categories/components/filters/CategoryFilterCombobox';
import { useToast } from '@/shared/modules/common/hooks';
import { VariantAddProductModal } from '@/shared/modules/products/components/modals/VariantAddProductModal';
import { VariantGroupEditModal } from '@/shared/modules/products/components/modals/VariantGroupEditModal';
import { VariantGroupCreationWizard } from '@/shared/modules/products/components/wizards/VariantGroupCreationWizard';
import { useVariantGroups } from '@/shared/modules/products/hooks';

// Interface filtres variantes
interface LocalVariantFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
  type: 'all' | 'color' | 'material';
  subcategoryId?: string;
}

// Helper pour formater le type de variante
const formatVariantType = (type?: string): string => {
  if (!type) return '';
  const typeMap: Record<string, string> = {
    color: 'Couleur',
    material: 'Matériau',
  };
  return typeMap[type] || type;
};

export default function VariantesPage() {
  const { toast } = useToast();
  const router = useRouter();

  // États pour la gestion des filtres et de l'interface
  const [filters, setFilters] = useState<LocalVariantFilters>({
    search: '',
    status: 'all',
    type: 'all',
    subcategoryId: undefined,
  });
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddProductsModal, setShowAddProductsModal] = useState(false);
  const [selectedGroupForProducts, setSelectedGroupForProducts] =
    useState<any>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [archivedVariantGroups, setArchivedVariantGroups] = useState<any[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);

  // Stabiliser les filtres avec useMemo pour éviter boucle infinie
  const stableFilters = useMemo(
    () => ({
      search: filters.search || undefined,
      variant_type: filters.type === 'all' ? undefined : (filters.type as any),
      is_active:
        filters.status === 'all' ? undefined : filters.status === 'active',
    }),
    [filters.search, filters.type, filters.status]
  );

  // Hooks pour les données
  const {
    variantGroups,
    loading,
    error,
    refetch,
    createVariantGroup,
    updateVariantGroup,
    deleteVariantGroup,
    removeProductFromGroup,
    archiveVariantGroup,
    unarchiveVariantGroup,
    loadArchivedVariantGroups,
  } = useVariantGroups(stableFilters);

  // Plus besoin de hooks familles/catégories/subcatégories (géré par CategoryFilterCombobox)

  // Fonctions utilitaires
  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleEditGroup = useCallback((group: any) => {
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

  const handleArchiveGroup = useCallback(
    async (groupId: string, isArchived: boolean) => {
      const result = isArchived
        ? await unarchiveVariantGroup(groupId)
        : await archiveVariantGroup(groupId);

      if (result) {
        refetch();
        if (activeTab === 'archived') {
          await handleLoadArchivedGroups();
        }
      }
    },
    [archiveVariantGroup, unarchiveVariantGroup, refetch, activeTab]
  );

  const handleLoadArchivedGroups = useCallback(async () => {
    setArchivedLoading(true);
    const archivedGroups = await loadArchivedVariantGroups();
    setArchivedVariantGroups(archivedGroups);
    setArchivedLoading(false);
  }, [loadArchivedVariantGroups]);

  const handleAddProducts = useCallback((group: any) => {
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
        refetch();
      }
    },
    [removeProductFromGroup, toast, refetch]
  );

  // Charger les groupes archivés quand on change d'onglet
  useEffect(() => {
    if (activeTab === 'archived' && archivedVariantGroups.length === 0) {
      handleLoadArchivedGroups();
    }
  }, [activeTab, archivedVariantGroups.length, handleLoadArchivedGroups]);

  // Obtenir l'icône du type de variante
  const getVariantTypeIcon = (type: string) => {
    switch (type) {
      case 'color':
        return <Palette className="h-4 w-4 text-purple-600" />;
      case 'size':
        return <Ruler className="h-4 w-4 text-blue-600" />;
      case 'material':
        return <Layers className="h-4 w-4 text-green-600" />;
      case 'pattern':
        return <Layers className="h-4 w-4 text-black" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  // Composant Groupe Card
  const renderGroupCard = (group: any, isArchived: boolean) => {
    const isSelected = selectedGroups.includes(group.id);

    return (
      <div
        className={cn(
          'bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full',
          isSelected && 'ring-2 ring-black'
        )}
      >
        {/* En-tête avec sélection - HAUTEUR FIXE */}
        <div className="p-3 border-b border-gray-200 flex-none">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleGroupSelection(group.id)}
                className="mt-1 h-4 w-4 rounded border-gray-300 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getVariantTypeIcon(group.variant_type)}
                  <h3 className="font-semibold text-gray-900 truncate text-sm">
                    {group.name}
                  </h3>
                </div>
                {group.subcategory && (
                  <p className="text-xs text-gray-500 truncate">
                    {group.subcategory.category?.name} →{' '}
                    {group.subcategory.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Badge type de variante uniquement (ce qui varie) */}
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] px-1.5 py-0.5 flex-shrink-0"
            >
              {formatVariantType(group.variant_type)}
            </Badge>
          </div>
        </div>

        {/* Aperçu des produits - HAUTEUR FLEXIBLE */}
        <div className="p-3 flex-1 flex flex-col">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
            <span className="font-medium">
              {group.product_count || 0} produit
              {(group.product_count || 0) !== 1 ? 's' : ''}
            </span>
            <span className="text-[10px] text-gray-400">
              Créé le {formatDate(group.created_at)}
            </span>
          </div>

          {/* Mini-galerie produits - HAUTEUR RÉDUITE */}
          <div className="mb-2 h-14">
            {group.products && group.products.length > 0 ? (
              <div className="flex space-x-1.5 overflow-x-auto h-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {group.products.slice(0, 5).map((product: any) => (
                  <div
                    key={product.id}
                    className="relative flex-shrink-0 w-14 h-14 rounded bg-gray-100 overflow-hidden group/product"
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
                    {/* Bouton retirer en hover */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleRemoveProduct(product.id, product.name);
                      }}
                      className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/product:opacity-100 transition-opacity hover:bg-red-600"
                      title={`Retirer ${product.name}`}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
                {(group.product_count || 0) > 5 && (
                  <div className="flex-shrink-0 w-14 h-14 rounded bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 font-medium">
                    +{(group.product_count || 0) - 5}
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
        <div className="px-2 pb-2 pt-1 border-t border-gray-100 flex-none">
          {!isArchived ? (
            // Variantes actives: Ajouter, Détails, Modifier, Archiver
            <div className="grid grid-cols-4 gap-1">
              <ButtonV2
                size="sm"
                variant="outline"
                onClick={() => handleAddProducts(group)}
                icon={Plus}
                className="w-full"
                title="Ajouter des produits"
              >
                Ajouter
              </ButtonV2>
              <ButtonV2
                size="sm"
                variant="outline"
                onClick={() =>
                  router.push(`/produits/catalogue/variantes/${group.id}`)
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
                onClick={() => handleEditGroup(group)}
                icon={Edit3}
                className="w-full"
                title="Modifier le groupe"
              >
                Modifier
              </ButtonV2>
              <ButtonV2
                size="sm"
                variant="ghost"
                onClick={() => handleArchiveGroup(group.id, false)}
                icon={Archive}
                className="w-full"
                title="Archiver le groupe"
              />
            </div>
          ) : (
            // Variantes archivées: Détails, Restaurer, Supprimer
            <div className="grid grid-cols-3 gap-1">
              <ButtonV2
                size="sm"
                variant="outline"
                onClick={() =>
                  router.push(`/produits/catalogue/variantes/${group.id}`)
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
                onClick={() => handleArchiveGroup(group.id, true)}
                icon={ArchiveRestore}
                className="w-full"
                title="Restaurer le groupe"
              >
                Restaurer
              </ButtonV2>
              <ButtonV2
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteGroup(group.id)}
                icon={Trash2}
                className="w-full"
                title="Supprimer le groupe"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Filtrage côté client par subcategory
  const filteredVariantGroups = useMemo(() => {
    if (!filters.subcategoryId) {
      return variantGroups;
    }

    // Filtrer par subcategory_id du groupe (relation directe)
    return variantGroups.filter(
      (group: any) => group.subcategory_id === filters.subcategoryId
    );
  }, [variantGroups, filters.subcategoryId]);

  // Statistiques (basées sur groupes filtrés)
  const stats = useMemo(
    () => ({
      total: filteredVariantGroups.length,
      totalProducts: filteredVariantGroups.reduce(
        (sum, g) => sum + (g.product_count || 0),
        0
      ),
      types: new Set(filteredVariantGroups.map(g => g.variant_type)).size,
    }),
    [filteredVariantGroups]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        title="Gestion des Variantes"
        description="Organisation des variantes de produits (couleurs, tailles, matériaux)"
        icon={Palette}
        action={
          <ButtonV2 variant="primary" icon={Plus} onClick={handleCreateGroup}>
            Nouveau groupe
          </ButtonV2>
        }
      />

      <div className="p-6 space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICardUnified variant="elegant"
            title="Groupes totaux"
            value={loading ? '...' : stats.total}
            icon={Layers}
          />
          <KPICardUnified variant="elegant"
            title="Produits totaux"
            value={loading ? '...' : stats.totalProducts}
            icon={Package}
          />
          <KPICardUnified variant="elegant"
            title="Types différents"
            value={loading ? '...' : stats.types}
            icon={Tags}
          />
        </div>

        {/* Barre de recherche et filtres */}
        {/* Onglets variantes actives/archivées */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'active'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Variantes Actives ({variantGroups.length})
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'archived'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Variantes Archivées ({archivedVariantGroups.length})
          </button>
        </div>

        {/* Recherche et filtres - ligne unique compacte */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Barre de recherche - réduite */}
            <div className="flex-1 min-w-[200px] max-w-xs relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={filters.search}
                onChange={e =>
                  setFilters(prev => ({ ...prev, search: e.target.value }))
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            {/* Filtre catégorie hiérarchique - Combobox moderne */}
            <div className="w-72">
              <CategoryFilterCombobox
                value={filters.subcategoryId}
                onValueChange={subcategoryId =>
                  setFilters(prev => ({ ...prev, subcategoryId }))
                }
                entityType="variant_groups"
                placeholder="Filtrer par catégorie..."
              />
            </div>

            {/* Filtres status et type */}
            <select
              value={filters.status}
              onChange={e =>
                setFilters(prev => ({ ...prev, status: e.target.value as any }))
              }
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>

            <select
              value={filters.type}
              onChange={e =>
                setFilters(prev => ({ ...prev, type: e.target.value as any }))
              }
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">Tous les types</option>
              <option value="color">Couleur</option>
              <option value="material">Matériau</option>
            </select>
          </div>
        </div>

        {/* Actions groupées */}
        {selectedGroups.length > 0 && (
          <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-md">
            <span className="text-sm text-gray-700">
              {selectedGroups.length} groupe
              {selectedGroups.length !== 1 ? 's' : ''} sélectionné
              {selectedGroups.length !== 1 ? 's' : ''}
            </span>
            <ButtonV2
              variant="destructive"
              size="sm"
              onClick={() => {
                // TODO: Implémenter actions en lot
              }}
            >
              Supprimer
            </ButtonV2>
          </div>
        )}

        {/* Grille des groupes - hauteur uniforme */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          {activeTab === 'active' ? (
            loading ? (
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
                Erreur lors du chargement des groupes: {error}
              </div>
            ) : filteredVariantGroups.length > 0 ? (
              filteredVariantGroups.map(group => (
                <div key={group.id}>{renderGroupCard(group, false)}</div>
              ))
            ) : (
              <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
                Aucun groupe de variantes trouvé pour les critères sélectionnés
              </div>
            )
          ) : archivedLoading ? (
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
          ) : archivedVariantGroups.length > 0 ? (
            archivedVariantGroups.map(group => (
              <div key={group.id}>{renderGroupCard(group, true)}</div>
            ))
          ) : (
            <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
              Aucun groupe de variantes archivé
            </div>
          )}
        </div>

        {/* Modal de création (Wizard 3 étapes) */}
        {showEditModal && !editingGroup && (
          <VariantGroupCreationWizard
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSuccess={groupId => {
              console.log('Groupe créé:', groupId);
              refetch();
              setShowEditModal(false);
            }}
          />
        )}

        {/* Modal d'édition */}
        {showEditModal && editingGroup && (
          <VariantGroupEditModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditingGroup(null);
            }}
            onSubmit={async (groupId, data) => {
              await updateVariantGroup(groupId, data);
              refetch();
              setShowEditModal(false);
              setEditingGroup(null);
            }}
            group={editingGroup}
          />
        )}

        {/* Modal ajout produits */}
        {showAddProductsModal && selectedGroupForProducts && (
          <VariantAddProductModal
            isOpen={showAddProductsModal}
            onClose={() => {
              setShowAddProductsModal(false);
              setSelectedGroupForProducts(null);
            }}
            group={selectedGroupForProducts}
            onSubmit={async data => {
              // L'ajout du produit au groupe est géré par le modal
              refetch();
              toast({
                title: 'Produits ajoutés',
                description:
                  'Les produits ont été ajoutés au groupe avec succès',
              });
            }}
          />
        )}
      </div>
    </div>
  );
}
