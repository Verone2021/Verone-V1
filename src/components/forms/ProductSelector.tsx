/**
 * 🔍 ProductSelector - Composant pour ajouter produits existants aux groupes de variantes
 *
 * Modal de sélection avec recherche pour ajouter des produits existants
 * à un groupe de variantes
 */

"use client"

import { useState, useEffect } from 'react'
import { ButtonV2 } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Search, Package, Plus, Loader2, Check } from 'lucide-react'
import { useVariantProducts } from '@/hooks/use-variant-products'

interface Product {
  id: string
  name: string
  sku: string
  price_ht: number
  status: string
  variant_group_id: string | null
}

interface ProductSelectorProps {
  isOpen: boolean
  onClose: () => void
  variantGroupId: string
  groupName: string
  onProductsAdded: (count: number) => void
}

export function ProductSelector({
  isOpen,
  onClose,
  variantGroupId,
  groupName,
  onProductsAdded
}: ProductSelectorProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  const { addProductToVariantGroup, getAvailableProductsForVariantGroup } = useVariantProducts()

  // Rechercher les produits disponibles
  const searchProducts = async (search?: string) => {
    setSearching(true)
    try {
      const products = await getAvailableProductsForVariantGroup(search, 50)
      setAvailableProducts(products as any)
    } catch (error) {
      console.error('Error searching products:', error)
    } finally {
      setSearching(false)
    }
  }

  // Charger les produits au montage et à chaque changement de recherche
  useEffect(() => {
    if (isOpen) {
      searchProducts(searchTerm)
    }
  }, [isOpen, searchTerm])

  // Reset lors de l'ouverture/fermeture
  useEffect(() => {
    if (isOpen) {
      setSelectedProducts(new Set())
      setSearchTerm('')
    }
  }, [isOpen])

  // Gérer la sélection/désélection d'un produit
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  // Ajouter les produits sélectionnés au groupe
  const handleAddProducts = async () => {
    if (selectedProducts.size === 0) {
      toast({
        title: "❌ Aucun produit sélectionné",
        description: "Veuillez sélectionner au moins un produit",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    let addedCount = 0

    try {
      // Ajouter chaque produit sélectionné au groupe
      for (const productId of selectedProducts) {
        const success = await addProductToVariantGroup(productId, variantGroupId)
        if (success) {
          addedCount++
        }
      }

      if (addedCount > 0) {
        toast({
          title: "✅ Produits ajoutés",
          description: `${addedCount} produit(s) ajouté(s) au groupe "${groupName}"`
        })
        onProductsAdded(addedCount)
        onClose()
      } else {
        toast({
          title: "❌ Erreur",
          description: "Aucun produit n'a pu être ajouté",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error adding products:', error)
      toast({
        title: "❌ Erreur",
        description: "Une erreur est survenue lors de l'ajout",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Obtenir le statut badge pour un produit
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Badge variant="outline" className="border-green-300 text-green-600 text-xs">En stock</Badge>
      case 'out_of_stock':
        return <Badge variant="outline" className="border-red-300 text-red-600 text-xs">Rupture</Badge>
      case 'draft':
        return <Badge variant="outline" className="border-gray-300 text-gray-600 text-xs">Brouillon</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-black">
            Ajouter des produits au groupe "{groupName}"
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Sélectionnez les produits existants à ajouter à ce groupe de variantes
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher des produits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 focus:border-black"
            />
          </div>

          {/* Information sur la sélection */}
          {selectedProducts.size > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                {selectedProducts.size} produit(s) sélectionné(s) •
                Maximum 30 produits par groupe (Google Merchant Center)
              </p>
            </div>
          )}

          {/* Liste des produits */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {searching ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
                  <p className="text-gray-600">Recherche en cours...</p>
                </div>
              </div>
            ) : availableProducts.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun produit trouvé</p>
                  <p className="text-sm text-gray-500">
                    {searchTerm ? 'Essayez un autre terme de recherche' : 'Tous les produits disponibles sont déjà dans des groupes'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y">
                {availableProducts.map((product) => {
                  const isSelected = selectedProducts.has(product.id)
                  return (
                    <div
                      key={product.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => toggleProductSelection(product.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-gray-900">{product.name}</h4>
                            {getStatusBadge(product.status)}
                            {isSelected && (
                              <Check className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>SKU: {product.sku}</span>
                            <span>Prix: {product.price_ht}€ HT</span>
                          </div>
                        </div>
                        <ButtonV2
                          variant={isSelected ? "secondary" : "outline"}
                          size="sm"
                          className={isSelected ? "bg-blue-600 hover:bg-blue-700" : "border-gray-300"}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleProductSelection(product.id)
                          }}
                        >
                          {isSelected ? (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Sélectionné
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-1" />
                              Ajouter
                            </>
                          )}
                        </ButtonV2>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-gray-500">
            {availableProducts.length} produit(s) disponible(s)
          </p>
          <div className="flex space-x-3">
            <ButtonV2
              variant="outline"
              onClick={onClose}
              className="border-gray-300 hover:bg-gray-50"
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              onClick={handleAddProducts}
              disabled={loading || selectedProducts.size === 0}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Ajouter {selectedProducts.size > 0 ? `(${selectedProducts.size})` : ''}
            </ButtonV2>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}