'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Minus, Search, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useProducts } from '@/hooks/use-products'
import { useCategories } from '@/hooks/use-categories'
import { useCollections } from '@/hooks/use-collections'
import { formatCurrency, cn } from '@/lib/utils'
import type { OrderType, CreateOrderItemData } from '@/hooks/use-order-items'

/**
 * Modal Universel Ajout Produit à Commande
 *
 * Composant réutilisable pour achats ET ventes.
 * Affiche prix indicatifs selon orderType (cost_price vs min_selling_price).
 * Permet configuration complète item (quantité, prix, remise, éco-taxe, TVA si ventes).
 *
 * @example
 * // Commandes Achats
 * <AddProductToOrderModal
 *   open={showModal}
 *   onClose={() => setShowModal(false)}
 *   orderType="purchase"
 *   onAdd={(data) => addItem(data)}
 * />
 *
 * @example
 * // Commandes Ventes
 * <AddProductToOrderModal
 *   open={showModal}
 *   onClose={() => setShowModal(false)}
 *   orderType="sales"
 *   onAdd={(data) => addItem(data)}
 * />
 */

interface AddProductToOrderModalProps {
  open: boolean
  onClose: () => void
  orderType: OrderType
  onAdd: (data: CreateOrderItemData) => Promise<void> | void
}

interface ProductImage {
  public_url: string
  is_primary: boolean
  display_order?: number
}

