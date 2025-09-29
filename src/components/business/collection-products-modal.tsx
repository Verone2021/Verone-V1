/**
 * Modal de gestion des produits dans une collection - Vérone Back Office
 */

'use client'

import { useState, useEffect } from 'react'
import { Package, Plus, Trash2, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
// import { ScrollArea } from '@/components/ui/scroll-area' // Temporairement désactivé
import { createClient } from '@/lib/supabase/client'
import { Collection } from '@/hooks/use-collections'
import { useToast } from '@/hooks/use-toast'

interface CollectionProductsModalProps {
  collection: Collection | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

interface Product {
  id: string
  name: string
  sku: string
  image_url?: string
  subcategory_name?: string
  status: string
}

export function CollectionProductsModal({
  collection,
  isOpen,
  onClose,
  onUpdate,
}: CollectionProductsModalProps) {
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [collectionProducts, setCollectionProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  // Charger les produits disponibles et ceux de la collection
  useEffect(() => {
    if (!collection || !isOpen) return
    loadProducts()
  }, [collection, isOpen])

  const loadProducts = async () => {
    if (!collection) return
    setLoading(true)

    try {
      // Récupérer tous les produits validés du catalogue (creation_mode = 'complete')
      const { data: allProducts, error: productsError } = await supabase
        .from('products')
        .select(`
          id, name, sku, status, creation_mode,
          product_images (
            public_url,
            is_primary
          )
        `)
        .eq('creation_mode', 'complete')
        .order('name')

      if (productsError) throw productsError

      // Récupérer les produits déjà dans la collection
      const { data: collectionProductsData, error: collectionError } = await supabase
        .from('collection_products')
        .select(`
          products:product_id (
            id, name, sku, status,
            product_images (
              public_url,
              is_primary
            )
          )
        `)
        .eq('collection_id', collection.id)

      if (collectionError) throw collectionError

      // Transformer les données
      const transformedProducts = (allProducts || []).map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        image_url: p.product_images?.find(img => img.is_primary)?.public_url,
        subcategory_name: undefined,
        status: p.status
      }))

      const inCollectionIds = collectionProductsData
        ?.map(cp => cp.products?.id)
        .filter(Boolean) || []

      const inCollectionProducts = collectionProductsData
        ?.map(cp => cp.products ? {
          id: cp.products.id,
          name: cp.products.name,
          sku: cp.products.sku,
          image_url: cp.products.product_images?.find(img => img.is_primary)?.public_url,
          subcategory_name: undefined,
          status: cp.products.status
        } : null)
        .filter(Boolean) as Product[] || []

      const availableProductsList = transformedProducts
        .filter(p => !inCollectionIds.includes(p.id))

      setAvailableProducts(availableProductsList)
      setCollectionProducts(inCollectionProducts)

    } catch (error) {
      console.error('Erreur chargement produits:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const addProductToCollection = async (product: Product) => {
    if (!collection) return

    try {
      const { error } = await supabase
        .from('collection_products')
        .insert({
          collection_id: collection.id,
          product_id: product.id,
          position: collectionProducts.length
        })

      if (error) throw error

      // Mettre à jour les listes localement
      setAvailableProducts(prev => prev.filter(p => p.id !== product.id))
      setCollectionProducts(prev => [...prev, product])

      toast({
        title: "Produit ajouté",
        description: `${product.name} a été ajouté à la collection`,
      })

      onUpdate()
    } catch (error) {
      console.error('Erreur ajout produit:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le produit",
        variant: "destructive"
      })
    }
  }

  const removeProductFromCollection = async (product: Product) => {
    if (!collection) return

    try {
      const { error } = await supabase
        .from('collection_products')
        .delete()
        .eq('collection_id', collection.id)
        .eq('product_id', product.id)

      if (error) throw error

      // Mettre à jour les listes localement
      setCollectionProducts(prev => prev.filter(p => p.id !== product.id))
      setAvailableProducts(prev => [...prev, product].sort((a, b) =>
        a.name.localeCompare(b.name)
      ))

      toast({
        title: "Produit retiré",
        description: `${product.name} a été retiré de la collection`,
      })

      onUpdate()
    } catch (error) {
      console.error('Erreur retrait produit:', error)
      toast({
        title: "Erreur",
        description: "Impossible de retirer le produit",
        variant: "destructive"
      })
    }
  }

  const filteredAvailable = availableProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gérer les produits - {collection?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 h-full">
          {/* Produits disponibles */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Produits disponibles</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="h-[50vh] border rounded-lg p-4 overflow-y-auto">
              {loading ? (
                <div className="text-center text-gray-500 py-8">
                  Chargement...
                </div>
              ) : filteredAvailable.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Aucun produit disponible
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAvailable.map(product => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            {product.sku}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addProductToCollection(product)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Produits dans la collection */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">
                Dans la collection ({collectionProducts.length})
              </h3>
            </div>

            <div className="h-[50vh] border rounded-lg p-4 overflow-y-auto">
              {collectionProducts.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Aucun produit dans cette collection
                </div>
              ) : (
                <div className="space-y-2">
                  {collectionProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{index + 1}</Badge>
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            {product.sku}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => removeProductFromCollection(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            {collectionProducts.length} produit{collectionProducts.length !== 1 ? 's' : ''} dans la collection
          </div>
          <Button onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}