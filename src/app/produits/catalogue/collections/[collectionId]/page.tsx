'use client'

import { use, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Eye, Package, Calendar, Users, Plus, X, Globe, ShoppingCart, Share2, Link2, Edit3, Tag } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useCollection, useCollections } from '@/hooks/use-collections'
import Image from 'next/image'
import { COLLECTION_STYLE_OPTIONS, type CollectionStyle } from '@/types/collections'
import { CollectionProductsModal } from '@/components/business/collection-products-modal'
import { RoomMultiSelect } from '@/components/ui/room-multi-select'
import type { RoomType } from '@/types/room-types'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface CollectionDetailPageProps {
  params: Promise<{
    collectionId: string
  }>
}

// Composant pour carte produit de collection (adapté de VariantProductCard)
interface CollectionProductCardProps {
  product: any
  position?: number
  onRemove: (id: string, name: string) => void
  router: any
}

function CollectionProductCard({
  product,
  position,
  onRemove,
  router
}: CollectionProductCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
      {/* Image compacte */}
      <div className="relative w-full h-32 bg-gray-50 flex-shrink-0">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
        )}
        {/* Badge position si présent */}
        {position !== undefined && (
          <div className="absolute top-1.5 left-1.5">
            <Badge className="bg-black text-white text-[10px] px-1.5 py-0.5">
              #{position}
            </Badge>
          </div>
        )}
        {/* Bouton retirer - petit */}
        <button
          onClick={() => onRemove(product.id, product.name)}
          className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity hover:bg-red-600"
          title={`Retirer ${product.name}`}
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Contenu compact */}
      <div className="p-3 flex-1 flex flex-col">
        {/* Nom + SKU compacts */}
        <div className="flex-none mb-2">
          <h3 className="font-semibold text-xs text-gray-900 line-clamp-2 mb-0.5">
            {product.name}
          </h3>
          <p className="text-[10px] text-gray-500">SKU: {product.sku}</p>
        </div>

        {/* Prix compact */}
        <div className="flex-none mb-2">
          <div className="text-sm font-semibold text-black">
            {product.cost_price ? `${product.cost_price.toFixed(2)} €` : 'N/A'}
          </div>
        </div>

        {/* Bouton Détails */}
        <div className="flex-none mt-auto">
          <ButtonV2
            variant="outline"
            size="sm"
            className="text-[10px] h-7 w-full px-1"
            onClick={() => router.push(`/catalogue/${product.id}`)}
          >
            <Eye className="w-3 h-3 mr-1" />
            Détails
          </ButtonV2>
        </div>
      </div>
    </div>
  )
}