export function AddProductToOrderModal({
  open,
  onClose,
  orderType,
  onAdd
}: AddProductToOrderModalProps) {
  // État recherche/filtres
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [collectionFilter, setCollectionFilter] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)

  // État configuration item
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  const [discountPercentage, setDiscountPercentage] = useState(0)
  const [ecoTax, setEcoTax] = useState(0)
  const [taxRate, setTaxRate] = useState(0.20)  // TVA 20% par défaut (ventes)
  const [notes, setNotes] = useState('')

  // État loading
  const [isAdding, setIsAdding] = useState(false)

  // Hooks data
  const { products, loading: loadingProducts } = useProducts()
  const { categories } = useCategories()
  const { collections } = useCollections()

  // Auto-remplir prix/éco-taxe quand produit sélectionné
  useEffect(() => {
    if (selectedProduct) {
      // Prix selon orderType
      const defaultPrice = orderType === 'purchase'
        ? selectedProduct.cost_price || 0
        : selectedProduct.min_selling_price || 0

      setUnitPrice(defaultPrice)
      setEcoTax(selectedProduct.eco_tax_default || 0)
    }
  }, [selectedProduct, orderType])

  // Filtrer produits selon recherche/filtres
  const filteredProducts = useMemo(() => {
    if (!products) return []

    return products.filter(product => {
      // Recherche texte (nom, SKU)
      const matchesSearch = !searchQuery || (
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      )

      // Filtre catégorie
      const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter

      // Filtre collection
      const matchesCollection = collectionFilter === 'all' || product.collection_id === collectionFilter

      // Filtrer produits archivés
      const notArchived = !product.archived_at

      return matchesSearch && matchesCategory && matchesCollection && notArchived
    })
  }, [products, searchQuery, categoryFilter, collectionFilter])

  // Calculer totaux aperçu
  const previewSubtotal = quantity * unitPrice * (1 - discountPercentage / 100)
  const previewTotal = previewSubtotal + ecoTax

  // Labels dynamiques selon orderType
  const getPriceLabel = () =>
    orderType === 'purchase' ? 'Prix achat indicatif' : 'Prix vente min indicatif'

  const getModalTitle = () =>
    orderType === 'purchase'
      ? 'Ajouter un produit à la commande fournisseur'
      : 'Ajouter un produit à la commande client'

  // Récupérer image primaire produit
  const getPrimaryImage = (product: any): string | null => {
    const images = product.product_images as ProductImage[] | undefined
    return images?.find(img => img.is_primary)?.public_url ||
           images?.[0]?.public_url ||
           null
  }

  // Gérer ajout produit
  const handleAdd = async () => {
    if (!selectedProduct) return

    // Validation
    if (quantity <= 0) {
      alert('La quantité doit être supérieure à 0')
      return
    }

    if (unitPrice < 0) {
      alert('Le prix unitaire ne peut pas être négatif')
      return
    }

    if (discountPercentage < 0 || discountPercentage > 100) {
      alert('La remise doit être entre 0 et 100%')
      return
    }

    if (ecoTax < 0) {
      alert('L\'éco-taxe ne peut pas être négative')
      return
    }

    setIsAdding(true)

    try {
      // Préparer données item
      const itemData: CreateOrderItemData = {
        product_id: selectedProduct.id,
        quantity,
        unit_price_ht: unitPrice,
        discount_percentage: discountPercentage,
        eco_tax: ecoTax,
        notes: notes.trim() || undefined
      }

      // Ajouter TVA si ventes
      if (orderType === 'sales') {
        itemData.tax_rate = taxRate
      }

      // Appeler callback parent
      await onAdd(itemData)

      // Reset et fermer
      resetForm()
      onClose()
    } catch (err) {
      console.error('❌ Erreur ajout produit:', err)
      alert(`Erreur lors de l'ajout du produit: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
    } finally {
      setIsAdding(false)
    }
  }

  // Reset formulaire
  const resetForm = () => {
    setSelectedProduct(null)
    setQuantity(1)
    setUnitPrice(0)
    setDiscountPercentage(0)
    setEcoTax(0)
    setTaxRate(0.20)
    setNotes('')
    setSearchQuery('')
    setCategoryFilter('all')
    setCollectionFilter('all')
  }

  // Reset au close
  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          <DialogDescription>
            Recherchez un produit, puis configurez la quantité, le prix et les options.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* SECTION 1 : Recherche/Sélection Produit */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un produit (nom, SKU, code-barres)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchQuery && (
                <ButtonV2
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </ButtonV2>
              )}
            </div>

            {/* Filtres */}
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Toutes catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={collectionFilter} onValueChange={setCollectionFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Toutes collections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes collections</SelectItem>
                  {collections?.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Grille Produits */}
            <div className="border rounded-lg p-4 bg-gray-50">
              {loadingProducts ? (
                <div className="text-center text-gray-500 py-8">
                  Chargement des produits...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Aucun produit trouvé
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {filteredProducts.map((product) => {
                    const primaryImage = getPrimaryImage(product)
                    const isSelected = selectedProduct?.id === product.id

                    return (
                      <Card
                        key={product.id}
                        className={cn(
                          'cursor-pointer transition-all hover:shadow-md',
                          isSelected && 'ring-2 ring-primary bg-primary/5'
                        )}
                        onClick={() => setSelectedProduct(product)}
                      >
                        <CardContent className="p-4">
                          {/* Image */}
                          {primaryImage ? (
                            <img
                              src={primaryImage}
                              alt={product.name}
                              className="w-full h-32 object-cover rounded mb-2"
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-200 rounded mb-2 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">Pas d'image</span>
                            </div>
                          )}

                          {/* Info */}
                          <p className="font-medium text-sm line-clamp-2 mb-1">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500 mb-2">
                            {product.sku}
                          </p>

                          {/* Prix indicatif */}
                          <p className="text-sm font-bold text-primary">
                            {orderType === 'purchase'
                              ? `Achat: ${formatCurrency(product.cost_price || 0)}`
                              : `Vente min: ${formatCurrency(product.min_selling_price || 0)}`
                            }
                          </p>

                          {/* Éco-taxe */}
                          {product.eco_tax_default > 0 && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              Éco-taxe: {formatCurrency(product.eco_tax_default)}
                            </Badge>
                          )}

                          {/* Stock (ventes uniquement) */}
                          {orderType === 'sales' && (
                            <p className="text-xs text-gray-600 mt-1">
                              Stock: {product.stock_real || 0}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2 : Configuration Item (si produit sélectionné) */}
          {selectedProduct && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Configuration de la ligne</h3>

                {/* Produit sélectionné (recap) */}
                <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg">
                  {getPrimaryImage(selectedProduct) && (
                    <img
                      src={getPrimaryImage(selectedProduct)!}
                      alt={selectedProduct.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{selectedProduct.name}</p>
                    <p className="text-sm text-gray-600">{selectedProduct.sku}</p>
                  </div>
                  <ButtonV2
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedProduct(null)}
                  >
                    <X className="h-4 w-4" />
                  </ButtonV2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Quantité avec +/- */}
                  <div>
                    <Label>Quantité *</Label>
                    <div className="flex gap-2 items-center mt-2">
                      <ButtonV2
                        size="sm"
                        variant="outline"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </ButtonV2>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 text-center"
                        min="1"
                      />
                      <ButtonV2
                        size="sm"
                        variant="outline"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </ButtonV2>
                    </div>
                  </div>

                  {/* Prix unitaire */}
                  <div>
                    <Label>
                      Prix unitaire HT * €
                      <span className="text-xs text-gray-500 ml-2 font-normal">
                        ({getPriceLabel()}: {formatCurrency(
                          orderType === 'purchase'
                            ? selectedProduct.cost_price || 0
                            : selectedProduct.min_selling_price || 0
                        )})
                      </span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="mt-2"
                      min="0"
                    />
                  </div>

                  {/* Remise */}
                  <div>
                    <Label>Remise %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="mt-2"
                    />
                  </div>

                  {/* Éco-taxe */}
                  <div>
                    <Label>
                      Éco-taxe €
                      <span className="text-xs text-gray-500 ml-2 font-normal">
                        (indicative: {formatCurrency(selectedProduct.eco_tax_default || 0)})
                      </span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ecoTax}
                      onChange={(e) => setEcoTax(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="mt-2"
                      min="0"
                    />
                  </div>

                  {/* TVA (VENTES UNIQUEMENT) */}
                  {orderType === 'sales' && (
                    <div>
                      <Label>Taux TVA %</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={taxRate * 100}
                        onChange={(e) => setTaxRate((parseFloat(e.target.value) || 20) / 100)}
                        placeholder="20"
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>

                {/* Notes ligne */}
                <div>
                  <Label>Notes (optionnel)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Commentaire spécifique à cette ligne..."
                    rows={2}
                    className="mt-2"
                  />
                </div>

                {/* Aperçu total */}
                <div className="bg-gray-50 p-4 rounded border">
                  <h4 className="font-semibold mb-3">Aperçu</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sous-total HT:</span>
                      <span className="font-medium">{formatCurrency(previewSubtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Éco-taxe:</span>
                      <span className="font-medium">{formatCurrency(ecoTax)}</span>
                    </div>
                    {discountPercentage > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Remise ({discountPercentage}%):</span>
                        <span>-{formatCurrency(quantity * unitPrice * (discountPercentage / 100))}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg">
                      <span className="font-bold">Total ligne HT:</span>
                      <span className="font-bold text-primary">{formatCurrency(previewTotal)}</span>
                    </div>
                    {orderType === 'sales' && (
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>TVA ({(taxRate * 100).toFixed(1)}%):</span>
                        <span>{formatCurrency(previewTotal * taxRate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <ButtonV2 variant="outline" onClick={onClose} disabled={isAdding}>
            Annuler
          </ButtonV2>
          <ButtonV2
            onClick={handleAdd}
            disabled={!selectedProduct || isAdding}
          >
            {isAdding ? (
              'Ajout en cours...'
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter à la commande
              </>
            )}
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
