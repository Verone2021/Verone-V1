'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Package, Euro, X, Check, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useProducts, Product } from '@/hooks/use-products'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'

interface AddProductModalProps {
  open: boolean
  onClose: () => void
  onProductAdded: () => void
  contextType: 'consultation' | 'sales_order' | 'purchase_order'
  contextId: string
  showSalePrice?: boolean // Afficher prix de vente (consultations + sales_orders)
}

interface ProductImage {
  id?: string
  public_url: string
  is_primary: boolean
  display_order?: number
}

export function AddProductModal({
  open,
  onClose,
  onProductAdded,
  contextType,
  contextId,
  showSalePrice = true
}: AddProductModalProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [salePrice, setSalePrice] = useState('') // Prix de vente HT
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  // Récupérer tous les produits non archivés
  const { products, loading: productsLoading } = useProducts({
    search: searchTerm
    // Note: On ne filtre pas par status pour permettre tous les produits non archivés
    // archived filter removed - not supported in ProductFilters
  })

  // Reset form when modal closes/opens
  useEffect(() => {
    if (!open) {
      setSelectedProduct(null)
      setQuantity(1)
      setSalePrice('')
      setNotes('')
      setSearchTerm('')
    }
  }, [open])

  // Pré-remplir le prix de vente avec le cost_price du produit sélectionné
  useEffect(() => {
    if (selectedProduct && showSalePrice) {
      // Utiliser le cost_price comme référence initiale
      // L'utilisateur peut le modifier pour proposer sa marge
      const suggestedPrice = selectedProduct.cost_price
        ? (selectedProduct.cost_price * 1.3).toFixed(2) // Marge 30% par défaut
        : ''
      setSalePrice(suggestedPrice)
    }
  }, [selectedProduct, showSalePrice])

  const handleAddProduct = async () => {
    if (!selectedProduct) {
      toast({
        title: "Produit requis",
        description: "Veuillez sélectionner un produit",
        variant: "destructive"
      })
      return
    }

    if (quantity <= 0) {
      toast({
        title: "Quantité invalide",
        description: "La quantité doit être supérieure à 0",
        variant: "destructive"
      })
      return
    }

    if (showSalePrice && (!salePrice || parseFloat(salePrice) <= 0)) {
      toast({
        title: "Prix de vente requis",
        description: "Veuillez saisir un prix de vente valide",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      let endpoint = ''
      const body: any = {
        product_id: selectedProduct.id,
        quantity,
        notes: notes.trim() || undefined
      }

      // Adapter selon le contexte
      if (contextType === 'consultation') {
        endpoint = '/api/consultations/associations'
        body.consultation_id = contextId
        body.proposed_price = showSalePrice ? parseFloat(salePrice) : selectedProduct.cost_price || 0
        body.is_free = false // Pas de checkbox "Gratuit" donc toujours false
      } else if (contextType === 'sales_order') {
        endpoint = '/api/sales-orders/items'
        body.sales_order_id = contextId
        body.unit_price_ht = showSalePrice ? parseFloat(salePrice) : selectedProduct.cost_price || 0
        body.discount_percentage = 0
      } else if (contextType === 'purchase_order') {
        endpoint = '/api/purchase-orders/items'
        body.purchase_order_id = contextId
        body.unit_price_ht = selectedProduct.cost_price || 0
        body.discount_percentage = 0
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'ajout du produit')
      }

      toast({
        title: "✅ Produit ajouté",
        description: `${selectedProduct.name} a été ajouté avec succès`
      })

      onProductAdded()
      onClose()

    } catch (error) {
      console.error('Erreur ajout produit:', error)
      toast({
        title: "❌ Erreur",
        description: error instanceof Error ? error.message : "Impossible d'ajouter le produit",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product)
  }

  const handleClearSelection = () => {
    setSelectedProduct(null)
    setQuantity(1)
    setSalePrice('')
    setNotes('')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Plus className="h-6 w-6" />
              Ajouter un produit
            </DialogTitle>
            <ButtonV2 variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </ButtonV2>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Section sélection produit */}
          {!selectedProduct ? (
            <>
              {/* Recherche */}
              <div>
                <Label>Rechercher un produit</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nom, SKU, fournisseur..."
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Liste produits */}
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  {products.length} produit{products.length > 1 ? 's' : ''} disponible{products.length > 1 ? 's' : ''}
                </p>

                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  {productsLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-3"></div>
                      <p className="text-gray-600">Chargement des produits...</p>
                    </div>
                  ) : products.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>Aucun produit trouvé</p>
                      <p className="text-sm mt-1">Essayez de modifier votre recherche</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {products.map((product) => {
                        // ✅ BR-TECH-002: Récupérer image via product_images
                        const productImages = product.product_images as ProductImage[] | undefined
                        const primaryImageUrl = productImages?.find(img => img.is_primary)?.public_url ||
                                               productImages?.[0]?.public_url ||
                                               null

                        return (
                          <div
                            key={product.id}
                            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => handleSelectProduct(product)}
                          >
                            <div className="flex items-start gap-4">
                              {/* Image produit */}
                              <div className="flex-shrink-0">
                                {primaryImageUrl ? (
                                  <img
                                    src={primaryImageUrl}
                                    alt={product.name}
                                    className="w-16 h-16 object-cover rounded border"
                                  />
                                ) : (
                                  <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                                    <Package className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>

                              {/* Détails produit */}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-base text-black">{product.name}</p>
                                <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                                {product.supplier_name && (
                                  <p className="text-sm text-gray-600">Fournisseur: {product.supplier_name}</p>
                                )}

                                {/* Prix d'achat indicatif */}
                                {product.cost_price && (
                                  <div className="mt-2">
                                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
                                      <Euro className="h-3 w-3 mr-1" />
                                      Prix d'achat: {formatCurrency(product.cost_price)} HT
                                    </Badge>
                                  </div>
                                )}
                              </div>

                              {/* Bouton sélection */}
                              <div className="flex-shrink-0">
                                <ButtonV2 size="sm" className="bg-black hover:bg-gray-800">
                                  <Check className="h-4 w-4 mr-1" />
                                  Sélectionner
                                </ButtonV2>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Produit sélectionné */}
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      {/* Image produit */}
                      <div className="flex-shrink-0">
                        {(() => {
                          const productImages = selectedProduct.product_images as ProductImage[] | undefined
                          const primaryImageUrl = productImages?.find(img => img.is_primary)?.public_url ||
                                                 productImages?.[0]?.public_url ||
                                                 null
                          return primaryImageUrl ? (
                            <img
                              src={primaryImageUrl}
                              alt={selectedProduct.name}
                              className="w-20 h-20 object-cover rounded border"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gray-100 rounded border flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )
                        })()}
                      </div>

                      {/* Détails */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Check className="h-5 w-5 text-green-600" />
                          <p className="font-semibold text-lg text-black">{selectedProduct.name}</p>
                        </div>
                        <p className="text-sm text-gray-600">SKU: {selectedProduct.sku}</p>
                        {selectedProduct.supplier_name && (
                          <p className="text-sm text-gray-600">Fournisseur: {selectedProduct.supplier_name}</p>
                        )}
                        {selectedProduct.cost_price && (
                          <div className="mt-2">
                            <Badge variant="outline" className="bg-white text-gray-700 border-gray-300">
                              <Euro className="h-3 w-3 mr-1" />
                              Prix d'achat: {formatCurrency(selectedProduct.cost_price)} HT
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <ButtonV2 variant="outline" size="sm" onClick={handleClearSelection}>
                      <X className="h-4 w-4 mr-1" />
                      Changer
                    </ButtonV2>
                  </div>
                </CardContent>
              </Card>

              {/* Formulaire ajout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quantité */}
                <div>
                  <Label htmlFor="quantity">Quantité *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                </div>

                {/* Prix de vente HT (uniquement si showSalePrice) */}
                {showSalePrice && (
                  <div>
                    <Label htmlFor="salePrice" className="flex items-center gap-1">
                      <Euro className="h-4 w-4" />
                      Prix de vente HT * (€)
                    </Label>
                    <Input
                      id="salePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      placeholder="Prix proposé au client..."
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Prix d'achat indicatif: {selectedProduct.cost_price ? formatCurrency(selectedProduct.cost_price) : 'N/A'}
                    </p>
                  </div>
                )}
              </div>

              {/* Notes optionnelles */}
              <div>
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Remarques particulières, conditions spéciales..."
                  rows={3}
                  className="mt-1 resize-none"
                />
              </div>

              {/* Alerte info */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {showSalePrice ? (
                    <p className="text-sm">
                      Le <strong>prix d'achat</strong> est affiché à titre indicatif (dernier prix actif).
                      Le <strong>prix de vente HT</strong> est votre proposition commerciale au client.
                    </p>
                  ) : (
                    <p className="text-sm">
                      Le <strong>prix d'achat</strong> sera utilisé comme prix unitaire de la commande.
                    </p>
                  )}
                </AlertDescription>
              </Alert>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <ButtonV2
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </ButtonV2>

                <ButtonV2
                  onClick={handleAddProduct}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Ajout en cours...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter à la {contextType === 'consultation' ? 'consultation' : 'commande'}
                    </>
                  )}
                </ButtonV2>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