export default function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { collectionId } = use(params)
  const { collection, loading, error, refetch } = useCollection(collectionId)
  const { removeProductFromCollection, updateCollection } = useCollections()
  const [showManageProductsModal, setShowManageProductsModal] = useState(false)

  // États édition inline - nom
  const [editingName, setEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [savingName, setSavingName] = useState(false)

  // États édition inline - description
  const [editingDescription, setEditingDescription] = useState(false)
  const [editedDescription, setEditedDescription] = useState('')
  const [savingDescription, setSavingDescription] = useState(false)

  // États édition inline - style
  const [editingStyle, setEditingStyle] = useState(false)
  const [editedStyle, setEditedStyle] = useState<CollectionStyle | null>(null)
  const [savingStyle, setSavingStyle] = useState(false)

  // États édition inline - pièces
  const [editingRooms, setEditingRooms] = useState(false)
  const [editedRooms, setEditedRooms] = useState<string[]>([])
  const [savingRooms, setSavingRooms] = useState(false)

  // États édition inline - tags
  const [editingTags, setEditingTags] = useState(false)
  const [editedTags, setEditedTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [savingTags, setSavingTags] = useState(false)

  // États édition inline - meta title
  const [editingMetaTitle, setEditingMetaTitle] = useState(false)
  const [editedMetaTitle, setEditedMetaTitle] = useState('')
  const [savingMetaTitle, setSavingMetaTitle] = useState(false)

  // États édition inline - meta description
  const [editingMetaDescription, setEditingMetaDescription] = useState(false)
  const [editedMetaDescription, setEditedMetaDescription] = useState('')
  const [savingMetaDescription, setSavingMetaDescription] = useState(false)

  const handleRemoveProduct = useCallback(async (productId: string, productName: string) => {
    const confirmed = window.confirm(`Voulez-vous retirer "${productName}" de cette collection ?`)
    if (!confirmed) return

    const success = await removeProductFromCollection(collectionId, productId)
    if (success) {
      toast({
        title: "Produit retiré",
        description: `"${productName}" a été retiré de la collection`,
      })
      refetch()
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de retirer le produit",
        variant: "destructive"
      })
    }
  }, [collectionId, removeProductFromCollection, toast, refetch])

  const handleManageProducts = useCallback(() => {
    setShowManageProductsModal(true)
  }, [])

  // Handlers édition inline - Nom
  const handleStartEditName = useCallback(() => {
    setEditedName(collection?.name || '')
    setEditingName(true)
  }, [collection?.name])

  const handleSaveName = useCallback(async () => {
    if (!editedName.trim() || editedName === collection?.name) {
      setEditingName(false)
      return
    }

    setSavingName(true)
    const success = await updateCollection({ id: collectionId, name: editedName.trim() })

    if (success) {
      toast({ title: "Nom modifié", description: "Le nom a été mis à jour" })
      await refetch()
      setEditingName(false)
    }
    setSavingName(false)
  }, [editedName, collection?.name, collectionId, updateCollection, toast, refetch])

  const handleCancelEditName = useCallback(() => {
    setEditingName(false)
    setEditedName('')
  }, [])

  // Handlers édition inline - Description
  const handleStartEditDescription = useCallback(() => {
    setEditedDescription(collection?.description || '')
    setEditingDescription(true)
  }, [collection?.description])

  const handleSaveDescription = useCallback(async () => {
    if (editedDescription === collection?.description) {
      setEditingDescription(false)
      return
    }

    setSavingDescription(true)
    const success = await updateCollection({ id: collectionId, description: editedDescription || null })

    if (success) {
      toast({ title: "Description modifiée", description: "La description a été mise à jour" })
      await refetch()
      setEditingDescription(false)
    }
    setSavingDescription(false)
  }, [editedDescription, collection?.description, collectionId, updateCollection, toast, refetch])

  const handleCancelEditDescription = useCallback(() => {
    setEditingDescription(false)
    setEditedDescription('')
  }, [])

  // Handlers édition inline - Style
  const handleStartEditStyle = useCallback(() => {
    setEditedStyle(collection?.style || null)
    setEditingStyle(true)
  }, [collection?.style])

  const handleSelectStyle = useCallback(async (style: CollectionStyle | null) => {
    setEditedStyle(style)
    setSavingStyle(true)

    const success = await updateCollection({ id: collectionId, style })

    if (success) {
      toast({ title: "Style modifié", description: "Le style a été mis à jour" })
      await refetch()
      setEditingStyle(false)
    }
    setSavingStyle(false)
  }, [collectionId, updateCollection, toast, refetch])

  const handleCancelEditStyle = useCallback(() => {
    setEditingStyle(false)
    setEditedStyle(null)
  }, [])

  // Handlers édition inline - Pièces compatibles
  const handleStartEditRooms = useCallback(() => {
    setEditedRooms(collection?.suitable_rooms || [])
    setEditingRooms(true)
  }, [collection?.suitable_rooms])

  const handleSaveRooms = useCallback(async () => {
    setSavingRooms(true)

    const success = await updateCollection({ id: collectionId, suitable_rooms: editedRooms })

    if (success) {
      toast({ title: "Pièces modifiées", description: "Les pièces compatibles ont été mises à jour" })
      await refetch()
      setEditingRooms(false)
    }
    setSavingRooms(false)
  }, [editedRooms, collectionId, updateCollection, toast, refetch])

  const handleCancelEditRooms = useCallback(() => {
    setEditingRooms(false)
    setEditedRooms([])
  }, [])

  // Handlers édition inline - Tags
  const handleStartEditTags = useCallback(() => {
    setEditedTags(collection?.theme_tags || [])
    setEditingTags(true)
  }, [collection?.theme_tags])

  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !editedTags.includes(newTag.trim())) {
      setEditedTags([...editedTags, newTag.trim()])
      setNewTag('')
    }
  }, [newTag, editedTags])

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setEditedTags(editedTags.filter(t => t !== tagToRemove))
  }, [editedTags])

  const handleSaveTags = useCallback(async () => {
    setSavingTags(true)

    const success = await updateCollection({ id: collectionId, theme_tags: editedTags })

    if (success) {
      toast({ title: "Tags modifiés", description: "Les tags ont été mis à jour" })
      await refetch()
      setEditingTags(false)
    }
    setSavingTags(false)
  }, [editedTags, collectionId, updateCollection, toast, refetch])

  const handleCancelEditTags = useCallback(() => {
    setEditingTags(false)
    setEditedTags([])
    setNewTag('')
  }, [])

  // Handlers édition inline - Meta Title
  const handleStartEditMetaTitle = useCallback(() => {
    setEditedMetaTitle(collection?.meta_title || '')
    setEditingMetaTitle(true)
  }, [collection?.meta_title])

  const handleSaveMetaTitle = useCallback(async () => {
    setSavingMetaTitle(true)

    const success = await updateCollection({ id: collectionId, meta_title: editedMetaTitle || null })

    if (success) {
      toast({ title: "Meta title modifié", description: "Le titre SEO a été mis à jour" })
      await refetch()
      setEditingMetaTitle(false)
    }
    setSavingMetaTitle(false)
  }, [editedMetaTitle, collectionId, updateCollection, toast, refetch])

  const handleCancelEditMetaTitle = useCallback(() => {
    setEditingMetaTitle(false)
    setEditedMetaTitle('')
  }, [])

  // Handlers édition inline - Meta Description
  const handleStartEditMetaDescription = useCallback(() => {
    setEditedMetaDescription(collection?.meta_description || '')
    setEditingMetaDescription(true)
  }, [collection?.meta_description])

  const handleSaveMetaDescription = useCallback(async () => {
    setSavingMetaDescription(true)

    const success = await updateCollection({ id: collectionId, meta_description: editedMetaDescription || null })

    if (success) {
      toast({ title: "Meta description modifiée", description: "La description SEO a été mise à jour" })
      await refetch()
      setEditingMetaDescription(false)
    }
    setSavingMetaDescription(false)
  }, [editedMetaDescription, collectionId, updateCollection, toast, refetch])

  const handleCancelEditMetaDescription = useCallback(() => {
    setEditingMetaDescription(false)
    setEditedMetaDescription('')
  }, [])

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

  if (error || !collection) {
    return (
      <div className="container mx-auto px-4 py-6">
        <ButtonV2
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Retour
        </ButtonV2>
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Collection introuvable
          </h2>
          <p className="text-gray-600">
            {error || "Cette collection n'existe pas ou a été supprimée."}
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
          <ButtonV2
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Retour
          </ButtonV2>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{collection.name}</h1>
            <p className="text-gray-600 text-sm">
              {collection.description || 'Aucune description'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={collection.is_active ? 'secondary' : 'secondary'}>
            {collection.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant={collection.visibility === 'public' ? 'secondary' : 'outline'}>
            {collection.visibility === 'public' ? 'Publique' : 'Privée'}
          </Badge>
          {collection.style && (
            <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
              {COLLECTION_STYLE_OPTIONS.find(s => s.value === collection.style)?.label}
            </Badge>
          )}
        </div>
      </div>

      {/* Informations de la collection */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collection.product_count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partages</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collection.shared_count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créée</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {new Date(collection.created_at).toLocaleDateString('fr-FR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modifiée</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {new Date(collection.updated_at).toLocaleDateString('fr-FR')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card compacte avec édition inline - Pattern 2025 comme Variantes */}
      <Card className="p-6 mb-8">
        <h3 className="text-lg font-semibold mb-6">Informations de la collection</h3>

        {/* GROUPE 1: Informations générales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-gray-100">
          {/* Nom */}
          <div>
            <Label className="text-sm font-medium text-gray-700 block mb-2">Nom de la collection</Label>
            {editingName ? (
              <div className="space-y-2">
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
                  className="border-black focus:ring-black"
                  autoFocus
                />
                {savingName && <div className="text-xs text-gray-500">Enregistrement...</div>}
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <p className="text-sm text-gray-900">{collection.name}</p>
                <button
                  onClick={handleStartEditName}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                  title="Modifier le nom"
                >
                  <Edit3 className="h-3 w-3 text-gray-600" />
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="md:col-span-3">
            <Label className="text-sm font-medium text-gray-700 block mb-2">Description</Label>
            {editingDescription ? (
              <div className="space-y-2">
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  onBlur={handleSaveDescription}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') handleCancelEditDescription()
                  }}
                  disabled={savingDescription}
                  className="border-black focus:ring-black resize-none"
                  rows={2}
                  autoFocus
                />
                {savingDescription && <div className="text-xs text-gray-500">Enregistrement...</div>}
                <p className="text-xs text-gray-500">{editedDescription.length} caractères</p>
              </div>
            ) : (
              <div className="flex items-start gap-2 group">
                <p className="text-sm text-gray-600 flex-1">
                  {collection.description || <span className="text-gray-400 italic">Aucune description</span>}
                </p>
                <button
                  onClick={handleStartEditDescription}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded flex-shrink-0"
                  title="Modifier la description"
                >
                  <Edit3 className="h-3 w-3 text-gray-600" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* GROUPE 2: Style & Catégorisation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-6 border-b border-gray-100">
          {/* Style décoratif */}
          <div className="md:col-span-2">
            <Label className="text-sm font-medium text-gray-700 block mb-2">Style décoratif</Label>
            {editingStyle ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {COLLECTION_STYLE_OPTIONS.map((styleOption) => (
                    <button
                      key={styleOption.value}
                      type="button"
                      onClick={() => handleSelectStyle(editedStyle === styleOption.value ? null : styleOption.value)}
                      disabled={savingStyle}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-lg border-2 text-center transition-all",
                        editedStyle === styleOption.value
                          ? "border-black bg-black text-white shadow-md"
                          : "border-gray-300 hover:border-gray-400 hover:shadow-sm"
                      )}
                    >
                      <div className="text-2xl mb-1">
                        {styleOption.value === 'minimaliste' && '⬜'}
                        {styleOption.value === 'contemporain' && '🏙️'}
                        {styleOption.value === 'moderne' && '🚀'}
                        {styleOption.value === 'scandinave' && '🌲'}
                        {styleOption.value === 'industriel' && '⚙️'}
                        {styleOption.value === 'classique' && '👑'}
                        {styleOption.value === 'boheme' && '🌺'}
                        {styleOption.value === 'art_deco' && '💎'}
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium text-xs">{styleOption.label}</div>
                        <div className={cn(
                          "text-xs",
                          editedStyle === styleOption.value ? "text-gray-200" : "text-gray-500"
                        )}>
                          {styleOption.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {savingStyle && <div className="text-xs text-gray-500">Enregistrement...</div>}
                <ButtonV2
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEditStyle}
                  disabled={savingStyle}
                >
                  <X className="h-3 w-3 mr-1" />
                  Annuler
                </ButtonV2>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                {collection.style ? (
                  <Badge variant="outline" className="px-3 py-1">
                    <span className="mr-2">
                      {collection.style === 'minimaliste' && '⬜'}
                      {collection.style === 'contemporain' && '🏙️'}
                      {collection.style === 'moderne' && '🚀'}
                      {collection.style === 'scandinave' && '🌲'}
                      {collection.style === 'industriel' && '⚙️'}
                      {collection.style === 'classique' && '👑'}
                      {collection.style === 'boheme' && '🌺'}
                      {collection.style === 'art_deco' && '💎'}
                    </span>
                    {COLLECTION_STYLE_OPTIONS.find(s => s.value === collection.style)?.label}
                  </Badge>
                ) : (
                  <span className="text-sm text-gray-400 italic">Aucun style sélectionné</span>
                )}
                <button
                  onClick={handleStartEditStyle}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                  title="Modifier le style"
                >
                  <Edit3 className="h-3 w-3 text-gray-600" />
                </button>
              </div>
            )}
          </div>

          {/* Pièces compatibles */}
          <div>
            <Label className="text-sm font-medium text-gray-700 block mb-2">Pièces compatibles</Label>
            {editingRooms ? (
              <div className="space-y-3">
                <RoomMultiSelect
                  value={(editedRooms || []) as RoomType[]}
                  onChange={(rooms) => setEditedRooms(rooms)}
                  placeholder="Sélectionner les pièces compatibles..."
                  className="w-full"
                />
                {editedRooms && editedRooms.length > 0 && (
                  <p className="text-xs text-gray-600">
                    {editedRooms.length} pièce{editedRooms.length > 1 ? 's' : ''} sélectionnée{editedRooms.length > 1 ? 's' : ''}
                  </p>
                )}
                {savingRooms && <div className="text-xs text-gray-500">Enregistrement...</div>}
                <div className="flex gap-2">
                  <ButtonV2
                    size="sm"
                    onClick={handleSaveRooms}
                    disabled={savingRooms}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    Enregistrer
                  </ButtonV2>
                  <ButtonV2
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEditRooms}
                    disabled={savingRooms}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Annuler
                  </ButtonV2>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 group">
                <div className="flex-1">
                  {collection.suitable_rooms && collection.suitable_rooms.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {collection.suitable_rooms.map((room) => (
                        <Badge key={room} variant="secondary">
                          {room}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Aucune pièce sélectionnée</span>
                  )}
                </div>
                <button
                  onClick={handleStartEditRooms}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded flex-shrink-0"
                  title="Modifier les pièces"
                >
                  <Edit3 className="h-3 w-3 text-gray-600" />
                </button>
              </div>
            )}
          </div>

          {/* Tags thématiques */}
          <div>
            <Label className="text-sm font-medium text-gray-700 block mb-2">Tags thématiques</Label>
            {editingTags ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    placeholder="Ex: Eco-responsable, Petit espace..."
                  />
                  <ButtonV2
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </ButtonV2>
                </div>
                {editedTags && editedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editedTags.map((tag) => (
                      <Badge key={tag} variant="outline" className="pl-2 pr-1">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {savingTags && <div className="text-xs text-gray-500">Enregistrement...</div>}
                <div className="flex gap-2">
                  <ButtonV2
                    size="sm"
                    onClick={handleSaveTags}
                    disabled={savingTags}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    Enregistrer
                  </ButtonV2>
                  <ButtonV2
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEditTags}
                    disabled={savingTags}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Annuler
                  </ButtonV2>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 group">
                <div className="flex-1">
                  {collection.theme_tags && collection.theme_tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {collection.theme_tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="pl-2 pr-2">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Aucun tag défini</span>
                  )}
                </div>
                <button
                  onClick={handleStartEditTags}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded flex-shrink-0"
                  title="Modifier les tags"
                >
                  <Edit3 className="h-3 w-3 text-gray-600" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* GROUPE 3: SEO & Métadonnées */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          {/* Meta title */}
          <div>
            <Label className="text-sm font-medium text-gray-700 block mb-2">Titre SEO</Label>
            {editingMetaTitle ? (
              <div className="space-y-2">
                <Input
                  value={editedMetaTitle}
                  onChange={(e) => setEditedMetaTitle(e.target.value)}
                  onBlur={handleSaveMetaTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveMetaTitle()
                    if (e.key === 'Escape') handleCancelEditMetaTitle()
                  }}
                  disabled={savingMetaTitle}
                  maxLength={60}
                  className="border-black focus:ring-black"
                  placeholder="Titre optimisé pour les moteurs de recherche"
                  autoFocus
                />
                <p className="text-xs text-gray-500">{editedMetaTitle.length}/60 caractères</p>
                {savingMetaTitle && <div className="text-xs text-gray-500">Enregistrement...</div>}
              </div>
            ) : (
              <div className="flex items-start gap-2 group">
                <p className="text-sm text-gray-600 flex-1">
                  {collection.meta_title || <span className="text-gray-400 italic">Non défini</span>}
                </p>
                <button
                  onClick={handleStartEditMetaTitle}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded flex-shrink-0"
                  title="Modifier le titre SEO"
                >
                  <Edit3 className="h-3 w-3 text-gray-600" />
                </button>
              </div>
            )}
          </div>

          {/* Meta description */}
          <div>
            <Label className="text-sm font-medium text-gray-700 block mb-2">Description SEO</Label>
            {editingMetaDescription ? (
              <div className="space-y-2">
                <Textarea
                  value={editedMetaDescription}
                  onChange={(e) => setEditedMetaDescription(e.target.value)}
                  onBlur={handleSaveMetaDescription}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') handleCancelEditMetaDescription()
                  }}
                  disabled={savingMetaDescription}
                  maxLength={160}
                  className="border-black focus:ring-black resize-none"
                  placeholder="Description optimisée pour les moteurs de recherche"
                  rows={2}
                  autoFocus
                />
                <p className="text-xs text-gray-500">{editedMetaDescription.length}/160 caractères</p>
                {savingMetaDescription && <div className="text-xs text-gray-500">Enregistrement...</div>}
              </div>
            ) : (
              <div className="flex items-start gap-2 group">
                <p className="text-sm text-gray-600 flex-1">
                  {collection.meta_description || <span className="text-gray-400 italic">Non définie</span>}
                </p>
                <button
                  onClick={handleStartEditMetaDescription}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded flex-shrink-0"
                  title="Modifier la description SEO"
                >
                  <Edit3 className="h-3 w-3 text-gray-600" />
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Section Partage & Distribution */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Share2 className="h-5 w-5 mr-2" />
            Partage & Distribution
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Paramètres de partage et intégration avec les canaux de vente (fonctionnalité à venir)
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* État actuel du partage */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Visibilité actuelle</div>
              <Badge variant={collection.visibility === 'public' ? 'secondary' : 'outline'} className="mt-1">
                {collection.visibility === 'public' ? 'Publique' : 'Privée'}
              </Badge>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Lien de partage</div>
              <div className="flex items-center mt-1">
                {collection.shared_link_token ? (
                  <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                    <Link2 className="h-3 w-3 mr-1" />
                    Généré
                  </Badge>
                ) : (
                  <span className="text-sm text-gray-500">Non généré</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Nombre de partages</div>
              <div className="text-2xl font-bold text-black mt-1">{collection.shared_count || 0}</div>
            </div>
          </div>

          {/* Canaux de distribution futurs */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Canaux de distribution disponibles</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <ButtonV2
                variant="outline"
                disabled
                className="h-auto py-4 cursor-not-allowed opacity-50 flex flex-col items-center justify-center space-y-2"
              >
                <Globe className="h-6 w-6" />
                <div className="text-sm font-medium">Site Web Vérone</div>
                <Badge variant="secondary" className="text-xs">Bientôt disponible</Badge>
              </ButtonV2>

              <ButtonV2
                variant="outline"
                disabled
                className="h-auto py-4 cursor-not-allowed opacity-50 flex flex-col items-center justify-center space-y-2"
              >
                <ShoppingCart className="h-6 w-6" />
                <div className="text-sm font-medium">Google Merchant</div>
                <Badge variant="secondary" className="text-xs">Bientôt disponible</Badge>
              </ButtonV2>

              <ButtonV2
                variant="outline"
                disabled
                className="h-auto py-4 cursor-not-allowed opacity-50 flex flex-col items-center justify-center space-y-2"
              >
                <Share2 className="h-6 w-6" />
                <div className="text-sm font-medium">Autres canaux</div>
                <Badge variant="secondary" className="text-xs">Bientôt disponible</Badge>
              </ButtonV2>
            </div>
            <p className="text-xs text-gray-500 mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
              💡 Ces options seront activées lors du développement des interfaces de vente et de leur connexion au back-office Vérone.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Produits de la collection - Grille de cartes */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Produits de la collection ({collection.products?.length || 0})
          </h2>
          <ButtonV2 
            onClick={handleManageProducts}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter des produits
          </ButtonV2>
        </div>

        {collection.products && collection.products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 auto-rows-fr">
            {collection.products.map((product) => (
              <CollectionProductCard
                key={product.id}
                product={product}
                position={product.position}
                onRemove={handleRemoveProduct}
                router={router}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun produit
            </h3>
            <p className="text-gray-600 mb-4">
              Cette collection ne contient pas encore de produits.
            </p>
            <ButtonV2 
              onClick={handleManageProducts} 
              className="bg-black text-white hover:bg-gray-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter des produits
            </ButtonV2>
          </div>
        )}
      </div>

      {/* Modal gestion produits */}
      {showManageProductsModal && collection && (
        <CollectionProductsModal
          isOpen={showManageProductsModal}
          onClose={() => {
            setShowManageProductsModal(false)
            refetch()
          }}
          onUpdate={() => {
            refetch()
          }}
          collection={collection}
        />
      )}
    </div>
  )
}
