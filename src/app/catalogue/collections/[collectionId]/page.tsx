/**
 * 📋 Page Détail Collection - Vérone Back Office 2025
 *
 * Inspirée du style consultations clients avec mise en page catalogue
 * Affichage complet collection + produits associés
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Share2, Eye, EyeOff, Plus, Grid, List, Download, Calendar, Package, Home, Palette, Tag, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useCollections } from '@/hooks/use-collections'
import { ProductSelectorModal } from '@/components/business/product-selector-modal'
import {
  CollectionWithProducts,
  CollectionProduct,
  COLLECTION_STYLE_OPTIONS,
  ROOM_CATEGORY_OPTIONS,
  getPrimaryImageUrl,
  formatCollectionProduct
} from '@/types/collections'

export default function CollectionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const collectionId = params.collectionId as string

  const [collection, setCollection] = useState<CollectionWithProducts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showAddProductModal, setShowAddProductModal] = useState(false)

  const supabase = createClient()
  const { addProductToCollection } = useCollections()

  useEffect(() => {
    const fetchCollection = async () => {
      if (!collectionId) return

      setLoading(true)
      setError(null)

      try {
        // Récupérer la collection avec tous ses détails
        const { data: collectionData, error: collectionError } = await supabase
          .from('collections')
          .select(`
            id,
            name,
            description,
            is_active,
            visibility,
            shared_link_token,
            product_count,
            shared_count,
            last_shared,
            style,
            room_category,
            theme_tags,
            sort_order,
            meta_title,
            meta_description,
            image_url,
            color_theme,
            created_at,
            updated_at,
            created_by
          `)
          .eq('id', collectionId)
          .single()

        if (collectionError) {
          setError(collectionError.message)
          return
        }

        // Récupérer tous les produits de la collection
        const { data: productsData, error: productsError } = await supabase
          .from('collection_products')
          .select(`
            position,
            products (
              id,
              name,
              sku,
              status,
              creation_mode,
              cost_price,
              description,
              product_images (
                id,
                public_url,
                storage_path,
                is_primary,
                display_order,
                image_type,
                alt_text
              )
            )
          `)
          .eq('collection_id', collectionId)
          .order('position', { ascending: true })

        if (productsError) {
          console.error('Erreur produits:', productsError)
        }

        const transformedProducts = (productsData || [])
          .filter(cp => cp.products && cp.products.creation_mode === 'complete')
          .map(cp => formatCollectionProduct({
            ...cp.products,
            position: cp.position,
            added_at: new Date().toISOString()
          }))

        setCollection({
          ...collectionData,
          products: transformedProducts
        })

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    fetchCollection()
  }, [collectionId])

  const getStyleInfo = (style: string | null) => {
    if (!style) return null
    return COLLECTION_STYLE_OPTIONS.find(s => s.value === style)
  }

  const getRoomInfo = (room: string | null) => {
    if (!room) return null
    return ROOM_CATEGORY_OPTIONS.find(r => r.value === room)
  }

  const handleShare = () => {
    // TODO: Implémenter modal de partage
    console.log('Partager collection:', collection?.id)
  }

  const handleEdit = () => {
    // TODO: Implémenter modal d'édition
    console.log('Modifier collection:', collection?.id)
  }

  const handleAddProduct = () => {
    setShowAddProductModal(true)
  }

  // Gérer l'ajout de produits multiples
  const handleProductsSelect = async (productIds: string[]): Promise<boolean> => {
    try {
      let allSuccessful = true

      // Ajouter chaque produit individuellement pour respecter la logique du hook
      for (const productId of productIds) {
        const success = await addProductToCollection(collectionId, productId)
        if (!success) {
          allSuccessful = false
          console.error(`Erreur lors de l'ajout du produit ${productId}`)
        }
      }

      if (allSuccessful) {
        // Recharger la collection pour voir les nouveaux produits
        await fetchCollection()
      }

      return allSuccessful
    } catch (error) {
      console.error('Erreur lors de l\'ajout des produits:', error)
      return false
    }
  }

  // Obtenir les IDs des produits déjà dans la collection
  const existingProductIds = collection?.products?.map(p => p.id) || []

  const handleToggleStatus = async () => {
    if (!collection) return

    try {
      const { error } = await supabase
        .from('collections')
        .update({
          is_active: !collection.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', collection.id)

      if (error) throw error

      setCollection(prev => prev ? { ...prev, is_active: !prev.is_active } : null)
    } catch (err) {
      console.error('Erreur lors du changement de statut:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-xl p-6 mb-6">
              <div className="h-12 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-600">
                {error || 'Collection non trouvée'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const styleInfo = getStyleInfo(collection.style)
  const roomInfo = getRoomInfo(collection.room_category)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Collections
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                {collection.name}
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
              >
                {collection.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {collection.is_active ? 'Désactiver' : 'Activer'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </Button>
              <Button
                size="sm"
                onClick={handleEdit}
                className="bg-black text-white hover:bg-gray-800"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Informations */}
          <div className="col-span-12 lg:col-span-4">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Informations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Statut et visibilité */}
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={collection.is_active ? "default" : "secondary"}
                    className={collection.is_active ? "bg-black text-white" : ""}
                  >
                    {collection.is_active ? "Actif" : "Inactif"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      collection.visibility === 'public' && "border-green-300 text-green-700 bg-green-50",
                      collection.visibility === 'private' && "border-gray-300 text-gray-700 bg-gray-50",
                      collection.visibility === 'shared' && "border-orange-300 text-orange-700 bg-orange-50"
                    )}
                  >
                    {collection.visibility === 'public' && '🌐 Public'}
                    {collection.visibility === 'private' && '🔒 Privé'}
                    {collection.visibility === 'shared' && '🔗 Partagé'}
                  </Badge>
                </div>

                {/* Description */}
                {collection.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {collection.description}
                    </p>
                  </div>
                )}

                {/* Style et pièce */}
                {(styleInfo || roomInfo) && (
                  <div className="space-y-3">
                    {styleInfo && (
                      <div className="flex items-center space-x-3">
                        <Palette className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-sm">{styleInfo.label}</p>
                          <p className="text-xs text-gray-500">{styleInfo.description}</p>
                        </div>
                      </div>
                    )}
                    {roomInfo && (
                      <div className="flex items-center space-x-3">
                        <Home className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-sm">
                            {roomInfo.icon} {roomInfo.label}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tags */}
                {collection.theme_tags && collection.theme_tags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <Tag className="h-4 w-4 mr-1" />
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {collection.theme_tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Statistiques */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{collection.product_count}</p>
                      <p className="text-xs text-gray-500">Produits</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{collection.shared_count}</p>
                      <p className="text-xs text-gray-500">Partages</p>
                    </div>
                  </div>
                </div>

                {/* Lien de partage */}
                {collection.shared_link_token && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Lien de partage
                    </h4>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs font-mono text-gray-600 truncate">
                        /c/{collection.shared_link_token}
                      </p>
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="border-t pt-4 text-xs text-gray-500 space-y-1">
                  <p className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Créé le {new Date(collection.created_at).toLocaleDateString('fr-FR')}
                  </p>
                  <p>
                    Modifié le {new Date(collection.updated_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contenu principal - Produits */}
          <div className="col-span-12 lg:col-span-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Grid className="h-5 w-5 mr-2" />
                    Produits de la collection
                    <Badge variant="secondary" className="ml-2">
                      {collection.products?.length || 0}
                    </Badge>
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={handleAddProduct}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un produit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {collection.products && collection.products.length > 0 ? (
                  <div className={cn(
                    viewMode === 'grid'
                      ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                      : "space-y-4"
                  )}>
                    {collection.products.map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        viewMode={viewMode}
                        index={index}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucun produit dans cette collection
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Commencez par ajouter des produits à votre collection
                    </p>
                    <Button onClick={handleAddProduct}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un produit
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal Ajout Produit */}
      <ProductSelectorModal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        onProductsSelect={handleProductsSelect}
        collectionName={collection?.name || 'Collection'}
        existingProductIds={existingProductIds}
        loading={loading}
      />
    </div>
  )
}

interface ProductCardProps {
  product: CollectionProduct
  viewMode: 'grid' | 'list'
  index: number
}

function ProductCard({ product, viewMode, index }: ProductCardProps) {
  if (viewMode === 'list') {
    return (
      <div
        className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {product.primary_image_url ? (
            <img
              src={product.primary_image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
          {product.sku && (
            <p className="text-sm text-gray-500">SKU: {product.sku}</p>
          )}
        </div>
        <Badge variant="outline" className="text-xs">
          Position {product.position}
        </Badge>
      </div>
    )
  }

  return (
    <div
      className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {product.primary_image_url ? (
          <img
            src={product.primary_image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-xs bg-white/90 backdrop-blur-sm">
            #{product.position}
          </Badge>
        </div>
      </div>
      <div className="p-4">
        <h4 className="font-medium text-gray-900 truncate group-hover:text-black transition-colors">
          {product.name}
        </h4>
        {product.sku && (
          <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>
        )}
      </div>
    </div>
  )
}