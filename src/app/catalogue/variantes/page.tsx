"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Package,
  Layers,
  Palette,
  Ruler,
  MoreHorizontal,
  AlertCircle,
  Users,
  ShoppingCart,
  Settings,
  ChevronRight,
  TreePine,
  FolderOpen,
  Tags
} from 'lucide-react'
import { useVariantGroups } from '@/hooks/use-variant-groups'
import { useVariantProducts } from '@/hooks/use-variant-products'
import { useFamilies } from '@/hooks/use-families'
import { useCategories } from '@/hooks/use-categories'
import { useSubcategories } from '@/hooks/use-subcategories'
import { VariantGroupForm } from '@/components/forms/VariantGroupForm'
import { ProductSelector } from '@/components/forms/ProductSelector'
import { QuickVariantForm } from '@/components/forms/QuickVariantForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function CatalogueVariantesPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('all')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('all')

  // Modals state
  const [variantGroupFormOpen, setVariantGroupFormOpen] = useState(false)
  const [productSelectorOpen, setProductSelectorOpen] = useState(false)
  const [quickVariantFormOpen, setQuickVariantFormOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')

  // Hooks pour les données réelles
  const { variantGroups, loading, error, refetch, createVariantGroup, updateVariantGroup, deleteVariantGroup } = useVariantGroups({
    search: searchTerm || undefined,
    variant_type: typeFilter === 'all' ? undefined : (typeFilter as 'color' | 'size' | 'material' | 'pattern'),
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active'
  })

  const { removeProductFromVariantGroup } = useVariantProducts()

  // Hooks pour l'arborescence hiérarchique
  const { families, loading: familiesLoading } = useFamilies()
  const { allCategories, getCategoriesByFamily } = useCategories()
  const { getSubcategoriesByCategory } = useSubcategories()

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (group: any) => {
    if (!group.total_products || group.total_products === 0) {
      return <Badge variant="outline" className="border-gray-300 text-gray-600">Vide</Badge>
    }
    if (group.active_products === group.total_products) {
      return <Badge variant="outline" className="border-green-300 text-green-600">Toutes actives</Badge>
    } else if (group.active_products > 0) {
      return <Badge variant="outline" className="border-orange-300 text-orange-600">Partielles</Badge>
    } else {
      return <Badge variant="outline" className="border-red-300 text-red-600">Inactives</Badge>
    }
  }

  // Fonction pour obtenir l'icône du type de variante
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

  // Fonction pour formater les dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  // Fonctions pour gérer la hiérarchie
  const getFilteredCategories = () => {
    if (selectedFamilyId === 'all') return []
    return getCategoriesByFamily(selectedFamilyId)
  }

  const getFilteredSubcategories = async () => {
    if (selectedCategoryId === 'all') return []
    try {
      return await getSubcategoriesByCategory(selectedCategoryId)
    } catch (error) {
      console.error('Erreur lors du chargement des sous-catégories:', error)
      return []
    }
  }

  // Fonction pour construire le fil d'Ariane hiérarchique
  const buildBreadcrumb = () => {
    const breadcrumb = []

    if (selectedFamilyId !== 'all') {
      const family = families.find(f => f.id === selectedFamilyId)
      if (family) {
        breadcrumb.push({
          name: family.name,
          icon: TreePine,
          level: 'famille'
        })
      }
    }

    if (selectedCategoryId !== 'all') {
      const category = allCategories.find(c => c.id === selectedCategoryId)
      if (category) {
        breadcrumb.push({
          name: category.name,
          icon: FolderOpen,
          level: 'catégorie'
        })
      }
    }

    if (selectedSubcategoryId !== 'all') {
      // Récupération asynchrone - on affiche seulement si disponible
      breadcrumb.push({
        name: 'Sous-catégorie sélectionnée',
        icon: Tags,
        level: 'sous-catégorie'
      })
    }

    return breadcrumb
  }

  // Handlers pour les actions
  const handleCreateGroup = () => {
    setSelectedGroup(null)
    setFormMode('create')
    setVariantGroupFormOpen(true)
  }

  const handleEditGroup = (group: any) => {
    setSelectedGroup(group)
    setFormMode('edit')
    setVariantGroupFormOpen(true)
  }

  const handleAddExistingProducts = (group: any) => {
    setSelectedGroup(group)
    setProductSelectorOpen(true)
  }

  const handleCreateQuickVariant = (group: any) => {
    setSelectedGroup(group)
    setQuickVariantFormOpen(true)
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce groupe de variantes ?')) {
      await deleteVariantGroup(groupId)
    }
  }

  const handleRemoveProduct = async (productId: string) => {
    if (confirm('Êtes-vous sûr de vouloir retirer ce produit du groupe ?')) {
      await removeProductFromVariantGroup(productId)
      refetch()
    }
  }

  const handleFormSubmit = (group: any) => {
    console.log('Groupe soumis:', group)
    refetch()
  }

  const handleProductsAdded = (count: number) => {
    console.log(`${count} produits ajoutés`)
    refetch()
  }

  const handleProductCreated = (product: any) => {
    console.log('Produit créé:', product)
    refetch()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Gestion des Variantes</h1>
              <p className="text-gray-600 mt-1">Organisation des variantes de produits (couleurs, tailles, matériaux)</p>
              <p className="text-sm text-blue-600 mt-1">Compatible Google Merchant Center 2024</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push('/catalogue')}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                Retour Catalogue
              </Button>
              <Button
                className="bg-black hover:bg-gray-800 text-white"
                onClick={handleCreateGroup}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Groupe
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filtres et recherche */}
        <Card className="border-black mb-6">
          <CardHeader>
            <CardTitle className="text-black">Filtres et Recherche</CardTitle>
            <CardDescription>Rechercher par groupe de variantes et catégorisation des produits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Première ligne - Recherche et Type de variante */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher un groupe..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-black focus:ring-black"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-black">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actifs</SelectItem>
                    <SelectItem value="inactive">Inactifs</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="border-black">
                    <SelectValue placeholder="Type variante" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="color">Couleur</SelectItem>
                    <SelectItem value="size">Taille</SelectItem>
                    <SelectItem value="material">Matériau</SelectItem>
                    <SelectItem value="pattern">Motif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Deuxième ligne - Hiérarchie produits */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <TreePine className="h-4 w-4 mr-2" />
                  Filtrer par catégorisation des produits
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Select
                    value={selectedFamilyId}
                    onValueChange={(value) => {
                      setSelectedFamilyId(value)
                      setSelectedCategoryId('all')
                      setSelectedSubcategoryId('all')
                    }}
                  >
                    <SelectTrigger className="border-gray-300">
                      <TreePine className="h-4 w-4 mr-2 text-green-600" />
                      <SelectValue placeholder="Famille" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les familles</SelectItem>
                      {families.map((family) => (
                        <SelectItem key={family.id} value={family.id}>
                          {family.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedCategoryId}
                    onValueChange={(value) => {
                      setSelectedCategoryId(value)
                      setSelectedSubcategoryId('all')
                    }}
                    disabled={selectedFamilyId === 'all'}
                  >
                    <SelectTrigger className="border-gray-300">
                      <FolderOpen className="h-4 w-4 mr-2 text-blue-600" />
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      {getFilteredCategories().map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedSubcategoryId}
                    onValueChange={setSelectedSubcategoryId}
                    disabled={selectedCategoryId === 'all'}
                  >
                    <SelectTrigger className="border-gray-300">
                      <Tags className="h-4 w-4 mr-2 text-purple-600" />
                      <SelectValue placeholder="Sous-catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les sous-catégories</SelectItem>
                      {/* Elles seront chargées dynamiquement selon la catégorie */}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    className="border-black text-black hover:bg-black hover:text-white"
                    onClick={refetch}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Actualiser
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Groupes Total</p>
                  <p className="text-2xl font-bold text-black">{variantGroups.length}</p>
                </div>
                <Package className="h-8 w-8 text-black" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Produits Totaux</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {variantGroups.reduce((sum, group) => sum + (group.total_products || 0), 0)}
                  </p>
                </div>
                <Layers className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Produits Actifs</p>
                  <p className="text-2xl font-bold text-green-600">
                    {variantGroups.reduce((sum, group) => sum + (group.active_products || 0), 0)}
                  </p>
                </div>
                <Palette className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Types Différents</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {new Set(variantGroups.map(g => g.variant_type)).size}
                  </p>
                </div>
                <Ruler className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des groupes de variantes */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="text-black">Groupes de Variantes ({variantGroups.length})</CardTitle>
            <CardDescription>Gestion centralisée des groupes de variantes de produits</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Chargement des groupes de variantes...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-600">Erreur: {error}</p>
                <Button onClick={refetch} className="mt-4">Réessayer</Button>
              </div>
            )}

            {!loading && !error && (
              <div className="space-y-4">
                {variantGroups.map((group) => (
                  <div key={group.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="font-semibold text-black text-lg">{group.name}</h3>
                          {getStatusBadge(group)}
                          <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                            {group.item_group_id}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            {getVariantTypeIcon(group.variant_type)}
                            <span className="text-gray-600 capitalize">
                              <strong>Type:</strong> {group.variant_type}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
                              <strong>Produits:</strong> {group.active_products || 0}/{group.total_products || 0}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
                              <strong>Mis à jour:</strong> {formatDate(group.updated_at)}
                            </span>
                          </div>
                        </div>

                        {/* Affichage du produit de base */}
                        {group.base_product && (
                          <div className="mb-3 p-2 bg-blue-50 rounded">
                            <p className="text-sm font-medium text-blue-900">
                              Produit de base: {group.base_product.name} (SKU: {group.base_product.sku})
                            </p>
                          </div>
                        )}

                        {/* Description */}
                        {group.description && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-600">{group.description}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-300"
                          onClick={() => handleAddExistingProducts(group)}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-300"
                          onClick={() => handleEditGroup(group)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="border-gray-300">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleCreateQuickVariant(group)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Créer variante rapide
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddExistingProducts(group)}>
                              <Users className="h-4 w-4 mr-2" />
                              Ajouter produits existants
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEditGroup(group)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier le groupe
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteGroup(group.id)}
                              className="text-red-600"
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Supprimer le groupe
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}

                {variantGroups.length === 0 && (
                  <div className="text-center py-8">
                    <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun groupe de variantes trouvé</p>
                    <p className="text-sm text-gray-500 mb-4">Créez votre premier groupe de variantes</p>
                    <Button onClick={handleCreateGroup} className="bg-black hover:bg-gray-800 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Créer un groupe
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <VariantGroupForm
        isOpen={variantGroupFormOpen}
        onClose={() => setVariantGroupFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedGroup}
        mode={formMode}
      />

      <ProductSelector
        isOpen={productSelectorOpen}
        onClose={() => setProductSelectorOpen(false)}
        variantGroupId={selectedGroup?.id || ''}
        groupName={selectedGroup?.name || ''}
        onProductsAdded={handleProductsAdded}
      />

      <QuickVariantForm
        isOpen={quickVariantFormOpen}
        onClose={() => setQuickVariantFormOpen(false)}
        variantGroupId={selectedGroup?.id || ''}
        baseProductId={selectedGroup?.base_product_id || ''}
        groupName={selectedGroup?.name || ''}
        variantType={selectedGroup?.variant_type || 'color'}
        onProductCreated={handleProductCreated}
      />
    </div>
  )
}