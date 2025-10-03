'use client'

import { use, useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Package, Calendar, Edit3, Plus, X, Eye, Palette, Ruler, Layers, Settings, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useVariantGroup, useProductVariantEditing } from '@/hooks/use-variant-groups'
import { useVariantGroups } from '@/hooks/use-variant-groups'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import { VariantGroupEditModal } from '@/components/business/variant-group-edit-modal'
import { AddProductsToGroupModal } from '@/components/forms/AddProductsToGroupModal'
import { CreateProductInGroupModal } from '@/components/forms/CreateProductInGroupModal'
import { EditProductVariantModal } from '@/components/business/edit-product-variant-modal'
import { ProductDuplicateButton } from '@/components/catalogue/product-duplicate-button'
import type { VariantProduct } from '@/types/variant-groups'
import { formatAttributesForDisplay, type VariantAttributes } from '@/types/variant-attributes-types'
import { COLLECTION_STYLE_OPTIONS } from '@/types/collections'

interface VariantGroupDetailPageProps {
  params: Promise<{
    groupId: string
  }>
}

const formatVariantType = (type?: string): string => {
  if (!type) return ''
  const typeMap: Record<string, string> = {
    'color': 'Couleur',
    'size': 'Taille',
    'material': 'Matériau',
    'pattern': 'Motif'
  }
  return typeMap[type] || type
}

const getVariantTypeIcon = (type: string) => {
  switch (type) {
    case 'color':
      return <Palette className="h-5 w-5 text-purple-600" />
    case 'size':
      return <Ruler className="h-5 w-5 text-blue-600" />
    case 'material':
      return <Layers className="h-5 w-5 text-green-600" />
    case 'pattern':
      return <Layers className="h-5 w-5 text-orange-600" />
    default:
      return <Package className="h-5 w-5 text-gray-600" />
  }
}

const formatStyle = (style?: string): string => {
  if (!style) return ''
  const styleOption = COLLECTION_STYLE_OPTIONS.find(s => s.value === style)
  return styleOption?.label || style
}

// Composant pour carte produit
interface VariantProductCardProps {
  product: any
  variantType: string
  hasCommonSupplier: boolean
  onRemove: (id: string, name: string) => void
  onEdit: (product: any) => void
  onDuplicate?: (newProduct: any) => void
  router: any
}

