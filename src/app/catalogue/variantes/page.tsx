"use client"

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
  X
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { cn } from '../../../lib/utils'
import { useVariantGroups } from '@/hooks/use-variant-groups'
import { useFamilies } from '@/hooks/use-families'
import { useCategories } from '@/hooks/use-categories'
import { useSubcategories } from '@/hooks/use-subcategories'
import { VariantGroupForm } from '@/components/forms/VariantGroupForm'
import { AddProductsToGroupModal } from '@/components/forms/AddProductsToGroupModal'
import { useToast } from '@/hooks/use-toast'

// Interface filtres variantes
interface LocalVariantFilters {
  search: string
  status: 'all' | 'active' | 'inactive'
  type: 'all' | 'color' | 'material'
  familyId: string
  categoryId: string
  subcategoryId: string
}

// Helper pour formater le type de variante
const formatVariantType = (type?: string): string => {
  if (!type) return ''
  const typeMap: Record<string, string> = {
    'color': 'Couleur',
    'material': 'Matériau'
  }
  return typeMap[type] || type
}

export default function VariantesPage() {
  const { toast } = useToast()
  const router = useRouter()

  // États pour la gestion des filtres et de l'interface
  const [filters, setFilters] = useState<LocalVariantFilters>({
    search: "",
    status: 'all',
    type: 'all',
    familyId: 'all',
    categoryId: 'all',
    subcategoryId: 'all'
  })
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [editingGroup, setEditingGroup] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddProductsModal, setShowAddProductsModal] = useState(false)
  const [selectedGroupForProducts, setSelectedGroupForProducts] = useState<any>(null)

  // Stabiliser les filtres avec useMemo pour éviter boucle infinie
  const stableFilters = useMemo(() => ({
    search: filters.search || undefined,
    variant_type: filters.type === 'all' ? undefined : filters.type as any,
    is_active: filters.status === 'all' ? undefined : filters.status === 'active'
  }), [filters.search, filters.type, filters.status])

  // Hooks pour les données
  const {
    variantGroups,
    loading,
    error,
    refetch,
    createVariantGroup,
    updateVariantGroup,
    deleteVariantGroup,
    removeProductFromGroup
  } = useVariantGroups(stableFilters)

  // Hooks pour l'arborescence hiérarchique
  const { families, loading: familiesLoading } = useFamilies()
  const { allCategories, getCategoriesByFamily } = useCategories()
  const { getSubcategoriesByCategory } = useSubcategories()

  // Filtres calculés
  const filteredCategories = useMemo(() => {
    if (filters.familyId === 'all') return []
    return getCategoriesByFamily(filters.familyId)
  }, [filters.familyId, getCategoriesByFamily])

  const filteredSubcategories = useMemo(() => {
    if (filters.categoryId === 'all') return []
    // Note: getSubcategoriesByCategory est async, on pourrait améliorer ça
    return []
  }, [filters.categoryId])

  // Fonctions utilitaires
  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handleEditGroup = useCallback((group: any) => {
    setEditingGroup(group)
    setShowEditModal(true)
  }, [])

  const handleCreateGroup = useCallback(() => {
    setEditingGroup(null)
    setShowEditModal(true)
  }, [])

  const handleDeleteGroup = useCallback(async (groupId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce groupe de variantes ?')) return

    const result = await deleteVariantGroup(groupId)
    if (result) {
      toast({
        title: "Groupe supprimé",
        description: "Le groupe de variantes a été supprimé avec succès",
      })
    }
  }, [deleteVariantGroup, toast])

  const handleAddProducts = useCallback((group: any) => {
    setSelectedGroupForProducts(group)
    setShowAddProductsModal(true)
  }, [])

  const handleRemoveProduct = useCallback(async (productId: string, productName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer "${productName}" de ce groupe ?`)) return

    const result = await removeProductFromGroup(productId)
    if (result) {
      toast({
        title: "Produit retiré",
        description: `"${productName}" a été retiré du groupe`,
      })
      refetch()
    }
  }, [removeProductFromGroup, toast, refetch])

  // Obtenir l'icône du type de variante
  const getVariantTypeIcon = (type: string) => {
    switch (type) {
      case 'color':
        return <Palette className="h-4 w-4 text-purple-600" />
      case 'size':
        return <Ruler className="h-4 w-4 text-blue-600" />
      case 'material':
        return <Layers className="h-4 w-4 text-green-600" />
      case 'pattern':
        return <Layers className="h-4 w-4 text-orange-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  // Composant Groupe Card
  const renderGroupCard = (group: any) => {
    const isSelected = selectedGroups.includes(group.id)

    return (
      <div className={cn(
        "bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow",
        isSelected && "ring-2 ring-black"
      )}>
        {/* En-tête avec sélection */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleGroupSelection(group.id)}
                className="mt-1 h-4 w-4 rounded border-gray-300"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {getVariantTypeIcon(group.variant_type)}
                  <h3 className="font-medium text-gray-900 truncate">
                    {group.name}
                  </h3>
                </div>
                {group.subcategory && (
                  <p className="text-sm text-gray-600 mt-1">
                    {group.subcategory.category?.name} → {group.subcategory.name}
                  </p>
                )}
                <div className="flex items-center flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    {formatVariantType(group.variant_type)}
                  </Badge>
                  {group.dimensions_length && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {group.dimensions_length}×{group.dimensions_width}×{group.dimensions_height} {group.dimensions_unit}
                    </Badge>
                  )}
                  {group.common_weight && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      ⚖️ {group.common_weight} kg
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="flex items-center space-x-2 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/catalogue/variantes/${group.id}`)}
                className="text-blue-600"
                title="Voir détail"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditGroup(group)}
                title="Modifier"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteGroup(group.id)}
                className="text-red-600"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Aperçu des produits + Bouton Ajouter */}
        <div className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <span>{group.product_count || 0} produit{(group.product_count || 0) !== 1 ? 's' : ''}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddProducts(group)}
              className="text-xs h-7"
            >
              <Plus className="h-3 w-3 mr-1" />
              Ajouter produits
            </Button>
          </div>

          {/* Mini-galerie produits */}
          {group.products && group.products.length > 0 ? (
            <div className="flex space-x-2 overflow-x-auto">
              {group.products.slice(0, 4).map((product: any) => (
                <div key={product.id} className="relative flex-shrink-0 w-20 h-20 rounded bg-gray-100 overflow-hidden group/product">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  {/* Bouton retirer en hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveProduct(product.id, product.name)
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover/product:opacity-100 transition-opacity hover:bg-red-600"
                    title={`Retirer ${product.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {(group.product_count || 0) > 4 && (
                <div className="flex-shrink-0 w-20 h-20 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                  +{(group.product_count || 0) - 4}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-gray-500 border border-dashed border-gray-200 rounded">
              Aucun produit - Cliquez sur "Ajouter produits"
            </div>
          )}

          <p className="text-xs text-gray-500 mt-2">
            Créé le {formatDate(group.created_at)}
          </p>
        </div>
      </div>
    )
  }

  // Statistiques
  const stats = useMemo(() => ({
    total: variantGroups.length,
    totalProducts: variantGroups.reduce((sum, g) => sum + (g.product_count || 0), 0),
    types: new Set(variantGroups.map(g => g.variant_type)).size,
  }), [variantGroups])

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-black">Gestion des Variantes</h1>
          <p className="text-gray-600 mt-1">
            Organisation des variantes de produits (couleurs, tailles, matériaux)
          </p>
          <p className="text-sm text-blue-600 mt-1">Compatible Google Merchant Center 2024</p>
        </div>
        <div>
          <Button
            onClick={handleCreateGroup}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau groupe
          </Button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="space-y-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher un groupe..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <div className="flex space-x-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>

            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">Tous les types</option>
              <option value="color">Couleur</option>
              <option value="material">Matériau</option>
            </select>
          </div>
        </div>

        {/* Filtres hiérarchiques */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <TreePine className="h-4 w-4 mr-2" />
            Filtrer par catégorisation des produits
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.familyId}
              onChange={(e) => {
                setFilters(prev => ({
                  ...prev,
                  familyId: e.target.value,
                  categoryId: 'all',
                  subcategoryId: 'all'
                }))
              }}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">Toutes les familles</option>
              {families.map((family) => (
                <option key={family.id} value={family.id}>
                  {family.name}
                </option>
              ))}
            </select>

            <select
              value={filters.categoryId}
              onChange={(e) => {
                setFilters(prev => ({
                  ...prev,
                  categoryId: e.target.value,
                  subcategoryId: 'all'
                }))
              }}
              disabled={filters.familyId === 'all'}
              className="border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
            >
              <option value="all">Toutes les catégories</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={filters.subcategoryId}
              onChange={(e) => setFilters(prev => ({ ...prev, subcategoryId: e.target.value }))}
              disabled={filters.categoryId === 'all'}
              className="border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
            >
              <option value="all">Toutes les sous-catégories</option>
              {/* Les sous-catégories seront chargées dynamiquement */}
            </select>
          </div>
        </div>
      </div>

      {/* Actions groupées */}
      {selectedGroups.length > 0 && (
        <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-md">
          <span className="text-sm text-gray-700">
            {selectedGroups.length} groupe{selectedGroups.length !== 1 ? 's' : ''} sélectionné{selectedGroups.length !== 1 ? 's' : ''}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // TODO: Implémenter actions en lot
            }}
            className="text-red-600 hover:text-red-700"
          >
            Supprimer
          </Button>
        </div>
      )}

      {/* Grille des groupes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 animate-pulse">
              <div className="p-4 border-b border-gray-200">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))
        ) : error ? (
          <div className="col-span-full p-8 text-center text-red-500 bg-white rounded-lg border border-red-200">
            Erreur lors du chargement des groupes: {error}
          </div>
        ) : variantGroups.length > 0 ? (
          variantGroups.map(group => (
            <div key={group.id}>{renderGroupCard(group)}</div>
          ))
        ) : (
          <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
            Aucun groupe de variantes trouvé pour les critères sélectionnés
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-light text-black">
            {loading ? '...' : stats.total}
          </div>
          <div className="text-sm text-gray-600">Groupes totaux</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-light text-black">
            {loading ? '...' : stats.totalProducts}
          </div>
          <div className="text-sm text-gray-600">Produits totaux</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-light text-black">
            {loading ? '...' : stats.types}
          </div>
          <div className="text-sm text-gray-600">Types différents</div>
        </div>
      </div>

      {/* Modal de création/édition de groupe */}
      {showEditModal && (
        <VariantGroupForm
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={(data) => {
            console.log('Groupe soumis:', data)
            refetch()
          }}
          editingGroup={editingGroup}
        />
      )}

      {/* Modal ajout produits */}
      {showAddProductsModal && selectedGroupForProducts && (
        <AddProductsToGroupModal
          isOpen={showAddProductsModal}
          onClose={() => {
            setShowAddProductsModal(false)
            setSelectedGroupForProducts(null)
          }}
          variantGroup={selectedGroupForProducts}
          onProductsAdded={() => {
            refetch()
            toast({
              title: "Produits ajoutés",
              description: "Les produits ont été ajoutés au groupe avec succès"
            })
          }}
        />
      )}
    </div>
  )
}