function VariantProductCard({
  product,
  variantType,
  hasCommonSupplier,
  onRemove,
  onEdit,
  onDuplicate,
  router
}: VariantProductCardProps) {
  // Formater les attributs pour affichage
  const attributesDisplay = formatAttributesForDisplay(product.variant_attributes as VariantAttributes)

  return (
    <Card id={`product-${product.id}`} className="overflow-hidden hover:shadow-lg transition-shadow relative">
      <div className="aspect-square relative bg-gray-50">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
        )}
        {/* Badge position variante */}
        {product.variant_position && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-black text-white">
              #{product.variant_position}
            </Badge>
          </div>
        )}
        {/* Bouton retirer */}
        <button
          onClick={() => onRemove(product.id, product.name)}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 hover:opacity-100 transition-opacity hover:bg-red-600"
          title={`Retirer ${product.name}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <CardContent className="p-4 flex flex-col h-[280px]">
        {/* Zone titre/SKU - hauteur fixe */}
        <div className="flex-none">
          <h3 className="font-semibold text-sm text-gray-900 h-10 line-clamp-2 mb-1">
            {product.name}
          </h3>
          <p className="text-xs text-gray-600 h-5 mb-3">SKU: {product.sku}</p>
        </div>

        {/* Zone prix/attributs - hauteur flexible */}
        <div className="flex-1 space-y-2 overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700">💰 Prix d'achat</span>
            <span className="text-sm font-medium">{product.cost_price || '0'} €</span>
          </div>

          {/* Attributs et poids */}
          <div className="border-t pt-2 mt-2 space-y-2">
            {/* Attributs en lecture seule (labels français) */}
            {attributesDisplay.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Attributs:</p>
                <div className="flex flex-wrap gap-1">
                  {attributesDisplay.map((attr, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {attr.value}
                    </Badge>
                  ))}
                  {/* Poids affiché avec les attributs */}
                  {product.weight && (
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                      ⚖️ {product.weight} kg
                    </Badge>
                  )}
                  {/* Fournisseur individuel (si groupe SANS fournisseur commun) */}
                  {!hasCommonSupplier && product.supplier && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      🏢 {product.supplier.name}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zone boutons - hauteur fixe toujours visible */}
        <div className="flex-none space-y-2 mt-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="default"
              size="sm"
              className="bg-black text-white hover:bg-gray-800"
              onClick={() => onEdit(product)}
            >
              <Edit3 className="w-4 h-4 mr-1" />
              Modifier
            </Button>
            <ProductDuplicateButton
              product={product}
              variantType={variantType}
              onSuccess={onDuplicate}
              variant="outline"
              size="sm"
              showLabel={true}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => router.push(`/catalogue/${product.id}`)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Voir détails
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function VariantGroupDetailPage({ params }: VariantGroupDetailPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { groupId } = use(params)
  const { variantGroup, loading, error } = useVariantGroup(groupId)
  const { removeProductFromGroup, updateVariantGroup, createProductInGroup, updateProductInGroup, refetch } = useVariantGroups()
  const { updateProductVariantAttribute } = useProductVariantEditing()

  // États pour modals
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddProductsModal, setShowAddProductsModal] = useState(false)
  const [showCreateProductModal, setShowCreateProductModal] = useState(false)
  const [showEditProductModal, setShowEditProductModal] = useState(false)
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<VariantProduct | null>(null)

  // États pour édition inline
  const [editingName, setEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [savingName, setSavingName] = useState(false)

  const [editingType, setEditingType] = useState(false)
  const [editedType, setEditedType] = useState<'color' | 'size' | 'material' | 'pattern'>('color')
  const [savingType, setSavingType] = useState(false)

  // 🔧 SOLUTION DÉFINITIVE: Ref pour tracker si on doit afficher le toast
  const pendingToastRef = useRef(false)

  // 🔧 useEffect pour afficher le toast APRÈS le refetch complet
  useEffect(() => {
    if (pendingToastRef.current && variantGroup && !loading) {
      pendingToastRef.current = false
      toast({
        title: "Produit mis à jour",
        description: "Les modifications ont été enregistrées avec succès"
      })
    }
  }, [variantGroup, loading, toast])

  const handleEditGroup = useCallback(() => {
    setShowEditModal(true)
  }, [])

  const handleAddProducts = useCallback(() => {
    setShowAddProductsModal(true)
  }, [])

  const handleCreateProduct = useCallback(() => {
    setShowCreateProductModal(true)
  }, [])

  const handleCreateProductSubmit = useCallback(async (variantValue: string) => {
    if (!variantGroup) return false
    return await createProductInGroup(groupId, variantValue, variantGroup.variant_type || 'color')
  }, [groupId, variantGroup, createProductInGroup])

  const handleRemoveProduct = useCallback(async (productId: string, productName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer "${productName}" de ce groupe ?`)) return

    const result = await removeProductFromGroup(productId)
    if (result) {
      toast({
        title: "Produit retiré",
        description: `"${productName}" a été retiré du groupe`
      })
      // Recharger la page pour actualiser les données
      window.location.reload()
    }
  }, [removeProductFromGroup, toast])

  const handleModalSubmit = () => {
    setShowEditModal(false)
    setShowAddProductsModal(false)
    // Recharger la page pour actualiser les données
    window.location.reload()
  }

  // Édition inline du nom
  const handleStartEditName = useCallback(() => {
    setEditedName(variantGroup?.name || '')
    setEditingName(true)
  }, [variantGroup?.name])

  const handleSaveName = useCallback(async () => {
    if (!editedName.trim() || editedName === variantGroup?.name) {
      setEditingName(false)
      return
    }

    setSavingName(true)
    const success = await updateVariantGroup(groupId, { name: editedName.trim() })

    if (success) {
      window.location.reload()
    }
    setSavingName(false)
  }, [editedName, groupId, variantGroup?.name, updateVariantGroup])

  const handleCancelEditName = useCallback(() => {
    setEditingName(false)
    setEditedName('')
  }, [])

  // Édition inline du type
  const handleStartEditType = useCallback(() => {
    setEditedType(variantGroup?.variant_type || 'color')
    setEditingType(true)
  }, [variantGroup?.variant_type])

  const handleSaveType = useCallback(async (newType: 'color' | 'size' | 'material' | 'pattern') => {
    if (newType === variantGroup?.variant_type) {
      setEditingType(false)
      return
    }

    setSavingType(true)
    const success = await updateVariantGroup(groupId, { variant_type: newType })

    if (success) {
      window.location.reload()
    }
    setSavingType(false)
  }, [groupId, variantGroup?.variant_type, updateVariantGroup])

  const handleCancelEditType = useCallback(() => {
    setEditingType(false)
  }, [])

  // Édition du produit (modal unifié)
  const handleEditProduct = useCallback((product: VariantProduct) => {
    setSelectedProductForEdit(product)
    setShowEditProductModal(true)
  }, [])

  const handleCloseEditProductModal = useCallback(() => {
    setShowEditProductModal(false)
    setSelectedProductForEdit(null)
  }, [])

  const handleProductUpdated = useCallback(async () => {
    // 🎯 SOLUTION DÉFINITIVE React-Safe:
    // 1. Modal se ferme (onClose) et démonte ses composants
    // 2. Ce callback est appelé
    // 3. On active le flag pour le toast
    // 4. On refetch les données
    // 5. Le useEffect détecte le changement de variantGroup + flag actif
    // 6. Le toast s'affiche APRÈS que React ait terminé tous les rendus

    // Activer le flag AVANT le refetch
    pendingToastRef.current = true

    // Refetch les données (va déclencher le useEffect)
    await refetch()
  }, [refetch])

  // Duplication d'un produit
  const handleDuplicateProduct = useCallback(async (newProduct: any) => {
    // Afficher toast de succès
    toast({
      title: "✅ Produit dupliqué",
      description: `${newProduct.name} a été créé avec succès`,
      duration: 3000
    })

    // Refetch pour afficher le nouveau produit
    await refetch()

    // Scroll vers le nouveau produit après un court délai
    setTimeout(() => {
      const element = document.getElementById(`product-${newProduct.id}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 300)
  }, [refetch, toast])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !variantGroup) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Groupe de variantes introuvable
          </h2>
          <p className="text-gray-600">
            {error || "Ce groupe n'existe pas ou a été supprimé."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <div className="flex items-center gap-3">
              {getVariantTypeIcon(variantGroup.variant_type)}
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onBlur={handleSaveName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName()
                      if (e.key === 'Escape') handleCancelEditName()
                    }}
                    disabled={savingName}
                    className="text-2xl font-bold h-10"
                    autoFocus
                  />
                  {savingName && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-2xl font-bold text-gray-900">{variantGroup.name}</h1>
                  <button
                    onClick={handleStartEditName}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                    title="Modifier le nom"
                  >
                    <Edit3 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-gray-600 text-sm mt-1">
              Type: {formatVariantType(variantGroup.variant_type)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditGroup}
            className="flex items-center"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Modifier les informations
          </Button>
          <Button
            size="sm"
            onClick={handleCreateProduct}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer un produit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddProducts}
            className="flex items-center"
          >
            <Package className="w-4 h-4 mr-2" />
            Importer existants
          </Button>
        </div>
      </div>

      {/* Informations du groupe */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{variantGroup.product_count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Type</CardTitle>
            {getVariantTypeIcon(variantGroup.variant_type)}
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {formatVariantType(variantGroup.variant_type)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créé</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {new Date(variantGroup.created_at).toLocaleDateString('fr-FR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modifié</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {new Date(variantGroup.updated_at).toLocaleDateString('fr-FR')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informations du groupe avec édition inline */}
      <Card className="p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Informations du groupe</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Catégorisation */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Catégorisation
            </label>
            {variantGroup.subcategory ? (
              <p className="text-sm text-gray-900">
                <span className="font-medium">{variantGroup.subcategory.category?.family?.name}</span>
                {' → '}
                <span className="font-medium">{variantGroup.subcategory.category?.name}</span>
                {' → '}
                <span className="font-medium">{variantGroup.subcategory.name}</span>
              </p>
            ) : (
              <p className="text-sm text-gray-500">Non définie</p>
            )}
          </div>

          {/* Type de variante */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Type de variante
            </label>
            {editingType ? (
              <div className="flex items-center gap-2">
                <select
                  value={editedType}
                  onChange={(e) => {
                    const newType = e.target.value as 'color' | 'size' | 'material' | 'pattern'
                    setEditedType(newType)
                    handleSaveType(newType)
                  }}
                  disabled={savingType}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                  autoFocus
                >
                  <option value="color">Couleur</option>
                  <option value="size">Taille</option>
                  <option value="material">Matériau</option>
                  <option value="pattern">Motif</option>
                </select>
                {savingType && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                )}
                <button
                  onClick={handleCancelEditType}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={savingType}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                {getVariantTypeIcon(variantGroup.variant_type)}
                <span className="text-sm text-gray-900 font-medium">
                  {formatVariantType(variantGroup.variant_type)}
                </span>
                <button
                  onClick={handleStartEditType}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                  title="Modifier le type"
                >
                  <Edit3 className="w-3 h-3 text-gray-600" />
                </button>
              </div>
            )}
          </div>

          {/* Dimensions si présentes */}
          {variantGroup.dimensions_length && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Dimensions
              </label>
              <p className="text-sm text-gray-900">
                {variantGroup.dimensions_length} × {variantGroup.dimensions_width} × {variantGroup.dimensions_height} {variantGroup.dimensions_unit}
              </p>
            </div>
          )}


          {/* Style décoratif */}
          {variantGroup.style && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Style décoratif
              </label>
              <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                🎨 {formatStyle(variantGroup.style)}
              </Badge>
            </div>
          )}

          {/* Pièces compatibles */}
          {variantGroup.suitable_rooms && variantGroup.suitable_rooms.length > 0 && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Pièces compatibles
              </label>
              <div className="flex flex-wrap gap-2">
                {variantGroup.suitable_rooms.map((room, index) => (
                  <Badge key={index} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    <Home className="h-3 w-3 mr-1" />
                    {room}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Fournisseur commun */}
          {variantGroup.has_common_supplier && variantGroup.supplier && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Fournisseur commun
              </label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  🏢 {variantGroup.supplier.name}
                </Badge>
                <span className="text-xs text-gray-600">
                  (appliqué automatiquement à tous les produits du groupe)
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Liste des produits */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Produits du groupe ({variantGroup.products?.length || 0})
        </h2>

        {variantGroup.products && variantGroup.products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
            {variantGroup.products.map((product) => (
              <VariantProductCard
                key={product.id}
                product={product}
                variantType={variantGroup.variant_type}
                hasCommonSupplier={variantGroup.has_common_supplier || false}
                onRemove={handleRemoveProduct}
                onEdit={handleEditProduct}
                onDuplicate={handleDuplicateProduct}
                router={router}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun produit
            </h3>
            <p className="text-gray-600 mb-4">
              Ce groupe ne contient pas encore de produits.
            </p>
            <Button
              onClick={handleAddProducts}
              className="bg-black text-white hover:bg-gray-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter des produits
            </Button>
          </div>
        )}
      </div>

      {/* Modal édition */}
      {showEditModal && variantGroup && (
        <VariantGroupEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={(groupId, data) => updateVariantGroup(groupId, data)}
          group={variantGroup}
        />
      )}

      {/* Modal ajout produits existants */}
      {showAddProductsModal && variantGroup && (
        <AddProductsToGroupModal
          isOpen={showAddProductsModal}
          onClose={() => setShowAddProductsModal(false)}
          variantGroup={variantGroup}
          onProductsAdded={handleModalSubmit}
        />
      )}

      {/* Modal création nouveau produit */}
      {showCreateProductModal && variantGroup && (
        <CreateProductInGroupModal
          isOpen={showCreateProductModal}
          onClose={() => setShowCreateProductModal(false)}
          variantGroup={variantGroup}
          onProductCreated={handleModalSubmit}
          onCreateProduct={handleCreateProductSubmit}
        />
      )}

      {/* Modal édition produit unifié */}
      {showEditProductModal && selectedProductForEdit && variantGroup && (
        <EditProductVariantModal
          isOpen={showEditProductModal}
          onClose={handleCloseEditProductModal}
          product={selectedProductForEdit}
          variantGroup={variantGroup}
          onSuccess={handleProductUpdated}
        />
      )}
    </div>
  )
}